import { getReturnValue } from '../utils/ast-helpers.js';

export const isMixin = node => !!extractMixinNodes(node);

export function extractMixinNodes(node) {
  if (node?.kind === 'VariableStatement' || node?.kind === 'FunctionDeclaration') {
    if (node?.kind === 'VariableStatement') {
      /**
       * @example const MyMixin = klass => class MyMixin extends klass {}
       * @example export const MyMixin = klass => class MyMixin extends klass {}
       */
      const variableDeclaration = node.declarationList.declarations.find(declaration =>
        declaration?.kind === 'VariableDeclaration',
      );
      if (variableDeclaration) {
        const body = variableDeclaration?.initializer?.body;
        if (body && body?.kind === 'ClassExpression') {
          return { 
            mixinFunction: node,
            mixinClass: body,
          };
        }

        /**
         * @example const MyMixin = klass => { return class MyMixin extends Klass{} }
         */
        if (body && body?.kind === 'BlockStatement') {
          const returnStatement = body.statements.find(statement => statement?.kind === 'ReturnStatement');

          if (returnStatement && returnStatement?.expression?.kind && returnStatement.expression?.kind === 'ClassExpression') {
            return { 
              mixinFunction: variableDeclaration.initializer,
              mixinClass: returnStatement.expression
            };
          }
        }

        /**
         * @example const MyMixin = klass => { class MyMixin extends klass {} return MyMixin;}
         */
        if (body && body?.kind === 'BlockStatement') {
          const classDeclaration = body.statements.find(statement => statement?.kind === 'ClassDeclaration');
          const returnStatement = body.statements.find(statement => statement?.kind === 'ReturnStatement');
          /** Avoid undefined === undefined */
          if(!(classDeclaration && returnStatement))
            return;
          const classDeclarationName = classDeclaration.name?.getText?.();
          const returnValue = getReturnValue(returnStatement)
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
    if (node?.kind === 'FunctionDeclaration') {
      if (node.body && node.body?.kind === 'BlockStatement') {

        const returnStatement = node.body.statements.find(statement => statement?.kind === 'ReturnStatement');

        if (returnStatement?.expression && returnStatement.expression?.kind === 'ClassExpression') {
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
    if (node?.kind === 'FunctionDeclaration') {
      if (node.body && node.body?.kind === 'BlockStatement') {
        const classDeclaration = node.body.statements.find(statement => statement?.kind === 'ClassDeclaration');
        const returnStatement = node.body.statements.find(statement => statement?.kind === 'ReturnStatement');

        /** Avoid undefined === undefined */
        if(!(classDeclaration && returnStatement))
          return;

        const classDeclarationName = classDeclaration.name?.getText?.();

        const returnValue = getReturnValue(returnStatement)

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
