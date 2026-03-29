import { getReturnValue } from '../utils/ast-helpers.js';
import { getNodeText } from '../utils/index.js';

export const isMixin = node => !!extractMixinNodes(node);

export function extractMixinNodes(node) {
  if (node?.type === 'VariableDeclaration' || node?.type === 'FunctionDeclaration') {
    if (node.type === 'VariableDeclaration') {
      /**
       * @example const MyMixin = klass => class MyMixin extends klass {}
       * @example export const MyMixin = klass => class MyMixin extends klass {}
       */
      const variableDeclarator = node.declarations?.find(decl =>
        decl.type === 'VariableDeclarator',
      );
      if (variableDeclarator) {
        const body = variableDeclarator?.init?.body;
        if (body && body.type === 'ClassExpression') {
          return { 
            mixinFunction: node,
            mixinClass: body,
          };
        }

        /**
         * @example const MyMixin = klass => { return class MyMixin extends Klass{} }
         */
        if (body && body.type === 'BlockStatement') {
          const returnStatement = body.body.find(statement => statement.type === 'ReturnStatement');

          if (returnStatement && returnStatement?.argument?.type === 'ClassExpression') {
            return { 
              mixinFunction: variableDeclarator.init,
              mixinClass: returnStatement.argument
            };
          }
        }

        /**
         * @example const MyMixin = klass => { class MyMixin extends klass {} return MyMixin;}
         */
        if (body && body.type === 'BlockStatement') {
          const classDeclaration = body.body.find(statement => statement.type === 'ClassDeclaration');
          const returnStatement = body.body.find(statement => statement.type === 'ReturnStatement');
          /** Avoid undefined === undefined */
          if(!(classDeclaration && returnStatement))
            return;
          const classDeclarationName = classDeclaration.id?.name;
          const returnValue = getReturnValue(returnStatement, node._sourceText)
          /**
           * If the classDeclaration inside the function body has the same name as whats being
           * returned from the function, consider it a mixin
           */
          if (classDeclarationName === returnValue) {
            return {
              mixinFunction: node,
              mixinClass: classDeclaration
            }
          }
        }
      }
    }

    /**
     *  @example function MyMixin(klass) { return class MyMixin extends Klass{} }
     */
    if (node.type === 'FunctionDeclaration') {
      if (node.body && node.body.type === 'BlockStatement') {

        const returnStatement = node.body.body.find(statement => statement.type === 'ReturnStatement');

        if (returnStatement?.argument && returnStatement.argument.type === 'ClassExpression') {
          return { 
            mixinFunction: node, 
            mixinClass: returnStatement.argument
          };
        }
      }
    }

    /**
     * @example function MyMixin(klass) {class A extends klass {} return A;}
     */
    if (node.type === 'FunctionDeclaration') {
      if (node.body && node.body.type === 'BlockStatement') {
        const classDeclaration = node.body.body.find(statement => statement.type === 'ClassDeclaration');
        const returnStatement = node.body.body.find(statement => statement.type === 'ReturnStatement');

        /** Avoid undefined === undefined */
        if(!(classDeclaration && returnStatement))
          return;

        const classDeclarationName = classDeclaration.id?.name;

        const returnValue = getReturnValue(returnStatement, node._sourceText)

        /**
         * If the classDeclaration inside the function body has the same name as whats being
         * returned from the function, consider it a mixin
         */
        if (classDeclarationName === returnValue) {
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
