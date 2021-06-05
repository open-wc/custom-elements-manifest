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
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.VariableStatement:
          if(!isMixin(node) && hasInitializer(node)) {
            const functionLike = createArrowFunction(node);
            moduleDoc.declarations.push(functionLike);
          }
          break;
      }
    }
  }
}

