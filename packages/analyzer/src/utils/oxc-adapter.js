/**
 * OXC Adapter
 *
 * This module provides a TypeScript-compiler-API-compatible interface backed by oxc-parser.
 * It allows the rest of the codebase to remain mostly unchanged while switching from
 * TypeScript's AST to an ESTree-compatible AST produced by oxc-parser.
 */

import { parseSync } from 'oxc-parser';
import { parse as parseComments } from 'comment-parser';

// ---------------------------------------------------------------------------
// SyntaxKind constants (string values matching ESTree/oxc node types)
// ---------------------------------------------------------------------------

export const SyntaxKind = {
  // Program / SourceFile
  SourceFile: 'Program',

  // Declarations
  ClassDeclaration: 'ClassDeclaration',
  ClassExpression: 'ClassExpression',
  FunctionDeclaration: 'FunctionDeclaration',
  VariableStatement: 'VariableStatement',      // mapped from ESTree VariableDeclaration
  VariableDeclaration: 'VariableDeclaration',  // mapped from ESTree VariableDeclarator

  // Class members
  MethodDeclaration: 'MethodDeclaration',
  Constructor: 'Constructor',
  GetAccessor: 'GetAccessor',
  SetAccessor: 'SetAccessor',
  PropertyDeclaration: 'PropertyDeclaration',

  // Expressions
  ArrowFunction: 'ArrowFunctionExpression',
  CallExpression: 'CallExpression',
  NewExpression: 'NewExpression',
  BinaryExpression: 'BinaryExpression',
  ExpressionStatement: 'ExpressionStatement',
  ReturnStatement: 'ReturnStatement',
  AsExpression: 'TSAsExpression',
  ConditionalExpression: 'ConditionalExpression',
  PrefixUnaryExpression: 'UnaryExpression',
  PropertyAccessExpression: 'MemberExpression',
  Identifier: 'Identifier',
  ThisKeyword: 'ThisExpression',
  Block: 'BlockStatement',

  // Literals
  StringLiteral: 'StringLiteral',
  NumericLiteral: 'NumericLiteral',
  TrueKeyword: 'TrueKeyword',
  FalseKeyword: 'FalseKeyword',
  NullKeyword: 'NullKeyword',
  ArrayLiteralExpression: 'ArrayExpression',
  ObjectLiteralExpression: 'ObjectExpression',
  PropertyAssignment: 'Property',

  // Exports / Imports
  ExportDeclaration: 'ExportDeclaration',
  ExportAssignment: 'ExportAssignment',

  // Modifiers (as synthetic kind values)
  ExportKeyword: 'ExportKeyword',
  DefaultKeyword: 'DefaultKeyword',
  StaticKeyword: 'StaticKeyword',
  ReadonlyKeyword: 'ReadonlyKeyword',
  PublicKeyword: 'PublicKeyword',
  PrivateKeyword: 'PrivateKeyword',
  ProtectedKeyword: 'ProtectedKeyword',
  ExtendsKeyword: 'ExtendsKeyword',

  // Tokens
  ExclamationToken: '!',
  CommaToken: ',',

  // TypeScript-specific
  TSTypeReference: 'TSTypeReference',

  // JSDoc tag kinds (synthetic)
  JSDocReadonlyTag: 'JSDocReadonlyTag',
  JSDocParameterTag: 'JSDocParameterTag',
  JSDocReturnTag: 'JSDocReturnTag',
  JSDocTypeTag: 'JSDocTypeTag',
  JSDocPublicTag: 'JSDocPublicTag',
  JSDocPrivateTag: 'JSDocPrivateTag',
  JSDocProtectedTag: 'JSDocProtectedTag',
};

// ---------------------------------------------------------------------------
// Type predicates (isXxx functions)
// ---------------------------------------------------------------------------

export const isClassDeclaration    = node => node?.kind === 'ClassDeclaration';
export const isClassExpression     = node => node?.kind === 'ClassExpression';
export const isFunctionDeclaration = node => node?.kind === 'FunctionDeclaration';
export const isVariableStatement   = node => node?.kind === 'VariableStatement';
export const isVariableDeclaration = node => node?.kind === 'VariableDeclaration';
export const isMethodDeclaration   = node => node?.kind === 'MethodDeclaration';
export const isGetAccessor         = node => node?.kind === 'GetAccessor';
export const isSetAccessor         = node => node?.kind === 'SetAccessor';
export const isPropertyDeclaration = node => node?.kind === 'PropertyDeclaration';
export const isStringLiteral       = node => node?.kind === 'StringLiteral';
export const isNumericLiteral      = node => node?.kind === 'NumericLiteral';
export const isBlock               = node => node?.kind === 'BlockStatement';
export const isCallExpression      = node => node?.kind === 'CallExpression';
export const isReturnStatement     = node => node?.kind === 'ReturnStatement';
export const isObjectLiteralExpression = node => node?.kind === 'ObjectExpression';
export const isAsExpression        = node => node?.kind === 'TSAsExpression';
export const isTypeReferenceNode   = node => node?.kind === 'TSTypeReference';
export const isDecorator           = node => node?.type === 'Decorator';
export const isPrivateIdentifier   = node =>
  node?.type === 'PrivateIdentifier' || (typeof node?.name === 'string' && node.name.startsWith('#'));

