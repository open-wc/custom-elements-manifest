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
import { serialize } from './lib/serialize.js';

const line = html('<hr/>');

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

/** Declaration[] -> Declaration[] */
function filteredDeclarations(declarationsToFilter, options) {
  const DEFAULT_OPTIONS = {
    classNameFilter: '.*',
    mixins: true,
    variables: true,
    functions: true
  };

  const filterOptions = Object.assign({}, DEFAULT_OPTIONS, options);

  // run classNameFilter function if present
  filterOptions.classNameFilter = filterOptions.classNameFilter instanceof Function ? new RegExp(filterOptions.classNameFilter()) : new RegExp(filterOptions.classNameFilter);
  
  return declarationsToFilter.filter((decl) => {

    if(kindIs('class')(decl)) {
      return filterOptions.classNameFilter.test(decl.name);
    } else if(kindIs('mixin')(decl)) {
      return isDefined(filterOptions.mixins) && filterOptions.mixins === true;
    } else if(kindIs('variable')(decl)) {
      return isDefined(filterOptions.variables) && filterOptions.variables === true;
    } else if(kindIs('function')(decl)) {
      return isDefined(filterOptions.functions) && filterOptions.functions === true;
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
    mainHeading = true,
    superClass = true,
    fields = true,
    methods = true,
    staticFields = true,
    staticMethods = true,
    slots = true,
    events = true,
    attributes = true,
    cssProperties = true,
    cssParts = true,
    exports = true,
    mixins = true,
    variables = true,
    functions = true
  } = options ?? {};

  const makeTable = tableWithTitle(options);
  const makeHeading = declarationHeading(options);
  const variablesDecl = filteredDeclarations(declarations, options).filter(kindIs('variable'));
  const functionsDecl = filteredDeclarations(declarations, options).filter(kindIs('function'));

  return [
    optionEnabled(mainHeading) ? heading(1 + headingOffset, [inlineCode(mod.path), text(':')]) : null,

    ...(filteredDeclarations(declarations, options).flatMap(decl => {

      const { kind, members = [] } = decl;
      const fieldsDecl = members.filter(and(kindIs('field'), not(isStatic)));
      const methodsDecl = members.filter(and(kindIs('method'), not(isStatic)));
      const staticFieldsDecl = members.filter(and(kindIs('field'), isStatic));
      const staticMethodsDecl = members.filter(and(kindIs('method'), isStatic));

      const nodes = [
        !['mixin', 'class'].includes(kind) ? null : makeHeading(decl),
        ...optionEnabled(superClass) ? makeTable('Superclass', [CELLS.NAME, 'module', 'package'], [decl.superclass]) : [],
        ...optionEnabled(mixins) ? makeTable('Mixins', [CELLS.NAME, 'module', 'package'], decl.mixins) : [],
        ...kind === 'mixin' && optionEnabled(mixins) ?  makeTable('Parameters', [CELLS.NAME, CELLS.TYPE, CELLS.DEFAULT, 'description'], decl.parameters) : [],
        ...optionEnabled(staticFields) ? makeTable('Static Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], staticFieldsDecl) : [],
        ...optionEnabled(staticMethods) ? makeTable('Static Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], staticMethodsDecl) : [],
        ...optionEnabled(fields) ? makeTable('Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], fieldsDecl) : [],
        ...optionEnabled(methods) ? makeTable('Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], methodsDecl) : [],
        ...optionEnabled(events) ? makeTable('Events', [CELLS.NAME, CELLS.TYPE, 'description', CELLS.INHERITANCE], decl.events) : [],
        ...optionEnabled(attributes) ? makeTable('Attributes', [CELLS.NAME, CELLS.ATTR_FIELD, CELLS.INHERITANCE], decl.attributes) : [],
        ...optionEnabled(cssProperties) ? makeTable('CSS Properties', [CELLS.NAME, CELLS.DEFAULT, 'description'], decl.cssProperties) : [],
        ...optionEnabled(cssParts) ? makeTable('CSS Parts', [CELLS.NAME, 'description'], decl.cssParts) : [],
        ...optionEnabled(slots) ? makeTable('Slots', [CELLS.NAME, 'description'], decl.slots) : [],
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

    ...variablesDecl.length && optionEnabled(variables) ? makeTable('Variables', [CELLS.NAME, 'description', CELLS.TYPE], variablesDecl, { headingLevel: 2} ) : [],
    ...variablesDecl.length && optionEnabled(variables) ? [line] : [],
    ...functionsDecl.length && optionEnabled(functions) ? makeTable('Functions', [CELLS.NAME, 'description', CELLS.PARAMETERS, CELLS.RETURN], functionsDecl, { headingLevel: 2} ) : [],
    ...functionsDecl.length && optionEnabled(functions) ? [line] : [],
    ...optionEnabled(exports) ? makeTable('Exports', [CELLS.EXPORT_KIND, CELLS.NAME, CELLS.DECLARATION, CELLS.MODULE, CELLS.PACKAGE], mod.exports, { headingLevel: 2} ) : [],
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
