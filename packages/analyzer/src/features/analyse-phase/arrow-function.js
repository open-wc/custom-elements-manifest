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
    analyzePhase({node, moduleDoc}){
      if (node.type === 'VariableDeclaration') {
        if(!isMixin(node) && hasInitializer(node)) {
          const functionLike = createArrowFunction(node);
          moduleDoc.declarations.push(functionLike);
        }
      }
    }
  }
}