// ---------------------------------------------------------------------------
// forEachChild – visits all direct child nodes
// ---------------------------------------------------------------------------

/** Properties that contain child nodes in ESTree */
// 'callee', 'object', and 'property' are intentionally excluded because they are aliased to
// 'expression' and 'name' via the augmentation (to avoid visiting the same node twice).
const CHILD_PROPS = [
  'body', 'declaration', 'declarations', 'init', 'id', 'left', 'right',
  'expression', 'argument', 'arguments',
  'elements', 'properties', 'key', 'value', 'superClass', 'source',
  'specifiers', 'local', 'imported', 'exported', 'consequent', 'alternate',
  'test', 'update', 'discriminant', 'cases', 'param', 'params', 'returnType',
  'typeAnnotation', 'typeParameters', 'implements', 'decorators', 'expressions',
];

export function forEachChild(node, cb) {
  if (!node || typeof node !== 'object') return;
  for (const key of CHILD_PROPS) {
    const val = node[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      for (const child of val) {
        if (child && typeof child === 'object' && child.type) cb(child);
      }
    } else if (val && typeof val === 'object' && val.type) {
      cb(val);
    }
  }
}

// ---------------------------------------------------------------------------
// Modifier helpers
// ---------------------------------------------------------------------------

function buildModifier(kind) {
  return { kind, type: kind };
}

function buildModifiers(node) {
  const mods = [];
  if (node.static)    mods.push(buildModifier('StaticKeyword'));
  if (node.readonly)  mods.push(buildModifier('ReadonlyKeyword'));
  switch (node.accessibility) {
    case 'public':    mods.push(buildModifier('PublicKeyword'));    break;
    case 'private':   mods.push(buildModifier('PrivateKeyword'));   break;
    case 'protected': mods.push(buildModifier('ProtectedKeyword')); break;
  }
  // Include decorators in modifiers (TypeScript puts them there)
  if (Array.isArray(node.decorators)) mods.push(...node.decorators);
  return mods;
}

// ---------------------------------------------------------------------------
// getText helper
// ---------------------------------------------------------------------------

function makeGetText(source, start, end) {
  return function getText() { return source.slice(start, end); };
}

// ---------------------------------------------------------------------------
// JSDoc helpers
// ---------------------------------------------------------------------------

/** Tags that have a meaningful "name" field (e.g. the parameter name) */
const NAMED_JSDOC_TAGS = new Set([
  'param', 'arg', 'argument',
  'property', 'prop',
  'fires', 'event',
  'attr', 'attribute',
  'csspart', 'part',
  'cssprop', 'cssproperty',
  'slot',
  'tag', 'tagname', 'element', 'customElement', 'customelement',
  'cssState', 'cssstate',
]);

const TAG_KIND_MAP = {
  readonly:  'JSDocReadonlyTag',
  param:     'JSDocParameterTag',
  arg:       'JSDocParameterTag',
  argument:  'JSDocParameterTag',
  returns:   'JSDocReturnTag',
  return:    'JSDocReturnTag',
  type:      'JSDocTypeTag',
  public:    'JSDocPublicTag',
  private:   'JSDocPrivateTag',
  protected: 'JSDocProtectedTag',
};

function buildJsDocTag(cpTag) {
  const isNamed = NAMED_JSDOC_TAGS.has(cpTag.tag);
  // For named tags (like @param), comment = description only (not including name)
  // For others (like @type, @summary), comment = everything after type (name + description)
  const comment = isNamed
    ? cpTag.description
    : [cpTag.name, cpTag.description].filter(Boolean).join(' ').trim();

  return {
    kind: TAG_KIND_MAP[cpTag.tag] || ('JSDoc_' + cpTag.tag),
    tagName: { getText: () => cpTag.tag },
    comment,
    name: isNamed && cpTag.name
      ? { getText: () => cpTag.name, text: cpTag.name }
      : null,
    isBracketed: cpTag.optional,
    typeExpression: cpTag.type
      ? { type: { getText: () => cpTag.type } }
      : null,
  };
}

