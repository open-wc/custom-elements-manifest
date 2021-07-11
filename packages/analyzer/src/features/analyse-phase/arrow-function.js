import { hasInitializer } from '../../utils/ast-helpers.js';
import { isMixin } from '../../utils/mixins.js';
import { createArrowFunction } from './creators/createArrowFunction.js';


/**
 * arrowFunctionPlugin
 *
 * handles arrow functions
 */
export function arrowFunctionPlugin() {
  return {
    name: 'CORE - ARROW-FUNCTION',
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.VariableStatement:
          if(!isMixin(node) && hasInitializer(node)) {
            const functionLike = createArrowFunction(node);
            if (functionLike)
              moduleDoc.declarations.push(functionLike);
          }
          break;
      }
    }
  }
}
