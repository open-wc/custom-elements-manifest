var analyzer = (function (exports, ts) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

  /**
   * GENERAL UTILITIES
   */

  const has = arr => Array.isArray(arr) && arr.length > 0;

  function isBareModuleSpecifier(specifier) {
    return !!specifier?.replace(/'/g, '')[0].match(/[@a-zA-Z]/g);
  }

  function resolveModuleOrPackageSpecifier(moduleDoc, name) {
    const foundImport = moduleDoc?.imports?.find(_import => _import.name === name);

    /* item is imported from another file */
    if(foundImport) {
      if(foundImport.isBareModuleSpecifier) {
        /* import is from 3rd party package */
        return { package: foundImport.importPath }
      } else {
        /* import is imported from a local module */
        return { module: new URL(foundImport.importPath, `file:///${moduleDoc.path}`).pathname }
      }
    } else {
      /* item is in current module */
      return { module: moduleDoc.path }
    }
  }

  /**
   * TS seems to struggle sometimes with the `.getText()` method on JSDoc annotations, like `@deprecated` in ts v4.0.0 and `@override` in ts v4.3.2
   * This is a bug in TS, but still annoying, so we add some safety rails here
   */
  const safe = (cb, returnType = '') => {
    try {
      return cb();
    } catch {
      return returnType;
    }
  };

  /**
   * UTILITIES RELATED TO MODULE IMPORTS
   */

  /** @example import defaultExport from 'foo'; */
  function hasDefaultImport(node) {
    return !!node?.importClause?.name;
  }

  /** @example import {namedA, namedB} from 'foo'; */
  function hasNamedImport(node) {
    return has(node?.importClause?.namedBindings?.elements);
  }

  /** @example import * as name from './my-module.js'; */
  function hasAggregatingImport(node) {
    return !!node?.importClause?.namedBindings?.name && !hasNamedImport(node);
  }

  /**
   * COLLECT-IMPORTS
   * 
   * Collects a modules imports so that declarations can later be resolved to their module/package.
   * 
   * Imports are not specified in the schema, so they will be deleted from the Manifest at a later stage.
   */
  function collectImportsPlugin() {
    const imports = [];

    return {
      analyzePhase({node, moduleDoc}){

        /** 
         * @example import defaultExport from 'foo'; 
         */
        if (hasDefaultImport(node)) {
          const importTemplate = {
            name: node.importClause.name.text,
            kind: 'default',
            importPath: node.moduleSpecifier.text,
            isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
          };
          imports.push(importTemplate);
        }

        /**
         * @example import { export1, export2 } from 'foo';
         * @example import { export1 as alias1 } from 'foo';
         * @example import { export1, export2 as alias2 } from 'foo';
         */
        if (hasNamedImport(node)) {
          node.importClause.namedBindings.elements.forEach((element) => {
            const importTemplate = {
              name: element.name.text,
              kind: 'named',
              importPath: node.moduleSpecifier.text,
              isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
            };
            imports.push(importTemplate);
          });
        }

        /** 
         * @example import * as name from './my-module.js'; 
         */
        if (hasAggregatingImport(node)) {
          const importTemplate = {
            name: node.importClause.namedBindings.name.text,
            kind: 'aggregate',
            importPath: node.moduleSpecifier.text,
            isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
          };
          imports.push(importTemplate);
        }

        moduleDoc.imports = imports;
      },

      packageLinkPhase({customElementsManifest, context}){
        /**
         * Delete `imports` from the moduleDoc, since they are not specced in the schema
         * and we only need them during AST stuff.
         */
        customElementsManifest.modules.forEach(moduleDoc => {
          delete moduleDoc.imports;
        });
      },
    }
  }

  /**
   * UTILITIES RELATED TO MODULE EXPORTS
   */

  function hasExportModifier(node) {
    if (has(node?.modifiers)) {
      if (node.modifiers.some(mod => mod.kind === ts__default['default'].SyntaxKind.ExportKeyword)) {
        return true;
      }
    }
    return false;
  }

  function hasDefaultModifier(node) {
    if (has(node?.modifiers)) {
      if (node.modifiers.some(mod => mod.kind === ts__default['default'].SyntaxKind.DefaultKeyword)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @example export { var1, var2 };
   */
  function hasNamedExports(node) {
    if (has(node?.exportClause?.elements)) {
      return true;
    }
    return false;
  }

  /**
   * @example export { var1, var2 } from 'foo';
   */
  function isReexport(node) {
    if (node?.moduleSpecifier !== undefined) {
      return true;
    }
    return false;
  }

  /**
   * EXPORTS
   * 
   * Analyzes a modules exports and adds them to the moduleDoc
   */
  function exportsPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        /**
         * @example export const foo = '';
         */
        if(hasExportModifier(node) && ts.isVariableStatement(node)) {
          node?.declarationList?.declarations?.forEach(declaration => {
            const _export = {          
              kind: 'js',
              name: declaration.name.getText(),
              declaration: {
                name: declaration.name.getText(),
                module: moduleDoc.path,
              },
            };

            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          });
        }

        /**
         * @example export default var1;
         */
        if (node.kind === ts.SyntaxKind.ExportAssignment) {
          const _export = {
            kind: 'js',
            name: 'default',
            declaration: {
              name: node.expression.text,
              module: moduleDoc.path,
            },
          };
          moduleDoc.exports = [...(moduleDoc.exports || []), _export];
        }

        if (node.kind === ts.SyntaxKind.ExportDeclaration) {

          /**
           * @example export { var1, var2 };
           */
          if (hasNamedExports(node) && !isReexport(node)) {
            node.exportClause?.elements?.forEach((element) => {
              const _export = {
                kind: 'js',
                name: element.name.getText(),
                declaration: {
                  name: element.propertyName?.getText() || element.name.getText(),
                  module: moduleDoc.path,
                },
              };

              moduleDoc.exports = [...(moduleDoc.exports || []), _export];
            });
          }

          /**
           * @example export * from 'foo';
           * @example export * from './my-module.js';
           */
          if (isReexport(node) && !hasNamedExports(node)) {
            const _export = {
              kind: 'js',
              name: '*',
              declaration: {
                name: '*',
                package: node.moduleSpecifier.getText().replace(/'/g, ''),
              },
            };
            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          }

          /**
           * @example export { var1, var2 } from 'foo';
           * @example export { var1, var2 } from './my-module.js';
           */
          if (isReexport(node) && hasNamedExports(node)) {
            node.exportClause?.elements?.forEach((element) => {
              const _export = {
                kind: 'js',
                name: element.name.getText(),
                declaration: {
                  name: element.propertyName?.getText() || element.name.getText(),
                },
              };

              if (isBareModuleSpecifier(node.moduleSpecifier.getText())) {
                _export.declaration.package = node.moduleSpecifier.getText().replace(/'/g, '');
              } else {
                _export.declaration.module = node.moduleSpecifier.getText().replace(/'/g, '');
              }

              moduleDoc.exports = [...(moduleDoc.exports || []), _export];
            });
          }
        }

        /**
         * @example export function foo() {}
         */
        if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
          if (hasExportModifier(node)) {
            const isDefault = hasDefaultModifier(node);
            const _export = {
              kind: 'js',
              name: isDefault ? 'default' : node.name?.getText() || '',
              declaration: {
                name: isDefault ? 'default' : node.name?.getText() || '',
                module: moduleDoc.path,
              },
            };

            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          }
        }

        /**
         * @example export class Class1 {}
         */
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
          if (hasExportModifier(node)) {
            const isDefault = hasDefaultModifier(node);
            const _export = {
              kind: 'js',
              name: isDefault ? 'default' : node?.name?.text || '',
              declaration: {
                name: isDefault ? 'default' : node?.name?.text || '',
                module: moduleDoc.path,
              },
            };
            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          }
        }
      }
    }
  }

  /**
   * AST HELPERS
   */

  const isProperty = node => ts__default['default'].isPropertyDeclaration(node) || ts__default['default'].isGetAccessor(node) || ts__default['default'].isSetAccessor(node);

  /**
   * @example this.dispatchEvent(new Event('foo'));
   */
  const isDispatchEvent = node => node.expression?.name?.getText() === 'dispatchEvent' && node?.expression?.expression?.kind === ts__default['default'].SyntaxKind.ThisKeyword;

  const isReturnStatement = statement => statement?.kind === ts__default['default'].SyntaxKind.ReturnStatement;

  /**
   * @example customElements.define('my-el', MyEl);
   * @example window.customElements.define('my-el', MyEl);
   */
  const isCustomElementsDefineCall = node => (node?.expression?.getText() === 'customElements' || node?.expression?.getText() === 'window.customElements') && node?.name?.getText() === 'define';

  /**
   * @example @attr
   */
  function hasAttrAnnotation(member) {
    return member?.jsDoc?.some(jsDoc => jsDoc?.tags?.some(tag => safe(() => tag?.tagName?.getText()) === 'attr'));
  }


  /** 
   * Whether or not node is:
   * - Number
   * - String
   * - Boolean
   * - Null
   */
  function isPrimitive(node) {
    return node && (ts__default['default'].isNumericLiteral(node) ||
    ts__default['default'].isStringLiteral(node) ||
    node?.kind === ts__default['default'].SyntaxKind.NullKeyword ||
    node?.kind === ts__default['default'].SyntaxKind.TrueKeyword ||
    node?.kind === ts__default['default'].SyntaxKind.FalseKeyword)
  }

  /**
   * Checks if a VariableStatement has an initializer
   * @example `let foo;` will return false
   * @example `let foo = '';` will return true
   */
  function hasInitializer(node) {
    return node?.declarationList?.declarations?.some(declaration => declaration?.initializer);
  }

  /**
   * CUSTOM-ELEMENTS-DEFINE-CALLS
   * 
   * Analyzes calls for:
   * @example customElements.define()
   * @example window.customElements.define()
   */
  function customElementsDefineCallsPlugin() {
    return {
      analyzePhase({node, moduleDoc}){    

        /** 
         * @example customElements.define('my-el', MyEl); 
         * @example window.customElements.define('my-el', MyEl);
         */
        if(isCustomElementsDefineCall(node)) {
          const elementClass = node.parent.arguments[1].text;
          const elementTag = node.parent.arguments[0].text;

          const definitionDoc = {
            kind: 'custom-element-definition',
            name: elementTag,
            declaration: {
              name: elementClass,
              ...resolveModuleOrPackageSpecifier(moduleDoc, elementClass)
            },
          };
      

          moduleDoc.exports = [...(moduleDoc.exports || []), definitionDoc];
        }
      }
    }
  }

  function isSpace(source) {
      return /^\s+$/.test(source);
  }
  function splitSpace(source) {
      const matches = source.match(/^\s+/);
      return matches == null
          ? ['', source]
          : [source.slice(0, matches[0].length), source.slice(matches[0].length)];
  }
  function splitLines(source) {
      return source.split(/\r?\n/);
  }
  function seedSpec(spec = {}) {
      return Object.assign({ tag: '', name: '', type: '', optional: false, description: '', problems: [], source: [] }, spec);
  }
  function seedTokens(tokens = {}) {
      return Object.assign({ start: '', delimiter: '', postDelimiter: '', tag: '', postTag: '', name: '', postName: '', type: '', postType: '', description: '', end: '' }, tokens);
  }

  const reTag = /^@\S+/;
  /**
   * Creates configured `Parser`
   * @param {Partial<Options>} options
   */
  function getParser$3({ fence = '```', } = {}) {
      const fencer = getFencer(fence);
      const toggleFence = (source, isFenced) => fencer(source) ? !isFenced : isFenced;
      return function parseBlock(source) {
          // start with description section
          const sections = [[]];
          let isFenced = false;
          for (const line of source) {
              if (reTag.test(line.tokens.description) && !isFenced) {
                  sections.push([line]);
              }
              else {
                  sections[sections.length - 1].push(line);
              }
              isFenced = toggleFence(line.tokens.description, isFenced);
          }
          return sections;
      };
  }
  function getFencer(fence) {
      if (typeof fence === 'string')
          return (source) => source.split(fence).length % 2 === 0;
      return fence;
  }

  var Markers;
  (function (Markers) {
      Markers["start"] = "/**";
      Markers["nostart"] = "/***";
      Markers["delim"] = "*";
      Markers["end"] = "*/";
  })(Markers || (Markers = {}));

  function getParser$2({ startLine = 0, } = {}) {
      let block = null;
      let num = startLine;
      return function parseSource(source) {
          let rest = source;
          const tokens = seedTokens();
          [tokens.start, rest] = splitSpace(rest);
          if (block === null &&
              rest.startsWith(Markers.start) &&
              !rest.startsWith(Markers.nostart)) {
              block = [];
              tokens.delimiter = rest.slice(0, Markers.start.length);
              rest = rest.slice(Markers.start.length);
              [tokens.postDelimiter, rest] = splitSpace(rest);
          }
          if (block === null) {
              num++;
              return null;
          }
          const isClosed = rest.trimRight().endsWith(Markers.end);
          if (tokens.delimiter === '' &&
              rest.startsWith(Markers.delim) &&
              !rest.startsWith(Markers.end)) {
              tokens.delimiter = Markers.delim;
              rest = rest.slice(Markers.delim.length);
              [tokens.postDelimiter, rest] = splitSpace(rest);
          }
          if (isClosed) {
              const trimmed = rest.trimRight();
              tokens.end = rest.slice(trimmed.length - Markers.end.length);
              rest = trimmed.slice(0, -Markers.end.length);
          }
          tokens.description = rest;
          block.push({ number: num, source, tokens });
          num++;
          if (isClosed) {
              const result = block.slice();
              block = null;
              return result;
          }
          return null;
      };
  }

  function getParser$1({ tokenizers }) {
      return function parseSpec(source) {
          var _a;
          let spec = seedSpec({ source });
          for (const tokenize of tokenizers) {
              spec = tokenize(spec);
              if ((_a = spec.problems[spec.problems.length - 1]) === null || _a === void 0 ? void 0 : _a.critical)
                  break;
          }
          return spec;
      };
  }

  /**
   * Splits the `@prefix` from remaining `Spec.lines[].token.descrioption` into the `tag` token,
   * and populates `spec.tag`
   */
  function tagTokenizer() {
      return (spec) => {
          const { tokens } = spec.source[0];
          const match = tokens.description.match(/\s*(@(\S+))(\s*)/);
          if (match === null) {
              spec.problems.push({
                  code: 'spec:tag:prefix',
                  message: 'tag should start with "@" symbol',
                  line: spec.source[0].number,
                  critical: true,
              });
              return spec;
          }
          tokens.tag = match[1];
          tokens.postTag = match[3];
          tokens.description = tokens.description.slice(match[0].length);
          spec.tag = match[2];
          return spec;
      };
  }

  /**
   * Sets splits remaining `Spec.lines[].tokes.description` into `type` and `description`
   * tokens and populates Spec.type`
   *
   * @param {Spacing} spacing tells how to deal with a whitespace
   * for type values going over multiple lines
   */
  function typeTokenizer(spacing = 'compact') {
      const join = getJoiner$1(spacing);
      return (spec) => {
          let curlies = 0;
          let lines = [];
          for (const [i, { tokens }] of spec.source.entries()) {
              let type = '';
              if (i === 0 && tokens.description[0] !== '{')
                  return spec;
              for (const ch of tokens.description) {
                  if (ch === '{')
                      curlies++;
                  if (ch === '}')
                      curlies--;
                  type += ch;
                  if (curlies === 0)
                      break;
              }
              lines.push([tokens, type]);
              if (curlies === 0)
                  break;
          }
          if (curlies !== 0) {
              spec.problems.push({
                  code: 'spec:type:unpaired-curlies',
                  message: 'unpaired curlies',
                  line: spec.source[0].number,
                  critical: true,
              });
              return spec;
          }
          const parts = [];
          const offset = lines[0][0].postDelimiter.length;
          for (const [i, [tokens, type]] of lines.entries()) {
              if (type === '')
                  continue;
              tokens.type = type;
              if (i > 0) {
                  tokens.type = tokens.postDelimiter.slice(offset) + type;
                  tokens.postDelimiter = tokens.postDelimiter.slice(0, offset);
              }
              [tokens.postType, tokens.description] = splitSpace(tokens.description.slice(type.length));
              parts.push(tokens.type);
          }
          parts[0] = parts[0].slice(1);
          parts[parts.length - 1] = parts[parts.length - 1].slice(0, -1);
          spec.type = join(parts);
          return spec;
      };
  }
  const trim = (x) => x.trim();
  function getJoiner$1(spacing) {
      if (spacing === 'compact')
          return (t) => t.map(trim).join('');
      else if (spacing === 'preserve')
          return (t) => t.join('\n');
      else
          return spacing;
  }

  const isQuoted = (s) => s && s.startsWith('"') && s.endsWith('"');
  /**
   * Splits remaining `spec.lines[].tokens.description` into `name` and `descriptions` tokens,
   * and populates the `spec.name`
   */
  function nameTokenizer() {
      const typeEnd = (num, { tokens }, i) => tokens.type === '' ? num : i;
      return (spec) => {
          // look for the name in the line where {type} ends
          const { tokens } = spec.source[spec.source.reduce(typeEnd, 0)];
          const source = tokens.description.trimLeft();
          const quotedGroups = source.split('"');
          // if it starts with quoted group, assume it is a literal
          if (quotedGroups.length > 1 &&
              quotedGroups[0] === '' &&
              quotedGroups.length % 2 === 1) {
              spec.name = quotedGroups[1];
              tokens.name = `"${quotedGroups[1]}"`;
              [tokens.postName, tokens.description] = splitSpace(source.slice(tokens.name.length));
              return spec;
          }
          let brackets = 0;
          let name = '';
          let optional = false;
          let defaultValue;
          // assume name is non-space string or anything wrapped into brackets
          for (const ch of source) {
              if (brackets === 0 && isSpace(ch))
                  break;
              if (ch === '[')
                  brackets++;
              if (ch === ']')
                  brackets--;
              name += ch;
          }
          if (brackets !== 0) {
              spec.problems.push({
                  code: 'spec:name:unpaired-brackets',
                  message: 'unpaired brackets',
                  line: spec.source[0].number,
                  critical: true,
              });
              return spec;
          }
          const nameToken = name;
          if (name[0] === '[' && name[name.length - 1] === ']') {
              optional = true;
              name = name.slice(1, -1);
              const parts = name.split('=');
              name = parts[0].trim();
              if (parts[1] !== undefined)
                  defaultValue = parts.slice(1).join('=').trim();
              if (name === '') {
                  spec.problems.push({
                      code: 'spec:name:empty-name',
                      message: 'empty name',
                      line: spec.source[0].number,
                      critical: true,
                  });
                  return spec;
              }
              if (defaultValue === '') {
                  spec.problems.push({
                      code: 'spec:name:empty-default',
                      message: 'empty default value',
                      line: spec.source[0].number,
                      critical: true,
                  });
                  return spec;
              }
              // has "=" and is not a string, except for "=>"
              if (!isQuoted(defaultValue) && /=(?!>)/.test(defaultValue)) {
                  spec.problems.push({
                      code: 'spec:name:invalid-default',
                      message: 'invalid default value syntax',
                      line: spec.source[0].number,
                      critical: true,
                  });
                  return spec;
              }
          }
          spec.optional = optional;
          spec.name = name;
          tokens.name = nameToken;
          if (defaultValue !== undefined)
              spec.default = defaultValue;
          [tokens.postName, tokens.description] = splitSpace(source.slice(tokens.name.length));
          return spec;
      };
  }

  /**
   * Makes no changes to `spec.lines[].tokens` but joins them into `spec.description`
   * following given spacing srtategy
   * @param {Spacing} spacing tells how to handle the whitespace
   */
  function descriptionTokenizer(spacing = 'compact') {
      const join = getJoiner(spacing);
      return (spec) => {
          spec.description = join(spec.source);
          return spec;
      };
  }
  function getJoiner(spacing) {
      if (spacing === 'compact')
          return compactJoiner;
      if (spacing === 'preserve')
          return preserveJoiner;
      return spacing;
  }
  function compactJoiner(lines) {
      return lines
          .map(({ tokens: { description } }) => description.trim())
          .filter((description) => description !== '')
          .join(' ');
  }
  const lineNo = (num, { tokens }, i) => tokens.type === '' ? num : i;
  const getDescription = ({ tokens }) => (tokens.delimiter === '' ? tokens.start : tokens.postDelimiter.slice(1)) +
      tokens.description;
  function preserveJoiner(lines) {
      if (lines.length === 0)
          return '';
      // skip the opening line with no description
      if (lines[0].tokens.description === '' &&
          lines[0].tokens.delimiter === Markers.start)
          lines = lines.slice(1);
      // skip the closing line with no description
      const lastLine = lines[lines.length - 1];
      if (lastLine !== undefined &&
          lastLine.tokens.description === '' &&
          lastLine.tokens.end.endsWith(Markers.end))
          lines = lines.slice(0, -1);
      // description starts at the last line of type definition
      lines = lines.slice(lines.reduce(lineNo, 0));
      return lines.map(getDescription).join('\n');
  }

  function getParser({ startLine = 0, fence = '```', spacing = 'compact', tokenizers = [
      tagTokenizer(),
      typeTokenizer(spacing),
      nameTokenizer(),
      descriptionTokenizer(spacing),
  ], } = {}) {
      if (startLine < 0 || startLine % 1 > 0)
          throw new Error('Invalid startLine');
      const parseSource = getParser$2({ startLine });
      const parseBlock = getParser$3({ fence });
      const parseSpec = getParser$1({ tokenizers });
      const joinDescription = getJoiner(spacing);
      const notEmpty = (line) => line.tokens.description.trim() != '';
      return function (source) {
          const blocks = [];
          for (const line of splitLines(source)) {
              const lines = parseSource(line);
              if (lines === null)
                  continue;
              if (lines.find(notEmpty) === undefined)
                  continue;
              const sections = parseBlock(lines);
              const specs = sections.slice(1).map(parseSpec);
              blocks.push({
                  description: joinDescription(sections[0]),
                  tags: specs,
                  source: lines,
                  problems: specs.reduce((acc, spec) => acc.concat(spec.problems), []),
              });
          }
          return blocks;
      };
  }

  (undefined && undefined.__rest) || function (s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
              if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
          }
      return t;
  };

  (undefined && undefined.__rest) || function (s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
              if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
          }
      return t;
  };

  function parse(source, options = {}) {
      return getParser(options)(source);
  }

  /**
   * UTILITIES RELATED TO JSDOC
   */

  function handleJsDocType(type) {
    return type?.replace(/(import\(.+?\).)/g, '') || '';
  }

  /**
   * @example static foo;
   * @example public foo;
   * @example private foo;
   * @example protected foo;
   */
  function handleModifiers(doc, node) {
    node?.modifiers?.forEach(modifier => {
      if(modifier?.kind === ts__default['default'].SyntaxKind.StaticKeyword) {
        doc.static = true;
      }

      switch (modifier.kind) {
        case ts__default['default'].SyntaxKind.PublicKeyword:
          doc.privacy = 'public';
          break;
        case ts__default['default'].SyntaxKind.PrivateKeyword:
          doc.privacy = 'private';
          break;
        case ts__default['default'].SyntaxKind.ProtectedKeyword:
          doc.privacy = 'protected';
          break;
      }
    });

    return doc;
  }

  /**
   * Handles JsDoc
   */
  function handleJsDoc(doc, node) {
    node?.jsDoc?.forEach(jsDocComment => {
      if(jsDocComment?.comment) {
        doc.description = jsDocComment.comment;
      }

      jsDocComment?.tags?.forEach(tag => {
        /** @param */
        if(tag.kind === ts__default['default'].SyntaxKind.JSDocParameterTag) {
          const parameter = doc?.parameters?.find(parameter => parameter.name === tag.name.text);
          const parameterAlreadyExists = !!parameter;
          const parameterTemplate = parameter || {};

          if(tag?.comment) {
            parameterTemplate.description = tag.comment;
          }

          if(tag?.name) {
            parameterTemplate.name = tag.name.getText();
          }

          /**
           * If its bracketed, that means its optional
           * @example [foo]
           */
          if(tag?.isBracketed) {
            parameterTemplate.optional = true;
          }

          if(tag?.typeExpression) {
            parameterTemplate.type = {
              text: handleJsDocType(tag.typeExpression.type.getText())
            };
          }

          if(!parameterAlreadyExists) {
            doc.parameters = [...(doc?.parameters || []), parameterTemplate];
          }
        }

        /** @returns */
        if(tag.kind === ts__default['default'].SyntaxKind.JSDocReturnTag) {
          doc.return = {
            type: {
              text: handleJsDocType(tag?.typeExpression?.type?.getText())
            }
          };
        }

        /** @type */
        if(tag.kind === ts__default['default'].SyntaxKind.JSDocTypeTag) {
          if(tag?.comment) {
            doc.description = tag.comment;
          }

          doc.type = {
            text: handleJsDocType(tag.typeExpression.type.getText())
          };
        }


        /** @summary */
        if(safe(() => tag?.tagName?.getText()) === 'summary') {
          doc.summary = tag.comment;
        }

        /**
         * Overwrite privacy
         * @public
         * @private
         * @protected
         */
        switch(tag.kind) {
          case ts__default['default'].SyntaxKind.JSDocPublicTag:
            doc.privacy = 'public';
            break;
          case ts__default['default'].SyntaxKind.JSDocPrivateTag:
            doc.privacy = 'private';
            break;
          case ts__default['default'].SyntaxKind.JSDocProtectedTag:
            doc.privacy = 'protected';
            break;
        }
      });
    });

    return doc;
  }



  /**
   * Creates a mixin for inside a classDoc
   */
  function createClassDeclarationMixin(name, moduleDoc) {
    const mixin = { 
      name,
      ...resolveModuleOrPackageSpecifier(moduleDoc, name)
    };
    return mixin;
  }

  /**
   * Handles mixins and superclass
   */
  function handleHeritage(classTemplate, moduleDoc, node) {
    node?.heritageClauses?.forEach((clause) => {
      clause?.types?.forEach((type) => {
        const mixins = [];
        let node = type.expression;
        let superClass;

        /* gather mixin calls */
        if (ts__default['default'].isCallExpression(node)) {
          const mixinName = node.expression.getText();
          mixins.push(createClassDeclarationMixin(mixinName, moduleDoc));
          while (ts__default['default'].isCallExpression(node.arguments[0])) {
            node = node.arguments[0];
            const mixinName = node.expression.getText();
            mixins.push(createClassDeclarationMixin(mixinName, moduleDoc));
          }
          superClass = node.arguments[0].text;
        } else {
          superClass = node.text;
        }

        if (has(mixins)) {
          classTemplate.mixins = mixins;
        }

        classTemplate.superclass = {
          name: superClass,
        };

        if(superClass === 'HTMLElement') {
          delete classTemplate.superclass.module;
        }
      });
    });

    return classTemplate;
  }

  /**
   * Handles fields that have an @attr jsdoc annotation and gets the attribute name (if specified) and the description
   * @example @attr my-attr this is the attr description
   */
  function handleAttrJsDoc(node, doc) {
    node?.jsDoc?.forEach(jsDoc => {
      const docs = parse(jsDoc?.getFullText())?.find(doc => doc?.tags?.some(({tag}) => tag === 'attr'));
      const attrTag = docs?.tags?.find(({tag}) => tag === 'attr');

      if(attrTag?.name) {
        doc.name = attrTag.name;
      }
      
      if(attrTag?.description) {
        doc.description = attrTag.description;
      }
    });

    return doc;
  }

  /**
   * Creates a functionLike, does _not_ handle arrow functions
   */
  function createFunctionLike(node) {
    const isDefault = hasDefaultModifier(node);

    let functionLikeTemplate = {
      kind: '',
      name: isDefault ? 'default' : node?.name?.getText() || ''
    };
    
    functionLikeTemplate = handleKind(functionLikeTemplate, node);
    functionLikeTemplate = handleModifiers(functionLikeTemplate, node);
    functionLikeTemplate = handleParametersAndReturnType(functionLikeTemplate, node);
    functionLikeTemplate = handleJsDoc(functionLikeTemplate, node);
    
    return functionLikeTemplate;
  }

  /**
   * Determine the kind of the functionLike, either `'function'` or `'method'` 
   */
  function handleKind(functionLike, node) {
    switch(node.kind) {
      case ts__default['default'].SyntaxKind.FunctionDeclaration:
        functionLike.kind = 'function';
        break;
      case ts__default['default'].SyntaxKind.MethodDeclaration:
        functionLike.kind = 'method';
        break;
    }
    return functionLike;
  }

  /**
   * Handle a functionLikes return type and parameters/parameter types
   */
  function handleParametersAndReturnType(functionLike, node) {
    if(node?.type) {
      functionLike.return = {
        type: { text: node.type.getText() }
      };
    }

    const parameters = [];
    node?.parameters?.forEach((param) => {  
      const parameter = {
        name: param.name.getText(),
      };

      if(param?.initializer) {
        parameter.default = param.initializer.getText();
      }

      if(param?.questionToken) {
        parameter.optional = true;
      }

      if(param?.type) {
        parameter.type = {text: param.type.getText() };
      }

      parameters.push(parameter);
    });

    if(has(parameters)) {
      functionLike.parameters = parameters;
    }

    return functionLike;
  }

  const isMixin = node => !!extractMixinNodes(node);

  function extractMixinNodes(node) {
    if (ts__default['default'].isVariableStatement(node) || ts__default['default'].isFunctionDeclaration(node)) {
      if (ts__default['default'].isVariableStatement(node)) {
        /**
         * @example const MyMixin = klass => class MyMixin extends klass {}
         * @example export const MyMixin = klass => class MyMixin extends klass {}
         */
        const variableDeclaration = node.declarationList.declarations.find(declaration =>
          ts__default['default'].isVariableDeclaration(declaration),
        );
        if (variableDeclaration) {
          const body = variableDeclaration?.initializer?.body;
          if (body && ts__default['default'].isClassExpression(body)) {
            return { 
              mixinFunction: node,
              mixinClass: body,
            };
          }

          /**
           * @example const MyMixin = klass => { return class MyMixin extends Klass{} }
           */
          if (body && ts__default['default'].isBlock(body)) {
            const returnStatement = body.statements.find(statement => ts__default['default'].isReturnStatement(statement));

            if (returnStatement && returnStatement?.expression?.kind && ts__default['default'].isClassExpression(returnStatement.expression)) {
              return { 
                mixinFunction: variableDeclaration.initializer,
                mixinClass: returnStatement.expression
              };
            }
          }
        }
      }

      /**
       *  @example function MyMixin(klass) { return class MyMixin extends Klass{} }
       */
      if (ts__default['default'].isFunctionDeclaration(node)) {
        if (node.body && ts__default['default'].isBlock(node.body)) {

          const returnStatement = node.body.statements.find(statement => ts__default['default'].isReturnStatement(statement));

          if (returnStatement && ts__default['default'].isClassExpression(returnStatement.expression)) {
            return { 
              mixinFunction: node, 
              mixinClass: returnStatement.expression
            };
          }
        }
      }

      /**
       * @example function MyMixin(klass) {class A extends klass {} return A;}
       */
      if (ts__default['default'].isFunctionDeclaration(node)) {
        if (node.body && ts__default['default'].isBlock(node.body)) {
          const classDeclaration = node.body.statements.find(statement => ts__default['default'].isClassDeclaration(statement));
          const returnStatement = node.body.statements.find(statement => ts__default['default'].isReturnStatement(statement));

          /**
           * If the classDeclaration inside the function body has the same name as whats being 
           * returned from the function, consider it a mixin
           */
          if(
            /** Avoid undefined === undefined */
            (classDeclaration && returnStatement) &&
            (classDeclaration?.name?.getText() === returnStatement?.expression?.getText())
          ) {
            return {
              mixinFunction: node,
              mixinClass: classDeclaration
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * functionLikePlugin
   * 
   * handles functionLikes such as class methods and functions
   * does NOT handle arrow functions
   */
  function functionLikePlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.FunctionDeclaration:
            if(!isMixin(node)) {
              const functionLike = createFunctionLike(node);
              moduleDoc.declarations.push(functionLike);
            }
            break;
        }
      }
    }
  }

  function createArrowFunction(node) {
    const arrowFunction = node?.declarationList?.declarations?.find(declaration => ts__default['default'].SyntaxKind.ArrowFunction === declaration?.initializer?.kind);

    let functionLikeTemplate = {
      kind: 'function',
      name: arrowFunction?.name?.getText() || '',
    };
    
    functionLikeTemplate = handleParametersAndReturnType(functionLikeTemplate, arrowFunction?.initializer);
    functionLikeTemplate = handleJsDoc(functionLikeTemplate, node);

    return functionLikeTemplate;
  }

  /**
   * arrowFunctionPlugin
   * 
   * handles arrow functions
   */
  function arrowFunctionPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.VariableStatement:
            if(!isMixin(node) && hasInitializer(node)) {
              const functionLike = createArrowFunction(node);
              moduleDoc.declarations.push(functionLike);
            }
            break;
        }
      }
    }
  }

  function createAttribute(node) {
    const attributeTemplate = {
      name: node?.text || ''
    };
    return attributeTemplate;
  }

  function createAttributeFromField(field) {
    const attribute = {
      ...field,
      fieldName: field.name
    };

    /** 
     * Delete the following properties because they don't exist on a attributeDoc 
     */
    delete attribute.kind;
    delete attribute.static;
    delete attribute.privacy;

    return attribute;
  }

  function createField(node) {
    let fieldTemplate = {
      kind: 'field',
      name: node?.name?.getText() || '',
    };

    /** 
     * if is private field
     * @example class Foo { #bar = ''; }
     */ 
    if (ts__default['default'].isPrivateIdentifier(node.name)) {
      fieldTemplate.privacy = 'private';
    }

    /**
     * Add TS type
     * @example class Foo { bar: string = ''; }
     */ 
    if(node.type) {
      fieldTemplate.type = { text: node.type.getText() };
    }

    fieldTemplate = handleModifiers(fieldTemplate, node);
    fieldTemplate = handleJsDoc(fieldTemplate, node);
    fieldTemplate = handleDefaultValue(fieldTemplate, node);

    return fieldTemplate;
  }

  function handleDefaultValue(fieldTemplate, node) {
    if(isPrimitive(node.initializer)) {
      fieldTemplate.default = node.initializer.text;
    }

    return fieldTemplate;
  }

  /**
   * Creates a classDoc
   */
  function createClass(node, moduleDoc) {
    const isDefault = hasDefaultModifier(node);
    
    let classTemplate = {
      kind: 'class',
      description: '',
      name: isDefault ? 'default' : node?.name?.getText() || node?.parent?.parent?.name?.getText() || '',
      cssProperties: [],
      cssParts: [],
      slots: [],
      members: [],
      events: [],
      attributes: []
    };

    node?.members?.forEach(member => {
      /**
       * Handle attributes
       */
      if (isProperty(member)) {
        if (member?.name?.getText() === 'observedAttributes') {
          /** 
           * @example static observedAttributes
           */
          if (ts__default['default'].isPropertyDeclaration(member)) {
            member?.initializer?.elements?.forEach((element) => {
              if (ts__default['default'].isStringLiteral(element)) {
                const attribute = createAttribute(element);
                classTemplate.attributes.push(attribute);
              }
            });
          }

          /**
           * @example static get observedAttributes() {}
           */
          if (ts__default['default'].isGetAccessor(member)) {
            const returnStatement = member?.body?.statements?.find(isReturnStatement);

            returnStatement?.expression?.elements?.forEach((element) => {
              if (ts__default['default'].isStringLiteral(element)) {
                const attribute = createAttribute(element);
                classTemplate.attributes.push(attribute);
              }
            });
          }
        }
      }
    });

    /**
     * Second pass through a class's members.
     * We do this in two passes, because we need to know whether or not a class has any 
     * attributes, so we handle those first.
     */
    const gettersAndSetters = [];
    node?.members?.forEach(member => {
      /**
       * Handle class methods
       */
      if(ts__default['default'].isMethodDeclaration(member)) {
        const method = createFunctionLike(member);
        classTemplate.members.push(method);
      }

      /**
       * Handle fields
       */
      if (isProperty(member)) {
        if (gettersAndSetters.includes(member?.name?.getText())) {
          return;
        } else {
          gettersAndSetters.push(member?.name?.getText());
        }

        const field = createField(member);
        classTemplate.members.push(field);

        /**
         * Handle @attr
         * If a field has a @attr annotation, also create an attribute for it
         */
        if(hasAttrAnnotation(member)) {
          let attribute = createAttributeFromField(field);
          attribute = handleAttrJsDoc(member, attribute);

          /**
           * If the attribute already exists, merge it together with the extra
           * information we got from the field (like type, summary, description, etc)
           */
          let attrAlreadyExists = classTemplate.attributes.find(attr => attr.name === attribute.name);
          
          if(attrAlreadyExists) {
            classTemplate.attributes = classTemplate.attributes.map(attr => {
              return attr.name === attribute.name ? { ...attrAlreadyExists, ...attribute } : attr;
            });
          } else {
            classTemplate.attributes.push(attribute);
          }
        }
      }

      /**
       * Handle events
       * 
       * In order to find `this.dispatchEvent` calls, we have to traverse a method's AST
       */
      if (ts__default['default'].isMethodDeclaration(member)) {
        eventsVisitor(member, classTemplate);
      }
    });

    classTemplate?.members?.forEach(member => {
      getDefaultValuesFromConstructorVisitor(node, member);
    });

    /**
     * Inheritance
     */
    classTemplate = handleHeritage(classTemplate, moduleDoc, node);

    return classTemplate;
  }

  function eventsVisitor(source, classTemplate) {
    visitNode(source);

    function visitNode(node) {
      switch (node.kind) {
        case ts__default['default'].SyntaxKind.CallExpression:

          /** If callexpression is `this.dispatchEvent` */
          if (isDispatchEvent(node)) {
            node?.arguments?.forEach((arg) => {
              if (arg.kind === ts__default['default'].SyntaxKind.NewExpression) {
                const eventName = arg.arguments[0].text;

                /**
                 * Check if event already exists
                 */
                const eventExists = classTemplate?.events?.some(event => event.name === eventName);

                if(!eventExists) {
                  let eventDoc = {
                    name: eventName,
                    type: {
                      text: arg.expression.text,
                    },
                  };
    
                  eventDoc = handleJsDoc(eventDoc, node?.parent);
                  classTemplate.events.push(eventDoc);
                }
              }
            });

          }
      }

      ts__default['default'].forEachChild(node, visitNode);
    }
  }

  function getDefaultValuesFromConstructorVisitor(source, member) {
    visitNode(source);

    function visitNode(node) {
      switch (node.kind) {
        case ts__default['default'].SyntaxKind.Constructor:
          /** 
           * For every member that was added in the classDoc, we want to add a default value if we can
           * To do this, we visit a class's constructor, and loop through the statements
           */
          node.body?.statements?.filter((statement) => statement.kind === ts__default['default'].SyntaxKind.ExpressionStatement)
            .filter((statement) => statement.expression.kind === ts__default['default'].SyntaxKind.BinaryExpression)
            .forEach((statement) => {
              if (
                statement.expression?.left?.name?.getText() === member.name &&
                member.kind === 'field'
              ) {
                member = handleJsDoc(member, statement);

                /** Only add defaults for primitives for now */
                if(isPrimitive(statement.expression.right)) {
                  member.default = statement.expression.right.getText();
                }
              }
            });
          break;
      }

      ts__default['default'].forEachChild(node, visitNode);
    }
  }

  /**
   * classPlugin
   * 
   * handles classes
   */
  function classPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.ClassDeclaration:
            const klass = createClass(node, moduleDoc);
            moduleDoc.declarations.push(klass);
            break;
        }
      }
    }
  }

  /**
   * Takes a mixinFunctionNode, which is the function/arrow function containing the mixin class
   * and the actual class node returned by the mixin declaration
   */
  function createMixin(mixinFunctionNode, mixinClassNode, moduleDoc) {
    let mixinTemplate = createClass(mixinClassNode, moduleDoc);

    mixinTemplate = handleParametersAndReturnType(mixinTemplate, mixinFunctionNode?.declarationList?.declarations?.[0]?.initializer || mixinFunctionNode);
    mixinTemplate = handleJsDoc(mixinTemplate, mixinFunctionNode);
    mixinTemplate = handleName(mixinTemplate, mixinFunctionNode);
    mixinTemplate = turnClassDocIntoMixin(mixinTemplate);

    return mixinTemplate;
  }

  function handleName(mixin, node) {
    mixin.name = node?.name?.getText()  || node?.parent?.name?.getText() || node?.declarationList?.declarations?.[0]?.name?.getText() || '';
    return mixin;
  }

  /**
   * Turns a classDoc into a mixin
   */
  function turnClassDocIntoMixin(mixin) {
    mixin.kind = 'mixin';
    delete mixin.superclass;
    delete mixin.return;
    return mixin;
  }

  /**
   * mixinPlugin
   * 
   * handles mixins
   */
  function mixinPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.VariableStatement:
          case ts.SyntaxKind.FunctionDeclaration:
            /**
             * Try to extract mixin nodes, if its a mixin
             */
            if(isMixin(node)) {
              const { mixinFunction, mixinClass } = extractMixinNodes(node);
              let mixin = createMixin(mixinFunction, mixinClass, moduleDoc);
              moduleDoc.declarations.push(mixin);
            }
            break;
        }
      }
    }
  }

  function createVariable(variableStatementNode, declarationNode) {
    let variableTemplate = {
      kind: 'variable',
      name: declarationNode?.name?.getText() || ''
    };

    if(declarationNode?.type) {
      variableTemplate.type = { text: declarationNode?.type?.getText() };
    }

    variableTemplate = handleJsDoc(variableTemplate, variableStatementNode);

    return variableTemplate;
  }

  /**
   * variablePlugin
   * 
   * handles variables
   */
  function variablePlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.VariableStatement:
            if(!isMixin(node)) {
              node?.declarationList?.declarations?.forEach(declaration => {
                /**
                 * It can be the case that a variable is already present in the declarations,
                 * for example if the variable is also an arrow function. So we need to make sure
                 * the declaration doesnt already exist before adding it to a modules declarations
                 */
                const alreadyExists = moduleDoc?.declarations?.some(_declaration => _declaration.name === declaration?.name?.getText());

                if(!alreadyExists) {
                  const variable = createVariable(node, declaration);
                  moduleDoc.declarations.push(variable);
                }
              });
            }
            break;
        }
      }
    }
  }

  /**
   * CLASS-JSDOC
   * 
   * Deals with any JSDoc above a class
   */
  function classJsDocPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch (node.kind) {
          case ts.SyntaxKind.ClassDeclaration:
            const className = node?.name?.text;
            const classDoc = moduleDoc?.declarations?.find(declaration => declaration.name === className);

            /**
             * Because we use a bunch of 'non-standard' JSDoc annotations, TS doesn't recognize most of them.
             * Instead we use `comment-parser` to parse the JSDoc. 
             * 
             * Loops through each JSDoc (yes, there can be multiple) above a class, and parses every JSDoc annotation
             * 
             * Checks to see if the item is already in the classDoc, and if so merge and overwrite (JSDoc takes precedence)
             */
            node?.jsDoc?.forEach(jsDoc => {
              const parsed = parse(jsDoc?.getFullText());
              parsed?.forEach(parsedJsDoc => {

                /**
                 * If any of the tags is a `@typedef`, we ignore it; this JSDoc comment may be above a class,
                 * it probably doesnt _belong_ to the class, but something else in the file
                 */
                if(parsedJsDoc?.tags?.some(tag => tag?.tag === 'typedef')) return;

                parsedJsDoc?.tags?.forEach(jsDoc => {
                  switch(jsDoc.tag) {
                    case 'attr':
                    case 'attribute':
                      const attributeAlreadyExists = classDoc?.attributes?.find(attr => attr.name === jsDoc.name);
                      let attributeDoc = attributeAlreadyExists || {};
                      attributeDoc = handleClassJsDoc(attributeDoc, jsDoc);
                      if(!attributeAlreadyExists) {
                        classDoc.attributes.push(attributeDoc);
                      }
                      break;
                    case 'prop':
                    case 'property':
                      const fieldAlreadyExists = classDoc?.members?.find(member => member.name === jsDoc.name);
                      let fieldDoc = fieldAlreadyExists || {};
                      fieldDoc = handleClassJsDoc(fieldDoc, jsDoc);
                      fieldDoc.kind = 'field';
                      if(!fieldAlreadyExists) {
                        classDoc.members.push(fieldDoc);
                      }
                      break;
                    case 'fires':
                    case 'event':
                      const eventAlreadyExists = classDoc?.events?.find(event => event.name === jsDoc.name);
                      let eventDoc = eventAlreadyExists || {};
                      eventDoc = handleClassJsDoc(eventDoc, jsDoc);
                      if(!eventAlreadyExists) {
                        classDoc.events.push(eventDoc);
                      }
                      break;
                    case 'csspart':
                      let cssPartDoc = {};
                      cssPartDoc = handleClassJsDoc(cssPartDoc, jsDoc);
                      classDoc.cssParts.push(cssPartDoc);
                      break;
                    case 'cssprop':
                    case 'cssproperty':
                      let cssPropertyDoc = {};
                      cssPropertyDoc = handleClassJsDoc(cssPropertyDoc, jsDoc);
                      classDoc.cssProperties.push(cssPropertyDoc);
                      break;
                    case 'slot':
                      let slotDoc = {};
                      slotDoc = handleClassJsDoc(slotDoc, jsDoc);
                      classDoc.slots.push(slotDoc);
                      break;
                    case 'tag':
                    case 'tagname':
                    case 'element':
                      classDoc.tagName = jsDoc?.name || '';
                      break;
                  }
                });
              });

              /**
               * Description
               */
              if(jsDoc?.comment) {
                classDoc.description = jsDoc?.comment;
              }

              /**
               * Comment-parse doesn't handle annotations with only a description correctly, for example:
               * @summary foo bar
               * will output only 'bar' as the description. 
               * 
               * Instead, we use TS for this JSDoc annotation.
               */
              jsDoc?.tags?.forEach(tag => {
                switch(safe(() => tag?.tagName?.getText())) {
                  case 'summary':
                    classDoc.summary = tag?.comment;
                    break;
                }
              });
            });

            break;
        }
      }
    }
  }

  function handleClassJsDoc(doc, tag) {
    if(tag?.type) {
      doc.type = { text: handleJsDocType(tag.type) };
    }

    if(tag?.description) {
      doc.description = tag.description;
    }

    if(tag?.name) {
      doc.name = tag.name;
    }

    if(tag?.default) {
      doc.default = tag.default;
    }

    return doc;
  }

  /**
   * REEXPORTED WRAPPED MIXIN EXPORTS
   * 
   * Handle exported mixins
   * @example ```
   * 
   * function FooMixinImpl(klass) {
   *   class FooMixin extends klass {}
   *   return FooMixin;
   * }
   * 
   * export const FooMixin = dedupeMixin(FooMixinImpl);
   * 
   * ```
   */
  function reexportedWrappedMixinExportsPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.VariableStatement:
            if(!isMixin(node)) {
              node?.declarationList?.declarations?.forEach(declaration => {

                const mixins = [];
                if(ts.SyntaxKind.CallExpression === declaration?.initializer?.kind) {
                  /**
                   * If an exported variable has a callExpression, it might try to export a mixin
                   * We need to check if the current module contains any mixins
                   */
                  const moduleMixinDeclarations = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'mixin');

                  if(has(moduleMixinDeclarations)){
                    const mixinName = declaration?.initializer?.expression?.getText();
                    mixins.push(mixinName);

                    let node = declaration?.initializer?.arguments[0];
                    
                    /** 
                     * Handle nested Mixin calls 
                     */
                    while(node && ts.isCallExpression(node)) {
                      const mixinName = node.expression.getText();
                      mixins.push(mixinName);
    
                      node = node?.arguments[0];
                    }

                    /**
                     * See if we can find the supposed Mixin in the modules declaration
                     * If we do, change the name of MixinImpl to the variableDeclaration thats actually being exported
                     */
                    const foundMixin = moduleMixinDeclarations?.find(mixin => mixin.name === node?.getText());
                    if(foundMixin) {
                      foundMixin.name = declaration?.name?.getText();
        
                      /**
                       * Next, we need to add any other mixins found along the way to the exported mixin's `mixins` array
                       */
                      mixins?.forEach(mixin => {
                        const newMixin = createClassDeclarationMixin(mixin, moduleDoc);
                        foundMixin.mixins = [...(foundMixin?.mixins || []), newMixin];
                      });

                      /**
                       * At this point, there's now a variable declaration and a mixin declaration with the same name.
                       * We're only interested in the mixin, so we filter out the variable declaration
                       */
                      moduleDoc.declarations = moduleDoc?.declarations?.filter(declaration => !(declaration.kind === 'variable' && declaration.name === foundMixin.name));
                    }

                  }
                }
              });
            }
            break;
        }
      }
    }
  }

  /**
   * REMOVE-UNEXPORTED-DECLARATIONS
   * 
   * If a module has declarations that are _not_ exported, that means those declarations are considered 'private' to that module, and they shouldnt be present in the manifest, so we remove them.
   */
  function removeUnexportedDeclarationsPlugin() {
    return {
      moduleLinkPhase({moduleDoc}){
        moduleDoc.declarations = moduleDoc?.declarations?.filter(declaration => {
          return moduleDoc?.exports?.some(_export => {
            return declaration?.name === _export?.name || declaration?.name === _export?.declaration?.name;
          });
        });
      },
    }
  }

  /**
   * METHOD-DENY-LIST
   * 
   * Excludes methods from the manifest
   */
  function methodDenyListPlugin() {
    const METHOD_DENY_LIST = [
      'connectedCallback',
      'disconnectedCallback',
      'attributeChangedCallback',
      'adoptedCallback'
    ];

    return {
      moduleLinkPhase({moduleDoc}){
        const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class' || declaration.kind === 'mixin');

        classes?.forEach(klass => {
          klass.members = klass?.members?.filter(member => !METHOD_DENY_LIST.includes(member.name));
        });
      },
    }
  }

  /**
   * FIELD-DENY-LIST
   * 
   * Excludes fields from the manifest
   */
  function fieldDenyListPlugin() {
    const FIELD_DENY_LIST = [
      'observedAttributes',
    ];

    return {
      moduleLinkPhase({moduleDoc}){
        const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class' || declaration.kind === 'mixin');

        classes?.forEach(klass => {
          klass.members = klass?.members?.filter(member => !FIELD_DENY_LIST.includes(member.name));
        });
      },
    }
  }

  /**
   * CLEANUP-CLASSES
   * 
   * Removes empty arrays from classes; e.g. if a class doesn't have any `members`, 
   * then we remove it from the class doc
   */
  function cleanupClassesPlugin() {
    return {
      moduleLinkPhase({moduleDoc}){
        const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class' || declaration.kind === 'mixin');

        classes?.forEach(klass => {
          ['cssProperties', 'cssParts', 'slots', 'members', 'attributes', 'events'].forEach(field => {
            if(!has(klass[field])) {
              delete klass[field];
            }
          });
        });
      },
    }
  }

  const BASECLASSES = [
    'htmlelement', 
    'litelement', 
    'fastelement'
  ];

  /**
   * ISCUSTOMELEMENT
   * 
   * Heuristic to see whether or not a class is a custom element
   */
  function isCustomElementPlugin() {
    return {
      packageLinkPhase({customElementsManifest, context}) {
        customElementsManifest?.modules?.forEach(_module => {
          _module?.declarations?.forEach(declaration => {
            if(declaration?.kind === 'class') {
              /** If a class has a tagName, that means its been defined, and is a custom element */
              if(declaration?.tagName) {
                declaration.customElement = true;
              }
              
              /** If a class extends from any of these, its a custom element */
              if(BASECLASSES.includes(declaration?.superclass?.name?.toLowerCase())) {
                declaration.customElement = true;
              }
            }
          });
        });
      }
    }
  }

  /**
   * UTILITIES RELATED TO GETTING INFORMATION OUT OF A MANIFEST OR DOC
   */


  function loopThroughDeclarations(manifest, predicate) {
    manifest?.modules?.forEach(_module => {
      _module?.declarations?.forEach(predicate);
    });
  }

  function loopThroughExports(manifest, predicate) {
    manifest?.modules?.forEach(_module => {
      _module?.exports?.forEach(predicate);
    });
  }

  /**
   * Loops through all modules' exports, and returns the kind provided by the users
   * 
   * @example getKind('class');
   * @example getKind('custom-element-definition');
   */
  function getAllExportsOfKind(manifest, kind) {
    const result = [];
    loopThroughExports(manifest, (_export) => {
      if(_export.kind === kind) {
        result.push(_export);
      }
    });
    return result;
  }


  /**
   * Loops through all modules' declarations, and returns the kind provided by the users
   * 
   * @example getKind('class');
   * @example getKind('custom-element-definition');
   */
  function getAllDeclarationsOfKind(manifest, kind) {
    const result = [];
    loopThroughDeclarations(manifest, (declaration) => {
      if(declaration.kind === kind) {
        result.push(declaration);
      }
    });
    return result;
  }

  /**
   * Gets the inheritance tree from a manifest given a className
   * Returns an array of a classes mixins/superclasses all the way up the chain
   */
  function getInheritanceTree(cem, className) {
    const tree = [];

    const allClassLikes = new Map();

    const _classes = getAllDeclarationsOfKind(cem, 'class');
    const _mixins = getAllDeclarationsOfKind(cem, 'mixin');
    
    [..._mixins, ..._classes].forEach(klass => {
      allClassLikes.set(klass.name, klass);
    });

    let klass = allClassLikes.get(className);

    if(klass) {
      tree.push(klass);

      klass?.mixins?.forEach(mixin => {
        let foundMixin = _mixins.find(m => m.name === mixin.name);
        if(foundMixin) {
          tree.push(foundMixin);

          while(has(foundMixin?.mixins)) {
            foundMixin?.mixins?.forEach(mixin => {
              foundMixin =  _mixins.find(m => m.name === mixin.name);
              if(foundMixin) {
                tree.push(foundMixin);
              }
            });
          }
        }
      });
      
      while(allClassLikes.has(klass.superclass?.name)) {
        const newKlass = allClassLikes.get(klass.superclass.name);
        
        klass?.mixins?.forEach(mixin => {
          let foundMixin = _mixins.find(m => m.name === mixin.name);
          if(foundMixin) {
            tree.push(foundMixin);
    
            while(has(foundMixin?.mixins)) {
              foundMixin?.mixins?.forEach(mixin => {
                foundMixin =  _mixins.find(m => m.name === mixin.name);
                if(foundMixin) {
                  tree.push(foundMixin);
                }
              });
            }
          }
        });

        tree.push(newKlass);
        klass = newKlass;
      }
      return tree;
    } 
    return [];
  }

  function getModuleFromManifest(cem, modulePath) {
    let result = undefined;

    cem?.modules?.forEach(_module => {
      if(_module.path === modulePath) {
        result = _module;
      }
    });

    return result;
  }

  function getModuleForClassLike(cem, className) {
    let result = undefined;

    cem?.modules?.forEach(_module => {
      _module?.declarations?.forEach(declaration => {
        if((declaration.kind === 'class' || declaration.kind === 'mixin') && declaration.name === className) {
          result = _module.path;
        }
      });
    });
    
    return result;
  }

  /**
   * LINK-CLASS-TO-TAGNAME
   * 
   * Links a custom element definition to its corresponding class
   */
  function linkClassToTagnamePlugin() {
    return {
      packageLinkPhase({customElementsManifest, context}){
        /* Get all class declarations and custom element definitions in the manifest */
        const classes = getAllDeclarationsOfKind(customElementsManifest, 'class');
        const definitions = getAllExportsOfKind(customElementsManifest, 'custom-element-definition');

        /* Loop through all classes, and try to find their corresponding custom element definition */
        classes?.forEach((klass) => {
          const tagName = definitions?.find(def => def?.declaration?.name === klass?.name)?.name;

          /* If there's a match, we can link the custom element definition to the class */
          if (tagName && !klass.tagName) {
            klass.tagName = tagName;
          }
        });
      }
    }
  }

  /**
   * APPLY-INHERITANCE-PLUGIN
   * 
   * Applies inheritance for all classes in the manifest
   */
  function applyInheritancePlugin() {
    return {
      packageLinkPhase({customElementsManifest, context}){
        const classes = getAllDeclarationsOfKind(customElementsManifest, 'class');
        const mixins = getAllDeclarationsOfKind(customElementsManifest, 'mixin');

        [...classes, ...mixins].forEach((customElement) => {
          const inheritanceChain = getInheritanceTree(customElementsManifest, customElement.name);

          inheritanceChain?.forEach(klass => {
            // Handle mixins
            if (klass?.kind !== 'class') {
              if (klass?.package) {
                // the mixin comes from a bare module specifier, skip it
                return;
              }
            }

            // ignore the current class itself
            if (klass?.name === customElement.name) {
              return;
            }

            ['attributes', 'members', 'events'].forEach(type => {
              klass?.[type]?.forEach(currItem => {
                const containingModulePath = getModuleForClassLike(customElementsManifest, klass.name);
                const containingModule = getModuleFromManifest(customElementsManifest, containingModulePath);

                const newItem = { ...currItem };

                /**
                  * If an attr or member is already present in the base class, but we encounter it here,
                  * it means that the base has overridden that method from the super class, so we bail
                  */
                const itemIsOverridden = customElement?.[type]?.some(item => newItem.name === item.name);
                if (itemIsOverridden) return;

                newItem.inheritedFrom = {
                  name: klass.name,
                  ...resolveModuleOrPackageSpecifier(containingModule, klass.name)
                };

                customElement[type] = [...(customElement[type] || []), newItem];
              });
            });
          });
        });
      } 
    }
  }

  /**
   * COLLECT
   */

  /** 
   * Establish the execution order of plugins 
   */
  const FEATURES = [
    /** COLLECT */
    
    /** ANALYSE */
    collectImportsPlugin(),
    exportsPlugin(),
    customElementsDefineCallsPlugin(),
    functionLikePlugin(),
    arrowFunctionPlugin(),
    classPlugin(),
    mixinPlugin(),
    variablePlugin(),
    reexportedWrappedMixinExportsPlugin(),
    classJsDocPlugin(),

    /** LINK */
    removeUnexportedDeclarationsPlugin(),
    methodDenyListPlugin(),
    fieldDenyListPlugin(),
    cleanupClassesPlugin(),

    /** POST-PROCESSING */
    isCustomElementPlugin(),
    linkClassToTagnamePlugin(),
    applyInheritancePlugin(),

    /** FRAMEWORKS */
    // litPlugin()
    // fastPlugin()
    // stencilPlugin()
    // catalystPlugin()
  ].flat();

  /**
   * 🚨 TODO
   * - Lightning web components
   * - handle name after @attr my-attribute jsdoc annotation
   */

  /**
   * CORE
   * 
   * This function is the core of the analyzer. It takes an array of ts sourceFiles, and creates a
   * custom elements manifest.
   */
  function create({modules, plugins = [], dev = false}) {
    const customElementsManifest = {
      schemaVersion: '0.1.0',
      readme: '',
      modules: [],
    };

    const mergedPlugins = [
      ...FEATURES,
      ...plugins,
    ];

    const context = { dev };

    modules.forEach(currModule => {
      if(dev) console.log('[COLLECT PHASE]: ', currModule.fileName);
      /**
       * COLLECT PHASE
       * First pass through all modules. Can be used to gather imports, exports, types, default values, 
       * which you may need to know the existence of in a later phase.
       */
      collect(currModule, context, mergedPlugins);
    });

    modules.forEach(currModule => {
      if(dev) console.log('[ANALYZE PHASE]: ', currModule.fileName);
      const moduleDoc = {
        kind: "javascript-module",
        path: currModule.fileName,
        declarations: [],
        exports: []
      };

      /**
       * ANALYZE PHASE
       * Go through the AST of every separate module, and gather as much as information as we can
       * This includes a modules imports, which are not specified in custom-elements.json, but are
       * required for the LINK PHASE, and deleted when processed
       */
      analyze(currModule, moduleDoc, context, mergedPlugins);
      customElementsManifest.modules.push(moduleDoc);

      if(dev) console.log('[MODULE LINK PHASE]: ', currModule.fileName);
      /**
       * LINK PHASE
       * All information for a module has been gathered, now we can link information together. Like:
       * - Finding a CustomElement's tagname by finding its customElements.define() call (or 'export')
       * - Applying inheritance to classes (adding `inheritedFrom` properties/attrs/events/methods)
       */
      mergedPlugins.forEach(({moduleLinkPhase}) => {
        moduleLinkPhase && moduleLinkPhase({ts: ts__default['default'], moduleDoc, context});
      });
    });

    if(dev) console.log('[PACKAGE LINK PHASE]');
    /** 
     * PACKAGE LINK PHASE 
     * All modules have now been parsed, we can now link information from across modules together
     * - Link classes to their definitions etc 
     * - Match tagNames for classDocs
     * - Apply inheritance
     */
    mergedPlugins.forEach(({packageLinkPhase}) => {
      packageLinkPhase && packageLinkPhase({customElementsManifest, context});
    });

    return customElementsManifest;
  }

  function collect(source, context, mergedPlugins) {
    visitNode(source);

    function visitNode(node) {
      mergedPlugins.forEach(({collectPhase}) => {
        collectPhase && collectPhase({ts: ts__default['default'], node, context});
      });

      ts__default['default'].forEachChild(node, visitNode);
    }
  }

  function analyze(source, moduleDoc, context, mergedPlugins) {
    visitNode(source);

    function visitNode(node) {
      mergedPlugins.forEach(({analyzePhase}) => {
        analyzePhase && analyzePhase({ts: ts__default['default'], node, moduleDoc, context});
      });

      ts__default['default'].forEachChild(node, visitNode);
    }
  }

  exports.create = create;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}, ts));