function buildJsDoc(rawCommentValue, source, commentStart, commentEnd) {
  const fullText = '/*' + rawCommentValue + '*/';
  let parsed;
  try {
    parsed = parseComments(fullText, { spacing: 'preserve' });
  } catch (_) {
    parsed = [];
  }
  if (!parsed || parsed.length === 0) {
    return { comment: '', getFullText: () => fullText, tags: [] };
  }
  const doc = parsed[0];
  // Process inline {@link ...} tags: first word is symbol, rest is display text (trimmed)
  const description = (doc.description || '').replace(/\{@link\s+([^}]+)\}/g, (_, content) => {
    content = content.trim();
    const spaceIdx = content.search(/\s/);
    if (spaceIdx === -1) return content;
    return content.slice(0, spaceIdx) + content.slice(spaceIdx).trim();
  }).replace(/^\s+|\s+$/g, ''); // trim leading/trailing whitespace
  return {
    comment: description,
    getFullText: () => fullText,
    tags: (doc.tags || []).map(buildJsDocTag),
  };
}

/**
 * Build a map from each node's start position to its leading JSDoc comment.
 * Associates a block comment with a node if the text between comment end
 * and node start is all whitespace (possibly including 'export'/'default' keywords).
 */
function buildJsDocMap(comments, source) {
  const map = new Map();
  // Only consider block comments that look like JSDoc (starting with *)
  const jsDocComments = comments.filter(c => c.type === 'Block' && c.value.startsWith('*'));

  for (const comment of jsDocComments) {
    // Find the closest node start that comes after this comment
    // We store the comment keyed by its end position
    // During augmentation we'll look up by node start
    map.set(comment.end, comment);
  }
  return { jsDocComments, map };
}

/**
 * Find the JSDoc comment immediately preceding a node.
 */
function findLeadingJsDoc(nodeStart, jsDocComments, source) {
  // Find the last JSDoc comment that ends before nodeStart
  // and has only whitespace between comment.end and nodeStart
  for (let i = jsDocComments.length - 1; i >= 0; i--) {
    const comment = jsDocComments[i];
    if (comment.end > nodeStart) continue;
    const between = source.slice(comment.end, nodeStart);
    if (/^\s*$/.test(between)) {
      return comment;
    }
    // Also allow "export " or "export default " to be between
    if (/^\s*(export\s+)?(default\s+)?$/.test(between)) {
      return comment;
    }
    // Comment found but not adjacent - stop looking
    break;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Node augmentation
// ---------------------------------------------------------------------------

/**
 * Recursively augments all nodes in the ESTree with TypeScript-compatible properties.
 */
function augmentTree(node, source, sourceFile, jsDocComments, parent = null) {
  if (!node || typeof node !== 'object' || !node.type) return;

  // Set parent reference
  node.parent = parent;

  // Add getText()
  if (node.start !== undefined && node.end !== undefined) {
    node.getText = makeGetText(source, node.start, node.end);
  }

  // Add getSourceFile()
  node.getSourceFile = () => sourceFile;

  // Set node.kind based on type and context
  augmentKind(node);

  // Augment specific node types
  switch (node.type) {
    case 'Program':
      augmentProgram(node, source, sourceFile);
      break;

    case 'Identifier':
      augmentIdentifier(node);
      break;

    case 'PrivateIdentifier':
      augmentPrivateIdentifier(node);
      break;

    case 'Literal':
      augmentLiteral(node);
      break;

    case 'VariableDeclaration':
      augmentVariableDeclaration(node, source, jsDocComments);
      break;

    case 'VariableDeclarator':
      augmentVariableDeclarator(node, source, jsDocComments);
      break;

    case 'ClassDeclaration':
    case 'ClassExpression':
      augmentClass(node, source, jsDocComments);
      break;

    case 'FunctionDeclaration':
    case 'FunctionExpression':
      // Remove the boolean 'expression' property (ESTree arrow function marker)
      // that conflicts with TypeScript's usage of 'expression' as a child node
      if (typeof node.expression === 'boolean') delete node.expression;
      augmentFunction(node);
      break;

    case 'ArrowFunctionExpression':
      // For arrow functions with expression body, keep expression as the body node
      if (typeof node.expression === 'boolean') delete node.expression;
      augmentArrowFunction(node);
      break;

    case 'MethodDefinition':
      augmentMethodDefinition(node, source, jsDocComments);
      break;

    case 'PropertyDefinition':
      augmentPropertyDefinition(node, source, jsDocComments);
      break;

    case 'BlockStatement':
      augmentBlockStatement(node);
      break;

    case 'ReturnStatement':
      // TypeScript uses .expression for the return value; ESTree uses .argument
      node.expression = node.argument;
      break;

    case 'ImportDeclaration':
      augmentImportDeclaration(node);
      break;

    case 'ExportNamedDeclaration':
      augmentExportNamedDeclaration(node, source);
      break;

    case 'ExportDefaultDeclaration':
      augmentExportDefaultDeclaration(node);
      break;

    case 'ExportAllDeclaration':
      augmentExportAllDeclaration(node);
      break;

    case 'ExportSpecifier':
      augmentExportSpecifier(node);
      break;

    case 'MemberExpression':
      augmentMemberExpression(node);
      break;

    case 'CallExpression':
      augmentCallExpression(node);
      break;

    case 'NewExpression':
      augmentNewExpression(node);
      break;

    case 'AssignmentExpression':
      augmentAssignmentExpression(node);
      break;

    case 'SequenceExpression':
      augmentSequenceExpression(node);
      break;

    case 'UnaryExpression':
      augmentUnaryExpression(node);
      break;

    case 'TSAsExpression':
      augmentTSAsExpression(node);
      break;

    case 'TSTypeReference':
      augmentTSTypeReference(node, source);
      break;

    case 'Property':
      augmentProperty(node, source, jsDocComments);
      break;
  }

  // Attach JSDoc to node
  attachJsDoc(node, source, jsDocComments);

  // Recursively augment children
  augmentChildren(node, source, sourceFile, jsDocComments);
}

function augmentChildren(node, source, sourceFile, jsDocComments) {
  for (const key of Object.keys(node)) {
    if (key === 'parent' || typeof node[key] === 'function') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const child of val) {
        if (child && typeof child === 'object' && child.type && !child._augmented) {
          child._augmented = true;
          augmentTree(child, source, sourceFile, jsDocComments, node);
        }
      }
    } else if (val && typeof val === 'object' && val.type && !val._augmented) {
      val._augmented = true;
      augmentTree(val, source, sourceFile, jsDocComments, node);
    }
  }
}

