import { isMixin } from '../../utils/mixins.js';
import { has, getNodeText } from '../../utils/index.js';
import { createClassDeclarationMixin } from './creators/handlers.js';

/**
 * REEXPORTED WRAPPED MIXIN EXPORTS
 */
export function reexportedWrappedMixinExportsPlugin() {
  return {
    name: 'CORE - REEXPORTED-WRAPPED-MIXINS',
    analyzePhase({node, moduleDoc, context}){
      if (node.type === 'VariableDeclaration') {
        if(!isMixin(node)) {
          node?.declarations?.forEach(declaration => {

            const mixins = [];
            if(declaration?.init?.type === 'CallExpression') {
              const moduleMixinDeclarations = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'mixin');

              if(has(moduleMixinDeclarations)){
                const mixinName = declaration?.init?.callee?.name || getNodeText(declaration?.init?.callee, node._sourceText);
                mixins.push(mixinName);

                let callNode = declaration?.init?.arguments[0];
                
                while(callNode && callNode.type === 'CallExpression') {
                  const mixinName = callNode.callee?.name || getNodeText(callNode.callee, node._sourceText);
                  mixins.push(mixinName);
                  callNode = callNode?.arguments[0];
                }

                const argName = callNode?.name || getNodeText(callNode, node._sourceText);
                const foundMixin = moduleMixinDeclarations?.find(mixin => mixin.name === argName);
                if(foundMixin) {
                  foundMixin.name = declaration?.id?.name;
    
                  mixins?.forEach(mixin => {
                    const newMixin = createClassDeclarationMixin(mixin, moduleDoc, context);
                    foundMixin.mixins = [...(foundMixin?.mixins || []), newMixin];
                  });

                  moduleDoc.declarations = moduleDoc?.declarations?.filter(declaration => !(declaration.kind === 'variable' && declaration.name === foundMixin.name));
                }
              }
            }
          });
        }
      }
    }
  }
}