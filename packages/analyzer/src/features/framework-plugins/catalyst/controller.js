import { toKebabCase, resolveModuleOrPackageSpecifier, decorator } from '../../../utils/index.js'

export function controllerPlugin() {
  return {
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          /**
           * handle @controller
           */
          const hasController = node?.decorators?.find(decorator('controller'));

          if(hasController) {
            const className = node?.name?.getText();
            
            const definitionDoc = {
              kind: 'custom-element-definition',
              name: toKebabCase(className).replace('-element', ''),
              declaration: {
                name: className,
                ...resolveModuleOrPackageSpecifier(moduleDoc, className)
              },
            };


            moduleDoc.exports.push(definitionDoc);
          }
          break;
      }
    },
  }
}