function augmentKind(node) {
  // Map ESTree types to TypeScript SyntaxKind-compatible strings
  switch (node.type) {
    case 'Program':                   node.kind = 'Program'; break;
    case 'ClassDeclaration':          node.kind = 'ClassDeclaration'; break;
    case 'ClassExpression':           node.kind = 'ClassExpression'; break;
    case 'FunctionDeclaration':       node.kind = 'FunctionDeclaration'; break;
    case 'FunctionExpression':        node.kind = 'FunctionExpression'; break;
    case 'ArrowFunctionExpression':   node.kind = 'ArrowFunctionExpression'; break;
    case 'CallExpression':            node.kind = 'CallExpression'; break;
    case 'NewExpression':             node.kind = 'NewExpression'; break;
    case 'MemberExpression':          node.kind = 'MemberExpression'; break;
    case 'Identifier':                node.kind = 'Identifier'; break;
    case 'PrivateIdentifier':         node.kind = 'PrivateIdentifier'; break;
    case 'ThisExpression':            node.kind = 'ThisExpression'; break;
    case 'ReturnStatement':           node.kind = 'ReturnStatement'; break;
    case 'ExpressionStatement':       node.kind = 'ExpressionStatement'; break;
    case 'BlockStatement':            node.kind = 'BlockStatement'; break;
    case 'ArrayExpression':           node.kind = 'ArrayExpression'; break;
    case 'ObjectExpression':          node.kind = 'ObjectExpression'; break;
    case 'ConditionalExpression':     node.kind = 'ConditionalExpression'; break;
    case 'TSAsExpression':            node.kind = 'TSAsExpression'; break;
    case 'TSTypeReference':           node.kind = 'TSTypeReference'; break;
    case 'AssignmentExpression':      node.kind = 'BinaryExpression'; break;  // TS uses BinaryExpression for =
    case 'BinaryExpression':          node.kind = 'BinaryExpression'; break;
    case 'SequenceExpression':        node.kind = 'SequenceExpression'; break;
    case 'UnaryExpression':           node.kind = 'UnaryExpression'; break;
    case 'Property':                  node.kind = 'Property'; break;
    // MethodDefinition: keep original kind ('constructor'/'method'/'get'/'set')
    // augmentMethodDefinition will remap to TypeScript equivalents
    case 'MethodDefinition':          /* keep node.kind as-is */ break;
    // PropertyDefinition: no kind in ESTree, augmentPropertyDefinition sets it
    case 'PropertyDefinition':        /* augmentPropertyDefinition sets kind */ break;
    // VariableDeclaration and VariableDeclarator are handled separately
    case 'VariableDeclaration':       /* augmentVariableDeclaration sets kind */ break;
    case 'VariableDeclarator':        /* augmentVariableDeclarator sets kind */ break;
    default:
      node.kind = node.type;
  }
}

function augmentProgram(node, source, sourceFile) {
  node.kind = 'Program';
  node.statements = node.body;
  // fileName already set by createSourceFile
}

