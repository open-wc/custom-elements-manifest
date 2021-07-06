import { html, heading, inlineCode, root, table, tableCell, tableRow, text } from 'mdast-builder';
import { serialize } from './lib/serialize.js';

const line = html('<hr/>');

const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));
const kindIs = test => ({ kind }) => kind === test;
const repeat = (length, x) => Array.from({ length }, () => x);
const capital = x => typeof x !== 'string' ? x : x.trim().replace(/^\w/, c => c.toUpperCase());

const DECLARATION = { heading: 'Declaration',     get: x => x.declaration?.name ?? '' };
const DEFAULT =     { heading: 'Default',         get: x => x.default, cellType: inlineCode };
const ATTR_FIELD =  { heading: 'Field',           get: x => x.fieldName };
const INHERITANCE = { heading: 'Inherited From',  get: x => x.inheritedFrom?.name ?? '' };
const MODULE =      { heading: 'Module',          get: x => x.declaration?.module ?? '' };
const PACKAGE =     { heading: 'Package',         get: x => x.declaration?.package ?? '' };
const PARAMETERS =  { heading: 'Parameters',      get: x => `${x?.parameters?.map(param => `${param?.name} ${param?.type?.text?.replace(/\|/g, '\\|') || ''}`).join(', ') || ''}` };
const RETURN =      { heading: 'Return',          get: x => x.return?.type?.text ?? x.return, cellType: inlineCode };
const TYPE =        { heading: 'Type',            get: x => x.type?.text ?? '', cellType: inlineCode };

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
  ({ heading: capital(name), get: x => x[name] });

/** String|Descriptor -> Descriptor */
const getDescriptor = x =>
  typeof x === 'string' ? defaultDescriptor(x) : x;

/** [Declaration] -> Descriptor -> Column */
const getColumn = decls =>
  ({ heading, get, cellType = text }) =>
    ({ heading, cellType, values: decls.map(x => get(x)) })

/** Column -> Cell */
const getHeading = x =>
  tableCell(text(x.heading));

/** Int -> Column -> Cell */
const getCell = i =>
  ({ values, cellType }) =>
    tableCell(values[i] ? cellType(values[i]) : text(''))

/** [Column] -> (, Int) -> Row [Cell] */
const getRows = columns =>
  (_, i) =>
    tableRow(columns.map(getCell(i)));

/** Options -> String -> [String|Descriptor] -> [Declaration] -> Parent Table */
const tableWithTitle = options =>
  /**
   * @template {import('custom-elements-manifest/schema').Declaration} T
   * @param  {string} title
   * @param  {(keyof T)|{ heading: string; get: (x: T[keyof T] => string)}[]} names
   * @param  {T[]} decls
   */
  (title, names, decls, { headingLevel = 3 } = { }) => {
    if (!(decls ?? []).filter(Boolean).length) return [];

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

/**
 * @param  {import('custom-elements-manifest/schema').Module} mod
 * @param  {Options} options
 * @return {import('mdast').Parent}
 */
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
      const fields = members.filter(kindIs('field'));
      const methods = members.filter(kindIs('method'));

      const nodes = [
        !['mixin', 'class'].includes(kind) ? null : makeHeading(decl),
        ...makeTable('Superclass', ['name', 'module', 'package'], [decl.superclass]),
        ...makeTable('Mixins', ['name', 'module', 'package'], decl.mixins),
        ...kind === 'mixin' ?
           makeTable('Parameters', ['name', TYPE, DEFAULT, 'description'], decl.parameters)
         : [],
        ...makeTable('Fields', ['name', 'privacy', TYPE, DEFAULT, 'description', INHERITANCE], fields),
        ...makeTable('Methods', ['name', 'privacy', 'description', PARAMETERS, RETURN, INHERITANCE], methods),
        ...makeTable('Events', ['name', TYPE, 'description', INHERITANCE], decl.events),
        ...makeTable('Attributes', ['name', ATTR_FIELD, INHERITANCE], decl.attributes),
        ...makeTable('CSS Properties', ['name', 'description'], decl.cssProperties),
        ...makeTable('Parts', ['name', 'description'], decl.parts),
        ...makeTable('Slots', ['name', 'description'], decl.slots),
      ].filter(Boolean);

      if (nodes.length)
        nodes.push(line);

      return nodes;
    })),

    ...makeTable('Variables', ['name', 'description', TYPE], variables, { headingLevel: 2} ),
    ...variables.length ? [line] : [],
    ...makeTable('Functions', ['name', 'description', PARAMETERS, RETURN], functions, { headingLevel: 2} ),
    ...functions.length ? [line] : [],
    ...makeTable('Exports', ['kind', 'name', DECLARATION, MODULE, PACKAGE], mod.exports, { headingLevel: 2} ),
  ].filter(Boolean)


}

/**
 * Renders a custom elements manifest as Markdown
 * @param  {import('custom-elements-manifest/schema').Package} manifest
 * @return {string}
 */
export function customElementsManifestToMarkdown(manifest, options) {
  const tree =
    root(manifest.modules
      .flatMap(x => makeModuleDoc(x, options))
      .filter(Boolean))

  return serialize(tree);
}
