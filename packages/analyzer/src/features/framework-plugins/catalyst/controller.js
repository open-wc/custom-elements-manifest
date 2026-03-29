import { toKebabCase, resolveModuleOrPackageSpecifier, decorator } from '../../../utils/index.js'

export function controllerPlugin() {
  return {
    name: 'CORE - CONTROLLER',
    analyzePhase({node, moduleDoc, context}){
      if (node.type === 'ClassDeclaration') {
        const hasController = node?.decorators?.find(decorator('controller'));

        if(hasController) {
          const className = node?.id?.name;
          
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
      }
    },
  }
}