function augmentIdentifier(node) {
  node.text = node.name;
  node.getText = () => node.name;
}

function augmentPrivateIdentifier(node) {
  const fullName = '#' + node.name;
  node.text = fullName;
  node.getText = () => fullName;
  node.kind = 'PrivateIdentifier';
}

function augmentLiteral(node) {
  // Determine specific kind from value type
  if (typeof node.value === 'string') {
    node.kind = 'StringLiteral';
    node.text = node.value;
  } else if (typeof node.value === 'number') {
    node.kind = 'NumericLiteral';
    node.text = String(node.value);
  } else if (node.value === true) {
    node.kind = 'TrueKeyword';
    node.text = 'true';
  } else if (node.value === false) {
    node.kind = 'FalseKeyword';
    node.text = 'false';
  } else if (node.value === null) {
    node.kind = 'NullKeyword';
    node.text = 'null';
  }
}

function augmentVariableDeclaration(node, source, jsDocComments) {
  // TypeScript calls the outer wrapper VariableStatement
  node.kind = 'VariableStatement';
  // Add declarationList.declarations adapter
  // Each VariableDeclarator becomes a TS-like VariableDeclaration
  node.declarationList = {
    declarations: node.declarations,
  };
}

function augmentVariableDeclarator(node, source, jsDocComments) {
  node.kind = 'VariableDeclaration';
  // TS uses .name for the binding identifier, ESTree uses .id
  node.name = node.id;
  // TS uses .initializer, ESTree uses .init
  node.initializer = node.init || null;
}

function augmentClass(node, source, jsDocComments) {
  // Add .name alias pointing to .id (with getText(), text)
  // Leave undefined (not null) for anonymous classes so isUnnamed checks work correctly
  if (node.id) {
    node.name = node.id;
  }

  // Add .members alias pointing to body.body
  if (node.body && Array.isArray(node.body.body)) {
    node.members = node.body.body;
  } else {
    node.members = [];
  }

  // Add .heritageClauses adapter
  if (node.superClass) {
    node.heritageClauses = [{
      token: 'ExtendsKeyword',
      types: [{ expression: node.superClass }],
    }];
  } else {
    node.heritageClauses = [];
  }

  // Build modifiers array including decorators (TypeScript puts decorators in modifiers).
  // If modifiers were already set by augmentExportNamedDeclaration (e.g., ExportKeyword),
  // append the class's own decorators to keep the existing keywords.
  const decoratorMods = Array.isArray(node.decorators) ? node.decorators : [];
  if (Array.isArray(node.modifiers)) {
    // Modifiers already initialized (by parent export wrapper) – just append decorators
    node.modifiers.push(...decoratorMods);
  } else {
    node.modifiers = buildModifiers(node);
  }
}

function augmentFunction(node) {
  // Add .name alias for function declarations
  if (node.type === 'FunctionDeclaration' && node.id) {
    node.name = node.id;
  }
  // Add .parameters alias
  node.parameters = node.params || [];
  // Add return type node (separate from node.type discriminant)
  if (node.returnType && node.returnType.typeAnnotation) {
    node.returnTypeNode = node.returnType.typeAnnotation;
  }
  // Augment params to have TypeScript-compatible properties
  if (node.params) {
    for (const param of node.params) {
      augmentParam(param);
    }
  }
}

function augmentArrowFunction(node) {
  node.parameters = node.params || [];
  // Add return type node (separate from node.type discriminant)
  if (node.returnType && node.returnType.typeAnnotation) {
    node.returnTypeNode = node.returnType.typeAnnotation;
  }
  if (node.params) {
    for (const param of node.params) {
      augmentParam(param);
    }
  }
}

function augmentParam(param) {
  if (!param) return;
  // Idempotency guard: prevent double-augmentation when augmentParam is called from both
  // augmentMethodDefinition and augmentFunction (for the same FunctionExpression params).
  if (param._paramAugmented) return;
  param._paramAugmented = true;

  if (param.type === 'AssignmentPattern') {
    // function foo(a = 'default') {}
    // param.left is the bound name (Identifier/ObjectPattern/etc.)
    // param.right is the default value expression
    const nameStr = param.left?.name || '';
    param.name = {
      name: nameStr,
      text: nameStr,
      getText: () => nameStr,
    };
    param.initializer = param.right || null;
  } else if (param.type === 'Identifier') {
    // For Identifier params, param.name is already a string in ESTree.
    // We do NOT convert it to an object here – handleParametersAndReturnType handles strings directly.
    // This avoids double-augmentation bugs when both augmentMethodDefinition and augmentFunction
    // call augmentParam on the same param nodes.
  } else if (param.type === 'RestElement') {
    // function foo(...args) {}
    const nameStr = param.argument?.name || '';
    param.name = {
      name: nameStr,
      text: nameStr,
      getText: () => nameStr,
    };
  }

  // TypeScript uses .type for the TypeScript type annotation
  // ESTree uses .typeAnnotation; we store the actual type in .typeNode
  if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
    param.typeNode = param.typeAnnotation.typeAnnotation;
  }

  // TypeScript uses .questionToken for optional params
  if (param.optional) {
    param.questionToken = {};
  }
}

