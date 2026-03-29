import { extractMixinNodes, isMixin } from '../../utils/mixins.js';
import { createMixin } from './creators/createMixin.js';

/**
 * mixinPlugin
 * 
 * handles mixins
 */
export function mixinPlugin() {
  return {
    name: 'CORE - MIXINS',
    analyzePhase({node, moduleDoc, context}){
      if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') {
        if(isMixin(node)) {
          const { mixinFunction, mixinClass } = extractMixinNodes(node);
          let mixin = createMixin(mixinFunction, mixinClass, moduleDoc, context);
          moduleDoc.declarations.push(mixin);
        }
      }
    }
  }
}

