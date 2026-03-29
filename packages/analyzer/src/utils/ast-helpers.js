import { safe, getNodeText } from './index.js';

/**
 * AST HELPERS
 * 
 * Refactored for ESTree AST (oxc-parser) instead of TypeScript AST.
 */

export const isProperty = node => 
  node?.type === 'PropertyDefinition' || 
  (node?.type === 'MethodDefinition' && (node.kind === 'get' || node.kind === 'set'));

/**
 * @example this.dispatchEvent(new Event('foo'));
 */
export const isDispatchEvent = node => {
  if (node?.type !== 'CallExpression') return false;
  const callee = node?.callee;
  return callee?.type === 'MemberExpression' &&
    callee?.object?.type === 'ThisExpression' &&
    callee?.property?.name === 'dispatchEvent';
};

export const isReturnStatement = statement => statement?.type === 'ReturnStatement';

/**
 * @example customElements.define('my-el', MyEl);
 * @example window.customElements.define('my-el', MyEl);
 */
export const isCustomElementsDefineCall = node => {
  if (node?.type !== 'CallExpression') return false;
  const callee = node?.callee;
  if (callee?.type !== 'MemberExpression') return false;
  if (callee?.property?.name !== 'define') return false;
  
  const obj = callee?.object;
  // customElements.define(...)
  if (obj?.type === 'Identifier' && obj?.name === 'customElements') return true;
  // window.customElements.define(...) or globalThis.customElements.define(...)
  if (obj?.type === 'MemberExpression' && 
      obj?.property?.name === 'customElements' &&
      obj?.object?.type === 'Identifier' &&
      (obj?.object?.name === 'window' || obj?.object?.name === 'globalThis')) return true;
  
  return false;
};

/**
 * @example @attr
 * @example @attribute
 */
export function hasAttrAnnotation(member) {
  return member?._jsdoc?.some(jsDoc => jsDoc?.tags?.some(tag => ["attribute", "attr"].includes(tag?.tag)));
}


/**
 * Whether or not node is a primitive value
 */
export function isPrimitive(node) {
  if (!node) return false;
  if (node.type === 'Literal') {
    return typeof node.value === 'number' || 
           typeof node.value === 'string' || 
           typeof node.value === 'boolean' ||
           node.value === null;
  }
  // Handle empty arrays
  if (node.type === 'ArrayExpression' && node.elements?.length === 0) return true;
  return false;
}

/**
 * Checks if a VariableDeclaration has an initializer
 * @example `let foo;` will return false
 * @example `let foo = '';` will return true
 */
export function hasInitializer(node) {
  return node?.declarations?.some(declaration => declaration?.init);
}

export function getElementNameFromDecorator(decorator) {
  const argument = decorator.expression.arguments[0];

  /**
   * @example @customElement('my-el')
   */
  if(argument.type === 'Literal' && typeof argument.value === 'string') {
    return argument.value;
  }

  /**
   * @example @customElement({
   *   name: 'my-el',
   *   template
   * })
   */
  if(argument.type === 'ObjectExpression') {
    let result;
    argument?.properties?.forEach(property => {
      if(property?.key?.name === 'name' || property?.key?.value === 'name') {
        result = property?.value?.value;
      }
    });
    return result;
  }
}


/**
 * Gets the name of an attr from a decorators callExpression
 * @example @attr({attribute: 'my-el'})
 */
export const getOptionsObject = decorator => decorator?.expression?.arguments?.find(arg => arg.type === 'ObjectExpression');

/**
 * Get the return value expression of a return statement, omitting type assertions
 */
export const getReturnValue = (returnStatement, sourceText) => {
  const expr = returnStatement?.argument;
  if (!expr) return undefined;
  
  // Handle TSAsExpression
  if (expr.type === 'TSAsExpression') {
    return getNodeText(expr.expression, sourceText)?.split?.(' ')?.[0];
  }
  
  return getNodeText(expr, sourceText)?.split?.(' ')?.[0];
}

/**
 * Is this class member a static member?
 */
export const isStaticMember = member => !!member?.static;

/**
 * Check if a node has `as const` assertion on its initializer
 */
function isAsConst(initializer) {
  return (
    initializer &&
    initializer.type === 'TSAsExpression' &&
    initializer.typeAnnotation?.type === 'TSTypeReference' &&
    initializer.typeAnnotation?.typeName?.name === 'const'
  );
}

/**
 * Does the node have an initializer with `as const`?
 */
export function isWellKnownType(node) {
  let init;
  if (node?.type === 'PropertyDefinition') {
    init = node.value;
  } else if (node?.type === 'VariableDeclarator') {
    init = node.init;
  } else {
    init = node?.initializer;
  }
  return init && isAsConst(init);
}

/**
 * Whether or not a node has an `@ignore` jsdoc annotation
 */
export const hasIgnoreJSDoc = node => {
  return node?._jsdoc?.some(doc => doc?.tags?.some(tag => tag?.tag === 'ignore' || tag?.tag === 'internal'));
};


/**
 * @example this.__onClick = this.__onClick.bind(this);
 */
export function isBindCall(statement) {
  const expression = statement?.expression;
  if (!expression || expression.type !== 'AssignmentExpression') return false;
  
  const left = expression.left;
  const right = expression.right;
  
  if (!left || !right) return false;
  
  // left: this.__onClick (MemberExpression with ThisExpression)
  const leftName = left?.property?.name;
  
  // right: this.__onClick.bind(this) (CallExpression -> MemberExpression)
  if (right?.type !== 'CallExpression') return false;
  const rightCallee = right?.callee;
  if (rightCallee?.type !== 'MemberExpression') return false;
  
  const rightName = rightCallee?.object?.property?.name;
  const isBind = rightCallee?.property?.name === 'bind';
  
  if(leftName === undefined || rightName === undefined) return false;
  if(leftName === rightName && isBind) return true;
  
  return false;
}

/**
 * Find a declaration in the source file's top-level statements
 */
export function getDeclarationInFile(nodeOrName, sourceFile) {
  let name = nodeOrName;
  if (typeof nodeOrName !== 'string') {
    name = nodeOrName?.id?.name || nodeOrName?.name;
  }
  if (!name || !sourceFile) return undefined;
  
  const statements = sourceFile?.body ?? [];
  return statements.find(statement => {
    // Variable declarations
    if (statement.type === 'VariableDeclaration') {
      return statement.declarations?.some(decl => decl.id?.name === name);
    }
    // Export wrappers - look inside
    if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
      const decl = statement.declaration;
      if (decl.type === 'VariableDeclaration') {
        return decl.declarations?.some(d => d.id?.name === name);
      }
      return decl.id?.name === name;
    }
    if (statement.type === 'ExportDefaultDeclaration' && statement.declaration) {
      return statement.declaration.id?.name === name;
    }
    // Class/Function declarations
    return statement.id?.name === name;
  });
}