function augmentMethodDefinition(node, source, jsDocComments) {
  // Map MethodDefinition.kind (constructor/method/get/set) to TypeScript kinds
  switch (node.kind) {
    case 'constructor':
      node.kind = 'Constructor';
      node.type = 'Constructor'; // also update type for forEachChild compatibility
      break;
    case 'get':
      node.kind = 'GetAccessor';
      node.type = 'GetAccessor';
      break;
    case 'set':
      node.kind = 'SetAccessor';
      node.type = 'SetAccessor';
      break;
    default: // 'method'
      node.kind = 'MethodDeclaration';
      node.type = 'MethodDeclaration';
  }

  // Add .name alias for the method name
  node.name = node.key;

  // Add .parameters alias (from the FunctionExpression value)
  node.parameters = node.value?.params || [];
  if (node.value?.params) {
    for (const param of node.value.params) {
      augmentParam(param);
    }
  }

  // Add fake .body (not a real AST node, so forEachChild won't traverse it)
  // but provides .body.statements for constructor analysis code
  const bodyStatements = node.value?.body?.body || [];
  node.body = { statements: bodyStatements };

  // Add return type alias
  if (node.value?.returnType?.typeAnnotation) {
    node.returnTypeNode = node.value.returnType.typeAnnotation;
  }

  // Build modifiers array
  node.modifiers = buildModifiers(node);
}

function augmentPropertyDefinition(node, source, jsDocComments) {
  // Remap to TypeScript PropertyDeclaration
  node.kind = 'PropertyDeclaration';
  node.type = 'PropertyDeclaration';

  // Add .name alias for the property name
  node.name = node.key;

  // Add .initializer alias (ESTree uses .value)
  node.initializer = node.value || null;

  // Add type node alias (separate from node.type discriminant)
  if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) {
    node.typeNode = node.typeAnnotation.typeAnnotation;
  }

  // Add questionToken for optional fields
  if (node.optional) {
    node.questionToken = {};
  }

  // Build modifiers array
  node.modifiers = buildModifiers(node);
}

function augmentBlockStatement(node) {
  // Add .statements alias
  node.statements = node.body;
}

function augmentImportDeclaration(node) {
  // Build TypeScript-compatible importClause
  const defaultSpecifier = node.specifiers?.find(s => s.type === 'ImportDefaultSpecifier');
  const namedSpecifiers = node.specifiers?.filter(s => s.type === 'ImportSpecifier') || [];
  const namespaceSpecifier = node.specifiers?.find(s => s.type === 'ImportNamespaceSpecifier');

  const isTypeOnly = node.importKind === 'type';
  const hasSideEffect = !defaultSpecifier && namedSpecifiers.length === 0 && !namespaceSpecifier;

  if (hasSideEffect) {
    node.importClause = null;
  } else {
    node.importClause = {
      isTypeOnly,
      name: defaultSpecifier ? defaultSpecifier.local : null,
      namedBindings: namedSpecifiers.length > 0
        ? {
            elements: namedSpecifiers.map(s => ({
              type: 'ImportSpecifier',
              name: s.local,
              propertyName: s.imported?.name !== s.local?.name ? s.imported : null,
            })),
          }
        : namespaceSpecifier
          ? { name: namespaceSpecifier.local }
          : null,
    };
  }

  // Add moduleSpecifier adapter
  if (node.source) {
    node.moduleSpecifier = {
      text: node.source.value,
      getText: () => node.source.raw || `'${node.source.value}'`,
    };
  }
}

function augmentExportNamedDeclaration(node, source) {
  if (node.declaration) {
    // export class/function/const → add export modifier to the declaration
    const exportMod = buildModifier('ExportKeyword');
    if (!node.declaration.modifiers) node.declaration.modifiers = [];
    node.declaration.modifiers.unshift(exportMod);
    // Don't remap node.kind here — keep it as ExportNamedDeclaration
    // so forEachChild can visit the declaration
  } else {
    // export { foo } or export { foo } from 'bar' or export * as ns
    node.kind = 'ExportDeclaration';

    // Build exportClause.elements from specifiers
    if (node.specifiers && node.specifiers.length > 0) {
      node.exportClause = {
        elements: node.specifiers.map(s => s),  // already augmented as ExportSpecifier
      };
    } else {
      node.exportClause = null;
    }

    // moduleSpecifier adapter
    if (node.source) {
      node.moduleSpecifier = {
        text: node.source.value,
        getText: () => node.source.raw || `'${node.source.value}'`,
      };
    } else {
      node.moduleSpecifier = undefined;
    }
  }
}

