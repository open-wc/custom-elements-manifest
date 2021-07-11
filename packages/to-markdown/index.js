import { html, heading, inlineCode, root, table, tableCell, tableRow, text } from 'mdast-builder';
import {
  capital, repeat,
  compose, identity,
  isPrivate, isProtected, isStatic,
  isLengthy,
  kindIs,
  and, not, or,
  trace,
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

/** @type {import("./types/main").MakeModuleDocFn} */
function makeModuleDoc(mod, options) {
  const declarations = mod?.declarations ?? [];
  const exports = mod?.exports ?? [];
  if (!declarations.length && !exports.length)
    return;
  const { headingOffset = 0 } = options ?? {};
  const makeTable = tableWithTitle(options);
  const makeHeading = declarationHeading(options);
  const variables = declarations.filter(kindIs('variable'));
  const functions = declarations.filter(kindIs('function'));
  return [
    heading(1 + headingOffset, [inlineCode(mod.path), text(':')]),

    ...(declarations.flatMap(decl => {

      const { kind, members = [] } = decl;
      const fields = members.filter(and(kindIs('field'), not(isStatic)));
      const methods = members.filter(and(kindIs('method'), not(isStatic)));
      const staticFields = members.filter(and(kindIs('field'), isStatic));
      const staticMethods = members.filter(and(kindIs('method'), isStatic));

      const nodes = [
        !['mixin', 'class'].includes(kind) ? null : makeHeading(decl),
        ...makeTable('Superclass', [CELLS.NAME, 'module', 'package'], [decl.superclass]),
        ...makeTable('Mixins', [CELLS.NAME, 'module', 'package'], decl.mixins),
        ...kind === 'mixin' ?
           makeTable('Parameters', [CELLS.NAME, CELLS.TYPE, CELLS.DEFAULT, 'description'], decl.parameters)
         : [],
        ...makeTable('Static Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], staticFields),
        ...makeTable('Static Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], staticMethods),
        ...makeTable('Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], fields),
        ...makeTable('Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], methods),
        ...makeTable('Events', [CELLS.NAME, CELLS.TYPE, 'description', CELLS.INHERITANCE], decl.events),
        ...makeTable('Attributes', [CELLS.NAME, CELLS.ATTR_FIELD, CELLS.INHERITANCE], decl.attributes),
        ...makeTable('CSS Properties', [CELLS.NAME, CELLS.DEFAULT, 'description'], decl.cssProperties),
        ...makeTable('CSS Parts', [CELLS.NAME, 'description'], decl.cssParts),
        ...makeTable('Slots', [CELLS.NAME, 'description'], decl.slots),
      ].filter(identity);

      if (
        options?.private === 'details'
        && ( isLengthy(fields.filter(or(isPrivate, isProtected)))
          || isLengthy(methods.filter(or(isPrivate, isProtected))) )
      ) {
        nodes.push(
          html('<details><summary>Private API</summary>'),
          ...makeTable('Fields', [CELLS.NAME, 'privacy', CELLS.TYPE, CELLS.DEFAULT, 'description', CELLS.INHERITANCE], fields.filter(or(isPrivate, isProtected)), { filter: identity }),
          ...makeTable('Methods', [CELLS.NAME, 'privacy', 'description', CELLS.PARAMETERS, CELLS.RETURN, CELLS.INHERITANCE], methods.filter(or(isPrivate, isProtected)), { filter: identity }),
          html('</details>')
        );
      }

      if (nodes.length)
        nodes.push(line);

      return nodes;
    })),

    ...makeTable('Variables', [CELLS.NAME, 'description', CELLS.TYPE], variables, { headingLevel: 2} ),
    ...variables.length ? [line] : [],
    ...makeTable('Functions', [CELLS.NAME, 'description', CELLS.PARAMETERS, CELLS.RETURN], functions, { headingLevel: 2} ),
    ...functions.length ? [line] : [],
    ...makeTable('Exports', [CELLS.EXPORT_KIND, CELLS.NAME, CELLS.DECLARATION, CELLS.MODULE, CELLS.PACKAGE], mod.exports, { headingLevel: 2} ),
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
