import { createVariable } from './creators/createVariable.js';
import { isMixin } from '../../utils/mixins.js';

/**
 * variablePlugin
 * 
 * handles variables
 */
export function variablePlugin() {
  return {
    name: 'CORE - VARIABLES',
    analyzePhase({node, moduleDoc}){
      if (node.type === 'VariableDeclaration') {
        if(!isMixin(node)) {
          node?.declarations?.forEach(declaration => {
            const alreadyExists = moduleDoc?.declarations?.some(_declaration => _declaration.name === declaration?.id?.name);

            if(!alreadyExists) {
              const variable = createVariable(node, declaration);
              moduleDoc.declarations.push(variable);
            }
          });
        }
      }
    }
  }
}