import type {
  AccessorDeclaration,
  Decorator,
  ArrayLiteralExpression,
  CallExpression,
  FalseKeyword,
  Node,
  NullKeyword,
  NumericLiteral,
  PropertyDeclaration,
  ReturnStatement,
  SourceFile,
  StringLiteral,
  TrueKeyword,
  VariableStatement,
} from 'typescript';

export declare function hasIgnoreJSDoc(node: Node): boolean;
export declare function getDeclarationInFile<T extends Node = Node>(name: string, source: SourceFile): T;

/**
 * AST HELPERS
 */

export declare function isProperty(node: Node): node is PropertyDeclaration|AccessorDeclaration;

/**
 * @example this.dispatchEvent(new Event('foo'));
 */
export declare function isDispatchEvent(node: Node): boolean;
export declare function isReturnStatement(node: Node): node is ReturnStatement;

/**
 * @example customElements.define('my-el', MyEl);
 * @example window.customElements.define('my-el', MyEl);
 */
export declare function isCustomElementsDefineCall(node: Node): node is CallExpression;

/**
 * @example @attr
 */
export declare function hasAttrAnnotation(node: PropertyDeclaration|AccessorDeclaration): boolean;


/**
 * Whether or not node is:
 * - Number
 * - String
 * - Boolean
 * - Null
 */
export declare function isPrimitive(node?: Node): node is NumericLiteral|StringLiteral|NullKeyword|TrueKeyword|FalseKeyword|ArrayLiteralExpression;

/**
 * Checks if a VariableStatement has an initializer
 * @example `let foo;` will return false
 * @example `let foo = '';` will return true
 */
export declare function hasInitializer(node: VariableStatement): boolean;

export declare function getElementNameFromDecorator(decorator: Decorator): string;


/**
 * Gets the name of an attr from a decorators callExpression
 * @example @attr({attribute: 'my-el'})
 */
export declare function getOptionsObject(decorator: Decorator): ObjectLiteralExpression;

/**
 * Get the return value expression of a return statement, omitting the type assertion
 */
export declare function getReturnValue(returnStatement: ReturnStatement): string;

/**
 * Is this class member a static member?
 */
export declare function isStaticMember(member: ClassDeclaration['members'][number]): boolean;

/**
 * Does the name have an initializer with `as const`?
 */
export declare function isWellKnownType(node: Node): boolean;

/**
 * Whether or not a node has an `@ignore` jsdoc annotation
 */
export declare function hasIgnoreJSDoc(node: Node): boolean;

/**
 * @example this.__onClick = this.__onClick.bind(this);
 */
export declare function isBindCall(statement: Node): boolean;

/**
 * Does the variable have an `@ignore` or `@internal` JSDoc tag?
 */
export declare function getDeclarationInFile(nodeOrName: Node|string, sourceFile: SourceFile): Node;
