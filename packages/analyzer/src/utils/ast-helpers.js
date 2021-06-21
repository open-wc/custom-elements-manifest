import ts from 'typescript';
import { safe } from './index.js';

/**
 * AST HELPERS
 */

export const isProperty = node => ts.isPropertyDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node);

/**
 * @example this.dispatchEvent(new Event('foo'));
 */
export const isDispatchEvent = node => node.expression?.name?.getText() === 'dispatchEvent' && node?.expression?.expression?.kind === ts.SyntaxKind.ThisKeyword

export const isReturnStatement = statement => statement?.kind === ts.SyntaxKind.ReturnStatement;

/**
 * @example customElements.define('my-el', MyEl);
 * @example window.customElements.define('my-el', MyEl);
 */
export const isCustomElementsDefineCall = node => (node?.expression?.getText() === 'customElements' || node?.expression?.getText() === 'window.customElements') && node?.name?.getText() === 'define';

/**
 * @example @attr
 */
export function hasAttrAnnotation(member) {
  return member?.jsDoc?.some(jsDoc => jsDoc?.tags?.some(tag => safe(() => tag?.tagName?.getText()) === 'attr'));
}


/** 
 * Whether or not node is:
 * - Number
 * - String
 * - Boolean
 * - Null
 */
export function isPrimitive(node) {
  return node && (ts.isNumericLiteral(node) ||
  ts.isStringLiteral(node) ||
  node?.kind === ts.SyntaxKind.NullKeyword ||
  node?.kind === ts.SyntaxKind.TrueKeyword ||
  node?.kind === ts.SyntaxKind.FalseKeyword)
}

/**
 * Checks if a VariableStatement has an initializer
 * @example `let foo;` will return false
 * @example `let foo = '';` will return true
 */
export function hasInitializer(node) {
  return node?.declarationList?.declarations?.some(declaration => declaration?.initializer);
}

export function getElementNameFromDecorator(decorator) {
  const argument = decorator.expression.arguments[0];

  /**
   * @example @customElement('my-el')
   */
  if(argument.kind === ts.SyntaxKind.StringLiteral) {
    return argument.text;
  }

  /**
   * @example @customElement({
   *   name: 'my-el',
   *   template
   * })
   */
  if(argument.kind === ts.SyntaxKind.ObjectLiteralExpression) {
    let result;
    argument?.properties?.forEach(property => {
      if(property?.name?.getText() === 'name') {
        result = property?.initializer?.text;
      }
    });
    return result;
  }
}


/**
 * Gets the name of an attr from a decorators callExpression
 * @example @attr({attribute: 'my-el'})
 */
export const getOptionsObject = decorator => decorator?.expression?.arguments?.find(arg => arg.kind === ts.SyntaxKind.ObjectLiteralExpression);

/**
 * Get the return value expression of a return statement, omitting the type assertion
 */
export const getReturnValue = returnStatement => (
    returnStatement.expression?.kind === ts.SyntaxKind.AsExpression ? returnStatement.expression.expression.getText()
  : returnStatement.expression?.getText()
);

/**
 * Is this class member a static member?
 */
export const isStaticMember = member =>
  member?.modifiers?.some?.(x => x.kind === ts.SyntaxKind.StaticKeyword);


/**
 * Whether or not a node has an `@ignore` jsdoc annotation
 */
export const hasIgnoreJSDoc = node => node?.jsDoc?.some(doc => doc?.tags?.some(tag => safe(() => tag?.tagName?.getText()) === 'ignore'));
