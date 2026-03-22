import { toKebabCase, resolveModuleOrPackageSpecifier, decorator } from '../../../utils/index.js'

export function controllerPlugin() {
  return {
    name: 'CORE - CONTROLLER',
    analyzePhase({node, moduleDoc, context}){
      switch(node.kind) {
        case 'ClassDeclaration':
          /**
           * handle @controller
           */
          const hasController = node?.modifiers?.find(decorator('controller'));

          if(hasController) {
            const className = node?.name?.getText();
            
            const definitionDoc = {
              kind: 'custom-element-definition',
              name: toKebabCase(className).replace('-element', ''),
              declaration: {
                name: className,
                ...resolveModuleOrPackageSpecifier(moduleDoc, context, className)
              },
            };


            moduleDoc.exports.push(definitionDoc);
          }
          break;
      }
    },
  }
}

