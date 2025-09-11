import { html, heading, inlineCode, root, table, tableCell, tableRow, text } from 'mdast-builder';
import {
  capital, repeat,
  compose, identity,
  isPrivate, isProtected, isStatic,
  isLengthy,
  kindIs,
  and, not, or,
  trace,
  isDefined
} from './lib/fp.js';
import * as CELLS from './lib/cells.js';
import { serialize, parse } from './lib/serialize.js';

const line = html('<hr/>');

const DECLARATIONS = {
  mixins: 'mixins',
  variables: 'variables',
  functions: 'functions',
  exports: 'exports'
};

const SECTIONS = {
  mainHeading: 'main-heading',
  description: 'description',
  superClass: 'super-class',
  fields: 'fields', 
  methods: 'methods',
  staticFields: 'static-fields',
  staticMethods: 'static-methods',
  slots: 'slots',
  events: 'events',
  attributes: 'attributes',
  cssProperties: 'css-properties',
  cssParts: 'css-parts',
  mixins: 'mixins'
}

/** Options -> Declaration -> Heading */
const declarationHeading = options =>
  ({ kind, name, tagName }) =>
    heading(
      2 + (options?.headingOffset ?? 0),
      [
        text(`${kind}: `),
        inlineCode(name),
        ...tagName ? [
          text(', '),
          inlineCode(tagName)
        ] : []
      ]
    );

/** Options -> Declaration -> [Content] */
const declarationDescription = options =>
({ description }) => {
  const headingOffset = 1 + (options?.headingOffset ?? 0);

  try {
    const contentNodes = parse(description).children || [];

    contentNodes.forEach((node) => {
      if (node.type === 'heading' && typeof node.depth === "number") {
        node.depth = Math.min(node.depth + headingOffset, 6);
      }
    })

    return contentNodes;
  } catch {
    return [];
  }
}

/** String -> Descriptor */
const defaultDescriptor = name =>
  ({ heading: capital(name), get: x => x?.[name] });

/** String|Descriptor -> Descriptor */
const getDescriptor = x =>
  typeof x === 'string' ? defaultDescriptor(x) : x;

/** Options -> [Declaration] -> Descriptor -> Column */
const getColumnWithOptions = options =>
  decls =>
    ({ heading, get, cellType = text }) =>
      ({ heading, cellType, values: decls.map(x => get(x, options)) })

/** Column -> Cell */
const getHeading = x =>
  tableCell(text(x.heading));

/** Int -> Column -> Cell */
const getCell = i =>
  ({ values, cellType = text }) => {
    const value = values[i];
    if (!value)
      return tableCell(text(''));
    if (cellType === 'raw')
      return tableCell(value);
    else
      return tableCell(cellType(value ?? ''));
  }

/** [Column] -> (, Int) -> Row [Cell] */
const getRows = columns =>
  (_, i) =>
    tableRow(columns.map(getCell(i)));

/**
 * Options -> String -> [String|Descriptor] -> [Declaration] -> Parent Table
 * @type {import("./types/main").CurriedTableFn}
 */
const tableWithTitle = options => {
  const getColumn = getColumnWithOptions(options);
  return (title, names, _decls, { headingLevel = 3, filter } = { }) => {
    const by = (
        typeof filter === 'function' ? filter
      : options?.private === 'hidden' ? not(isPrivate)
      : options?.private === 'details' ? not(or(isPrivate, isProtected))
      : identity
    );

    const decls = (_decls ?? []).filter(by).filter(identity);

    if (!isLengthy(decls)) return [];

    // xs.map(compose(g, f)) === xs.map(f).map(g)
    const columns = names.map(compose(getColumn(decls), getDescriptor))

    const contentRows = decls.map(getRows(columns));

    return [
      heading(headingLevel + (options?.headingOffset ?? 0), text(title)),
      table(
        repeat(columns.length, null),
        [
          tableRow(columns.map(getHeading)),
          ...contentRows
        ]
      ),
    ];
  }
}

function optionEnabled(option) {
  return isDefined(option) && option === true;
}

function getOmittedConfig(type, omittedOptions) {
  // target will either be the declarations options object or the sections options object, depending on `type`
  const target = type === 'decl' ? Object.assign({}, DECLARATIONS) : Object.assign({}, SECTIONS);

  // rewrite target object with boolean values for comparison in nodes array
  // true if not omitted, false if omitted.
  Object.keys(target).forEach((omitted) => target[omitted] = !omittedOptions.includes(target[omitted]));
  return target;
}

/** Declaration[] -> Declaration[] */
function filteredDeclarations(declarationsToFilter, omittedDeclarations, classNameFilter) {
  
  // run classNameFilter function if present
  const actualClassNameFilter = classNameFilter instanceof Function ? new RegExp(classNameFilter()) : new RegExp(classNameFilter);
  
  return declarationsToFilter.filter((decl) => {

    if(kindIs('class')(decl)) {
      return actualClassNameFilter.test(decl.name);
    } else if(kindIs('mixin')(decl)) {
      return isDefined(omittedDeclarations.mixins) && omittedDeclarations.mixins === true;
    } else if(kindIs('variable')(decl)) {
      return isDefined(omittedDeclarations.variables) && omittedDeclarations.variables === true;
    } else if(kindIs('function')(decl)) {
      return isDefined(omittedDeclarations.functions) && omittedDeclarations.functions === true;
    }
    
    return keepDeclaration.every((result) => result === true);
  });

}