function augmentExportDefaultDeclaration(node) {
  const decl = node.declaration;
  if (!decl) return;

  if (decl.type === 'ClassDeclaration' || decl.type === 'FunctionDeclaration') {
    // export default class Foo {} → add export + default modifiers to declaration
    if (!decl.modifiers) decl.modifiers = [];
    decl.modifiers.unshift(buildModifier('DefaultKeyword'));
    decl.modifiers.unshift(buildModifier('ExportKeyword'));
  } else {
    // export default expression → TypeScript ExportAssignment
    node.kind = 'ExportAssignment';
    node.expression = decl;
    // For `export default foo` where foo is an Identifier
    if (decl.type === 'Identifier') {
      node.expression.text = decl.name;
    }
  }
}

function augmentExportAllDeclaration(node) {
  node.kind = 'ExportDeclaration';

  // Build exportClause for `export * as ns from 'foo'`
  if (node.exported) {
    node.exportClause = {
      name: {
        getText: () => node.exported.name,
        text: node.exported.name,
      },
    };
  } else {
    node.exportClause = null;
  }

  // moduleSpecifier adapter
  if (node.source) {
    node.moduleSpecifier = {
      text: node.source.value,
      getText: () => node.source.raw || `'${node.source.value}'`,
    };
  }
}

function augmentExportSpecifier(node) {
  // exported.name = the name as exported
  // local.name = the local name (if different = renamed)
  node.name = {
    getText: () => node.exported?.name || '',
    text: node.exported?.name || '',
  };
  // propertyName only set if renamed (local !== exported)
  if (node.local?.name && node.exported?.name && node.local.name !== node.exported.name) {
    node.propertyName = {
      getText: () => node.local.name,
      text: node.local.name,
    };
  } else {
    node.propertyName = null;
  }
}

function augmentMemberExpression(node) {
  // Add .expression alias for .object (TypeScript PropertyAccessExpression.expression)
  node.expression = node.object;
  // Add .name alias for .property (TypeScript PropertyAccessExpression.name)
  node.name = node.property;
}

function augmentCallExpression(node) {
  // Add .expression alias for .callee (TypeScript CallExpression.expression)
  node.expression = node.callee;
}

function augmentNewExpression(node) {
  // Add .expression alias for .callee
  node.expression = node.callee;
}

function augmentAssignmentExpression(node) {
  // TypeScript uses BinaryExpression for assignments
  node.kind = 'BinaryExpression';
  node.operatorToken = { kind: node.operator };
}

function augmentSequenceExpression(node) {
  // TypeScript uses BinaryExpression with CommaToken for comma-separated expressions
  // We transform to a linked chain of "BinaryExpression"s
  node.kind = 'BinaryExpression';
  node.operatorToken = { kind: ',' };
  // Build left/right from the expressions array
  if (node.expressions && node.expressions.length >= 2) {
    // Create a chain: ((a, b), c) → left = (a,b), right = c
    node.left = buildCommaChain(node.expressions.slice(0, -1));
    node.right = node.expressions[node.expressions.length - 1];
  } else if (node.expressions && node.expressions.length === 1) {
    node.left = node.expressions[0];
    node.right = node.expressions[0];
  }
}

function buildCommaChain(exprs) {
  if (exprs.length === 1) return exprs[0];
  const chain = {
    type: 'SequenceExpression',
    kind: 'BinaryExpression',
    operatorToken: { kind: ',' },
    left: buildCommaChain(exprs.slice(0, -1)),
    right: exprs[exprs.length - 1],
  };
  return chain;
}

function augmentUnaryExpression(node) {
  node.kind = 'UnaryExpression';
  node.operator = node.operator; // already correct
}

function augmentTSAsExpression(node) {
  node.kind = 'TSAsExpression';
  // The code in ast-helpers.js checks: ts.isTypeReferenceNode(initializer.type)
  // In TypeScript, AsExpression.type is the TypeScript type annotation
  // In ESTree, node.type is the string 'TSAsExpression' (the discriminant)
  // We store the actual type annotation in typeNode for use by updated code
  if (node.typeAnnotation) {
    node.typeNode = node.typeAnnotation;
  }
}

function augmentTSTypeReference(node, source) {
  node.kind = 'TSTypeReference';
  // Add typeName.getText()
  if (node.typeName) {
    // typeName is already an Identifier node
    // getText() is added during Identifier augmentation
  }
}

