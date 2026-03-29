import { createFunctionLike } from './creators/createFunctionLike.js';
import { isMixin } from '../../utils/mixins.js';

/**
 * functionLikePlugin
 * 
 * handles functionLikes such as class methods and functions
 * does NOT handle arrow functions
 */
export function functionLikePlugin() {
  return {
    name: 'CORE - FUNCTION-LIKE',
    analyzePhase({node, moduleDoc}){
      if (node.type === 'FunctionDeclaration') {
        if(!isMixin(node)) {
          const functionLike = createFunctionLike(node);
          moduleDoc.declarations.push(functionLike);
        }
      }
    }
  }
}