/** @type {import("./types/main").MakeModuleDocFn} */
function makeModuleDoc(mod, options) {
  const declarations = mod?.declarations ?? [];
  const exportsDecl = mod?.exports ?? [];
  if (!declarations.length && !exportsDecl.length)
    return;
  const { 
    headingOffset = 0,
    classNameFilter = '.*',
    omitSections = [],
    omitDeclarations = [],
  } = options ?? {};
  
  const omittedSections = getOmittedConfig('section', omitSections);
  const omittedDeclarations = getOmittedConfig('decl', omitDeclarations);

  const makeTable = tableWithTitle(options);
  const makeHeading = declarationHeading(options);
  const makeDescription = declarationDescription(options);
  const variablesDecl = filteredDeclarations(declarations, omittedDeclarations, classNameFilter).filter(kindIs('variable'));
  const functionsDecl = filteredDeclarations(declarations, omittedDeclarations, classNameFilter).filter(kindIs('function'));

  return [
    optionEnabled(omittedSections.mainHeading) ? heading(1 + headingOffset, [inlineCode(mod.path), text(':')]) : null,

    ...(filteredDeclarations(declarations, omittedDeclarations, classNameFilter).flatMap(decl => {

      const { kind, members = [] } = decl;
      const fieldsDecl = members.filter(and(kindIs('field'), not(isStatic)));
      const methodsDecl = members.filter(and(kindIs('method'), not(isStatic)));
      const staticFieldsDecl = members.filter(and(kindIs('field'), isStatic));
      const staticMethodsDecl = members.filter(and(kindIs('method'), isStatic));

      const nodes = [
        !['mixin', 'class'].includes(kind) ? null : makeHeading(decl),
        ...optionEnabled(omittedSections.description) ? makeDescription(decl) : [],
        ...optionEnabled(omittedSections.superClass) ? makeTable('Superclass', [CELLS.NAME, 'module', 'package'], [decl.superclass]) : [],
        ...optionEnabled(omittedSections.mixins) ? makeTable('Mixins', [CELLS.NAME, 'module', 'package'], decl.mixins) : [],
        ...kind === 'mixin' && optionEnabled(omittedSections.mixins) ?  makeTable('Parameters', [CELLS.NAME, CELLS.TYPE, CELLS.DEFAULT, 'description'], decl.parameters) : [],
        ...optionEnabled(omittedSections.staticFields) ? makeTable('Static Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], staticFieldsDecl) : [],
        ...optionEnabled(omittedSections.staticMethods) ? makeTable('Static Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], staticMethodsDecl) : [],
        ...optionEnabled(omittedSections.fields) ? makeTable('Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], fieldsDecl) : [],
        ...optionEnabled(omittedSections.methods) ? makeTable('Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], methodsDecl) : [],
        ...optionEnabled(omittedSections.events) ? makeTable('Events', [CELLS.NAME, CELLS.TYPE, 'description', CELLS.INHERITANCE], decl.events) : [],
        ...optionEnabled(omittedSections.attributes) ? makeTable('Attributes', [CELLS.NAME, CELLS.ATTR_FIELD, CELLS.INHERITANCE], decl.attributes) : [],
        ...optionEnabled(omittedSections.cssProperties) ? makeTable('CSS Properties', [CELLS.NAME, CELLS.DEFAULT, 'description'], decl.cssProperties) : [],
        ...optionEnabled(omittedSections.cssParts) ? makeTable('CSS Parts', [CELLS.NAME, 'description'], decl.cssParts) : [],
        ...optionEnabled(omittedSections.slots) ? makeTable('Slots', [CELLS.NAME, 'description'], decl.slots) : [],
      ].filter(identity);

      if (
        options?.private === 'details'
        && ( isLengthy(fieldsDecl.filter(or(isPrivate, isProtected)))
          || isLengthy(methodsDecl.filter(or(isPrivate, isProtected))) )
      ) {
        nodes.push(
          html('<details><summary>Private API</summary>'),
          ...makeTable('Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], fieldsDecl.filter(or(isPrivate, isProtected)), { filter: identity }),
          ...makeTable('Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], methodsDecl.filter(or(isPrivate, isProtected)), { filter: identity }),
          html('</details>')
        );
      }

      if (nodes.length)
        nodes.push(line);

      return nodes;
    })),

    ...variablesDecl.length && optionEnabled(omittedDeclarations.variables) ? makeTable('Variables', [CELLS.NAME, 'description', CELLS.TYPE], variablesDecl, { headingLevel: 2} ) : [],
    ...variablesDecl.length && optionEnabled(omittedDeclarations.variables) ? [line] : [],
    ...functionsDecl.length && optionEnabled(omittedDeclarations.functions) ? makeTable('Functions', [CELLS.NAME, 'description', CELLS.PARAMETERS, CELLS.RETURN], functionsDecl, { headingLevel: 2} ) : [],
    ...functionsDecl.length && optionEnabled(omittedDeclarations.functions) ? [line] : [],
    ...optionEnabled(omittedDeclarations.exports) ? makeTable('Exports', [CELLS.EXPORT_KIND, CELLS.NAME, CELLS.DECLARATION, CELLS.MODULE, CELLS.PACKAGE], mod.exports, { headingLevel: 2} ) : [],
  ].filter(identity)
}

/**
 * Renders a custom elements manifest as Markdown
 * @param  {import('custom-elements-manifest/schema').Package} manifest
 * @param  {import('./types/main').Options} manifest
 * @return {string}
 */
export function customElementsManifestToMarkdown(manifest, options) {
  const tree =
    root(manifest.modules
      .flatMap(x => makeModuleDoc(x, options))
      .filter(identity))

  return serialize(tree);
}