function augmentProperty(node, source, jsDocComments) {
  // ObjectExpression property
  node.kind = 'Property';
  // Add .name alias for .key
  node.name = node.key;
  // Add .initializer alias for .value
  node.initializer = node.value || null;
}

// ---------------------------------------------------------------------------
// JSDoc attachment
// ---------------------------------------------------------------------------

/**
 * TSAsExpression needs special handling: the existing code in ast-helpers.js checks
 * initializer.type (which is the TypeScript type node of the AsExpression).
 * We can't set node.type directly (it's the ESTree node type discriminant).
 * So we intercept isAsConst to use typeNode instead.
 */

function attachJsDoc(node, source, jsDocComments) {
  // Only attach to statement-level or class-member-level nodes
  const attachableTypes = new Set([
    'ClassDeclaration', 'ClassExpression', 'FunctionDeclaration',
    'VariableDeclaration', 'VariableStatement', 'ExportNamedDeclaration', 'ExportDefaultDeclaration',
    // Class members
    'PropertyDeclaration', 'MethodDeclaration', 'GetAccessor', 'SetAccessor', 'Constructor',
    // Object properties
    'Property',
    // For completeness
    'ExpressionStatement',
  ]);

  if (!attachableTypes.has(node.kind || node.type)) return;
  if (node.jsDoc) return; // already attached

  const leadingComment = findLeadingJsDoc(node.start, jsDocComments, source);
  if (!leadingComment) {
    node.jsDoc = [];
    return;
  }

  const jsDocObj = buildJsDoc(leadingComment.value, source, leadingComment.start, leadingComment.end);
  node.jsDoc = [jsDocObj];
}

// ---------------------------------------------------------------------------
// createSourceFile – main entry point
// ---------------------------------------------------------------------------

/**
 * Parse source text and return an augmented ESTree Program that is
 * compatible with the TypeScript AST interface used throughout the codebase.
 */
export function createSourceFile(filename, source) {
  // Force TypeScript mode by using a .ts extension. This ensures oxc-parser
  // accepts TypeScript syntax (type annotations, as const, etc.) regardless
  // of the actual file extension.
  const tsFilename = filename.replace(/\.(js|jsx|mjs|cjs)$/, '.ts').replace(/\.(tsx?)$/, '$&');
  const result = parseSync(tsFilename, source, { sourceType: 'module' });
  const program = result.program;
  const { jsDocComments } = buildJsDocMap(result.comments || [], source);

  // Set up the sourceFile reference (program is the sourceFile)
  program.fileName = filename;
  program.kind = 'Program';
  program.statements = program.body;
  program.getText = makeGetText(source, 0, source.length);
  program.getSourceFile = () => program;
  program.jsDoc = [];
  program._augmented = true;

  // Augment all nodes
  augmentChildren(program, source, program, jsDocComments);

  // Also propagate jsDoc from ExportNamedDeclaration to its declaration
  propagateJsDoc(program, source, jsDocComments);

  return program;
}

/**
 * After initial augmentation, propagate JSDoc from export wrapper nodes
 * to their inner declarations (since the analysis code expects JSDoc on
 * ClassDeclaration, FunctionDeclaration, etc. not on the export wrapper).
 */
function propagateJsDoc(program, source, jsDocComments) {
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      if (node.jsDoc && node.jsDoc.length > 0 && (!node.declaration.jsDoc || node.declaration.jsDoc.length === 0)) {
        node.declaration.jsDoc = node.jsDoc;
      }
    }
    if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
      if (node.jsDoc && node.jsDoc.length > 0 && (!node.declaration.jsDoc || node.declaration.jsDoc.length === 0)) {
        node.declaration.jsDoc = node.jsDoc;
      }
    }
    // Visit all children
    for (const key of Object.keys(node)) {
      if (key === 'parent' || typeof node[key] === 'function') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const child of val) {
          if (child && typeof child === 'object' && child.type) visit(child);
        }
      } else if (val && typeof val === 'object' && val.type) {
        visit(val);
      }
    }
  }
  for (const node of program.body) {
    visit(node);
  }
}

// ---------------------------------------------------------------------------
// Default export – provides a TypeScript-like API
// ---------------------------------------------------------------------------

const oxcAdapter = {
  SyntaxKind,
  createSourceFile,
  forEachChild,
  isClassDeclaration,
  isClassExpression,
  isFunctionDeclaration,
  isVariableStatement,
  isVariableDeclaration,
  isMethodDeclaration,
  isGetAccessor,
  isSetAccessor,
  isPropertyDeclaration,
  isStringLiteral,
  isNumericLiteral,
  isBlock,
  isCallExpression,
  isReturnStatement,
  isObjectLiteralExpression,
  isAsExpression,
  isTypeReferenceNode,
  isDecorator,
  isPrivateIdentifier,
};

export default oxcAdapter;
