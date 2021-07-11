import { getDeclarationInFile, hasIgnoreJSDoc, isCustomElementsDefineCall } from '../../utils/ast-helpers.js';
import { resolveModuleOrPackageSpecifier } from '../../utils/index.js';

/**
 * CUSTOM-ELEMENTS-DEFINE-CALLS
 * 
 * Analyzes calls for:
 * @example customElements.define()
 * @example window.customElements.define()
 */
export function customElementsDefineCallsPlugin() {
  return {
    name: 'CORE - CUSTOM-ELEMENTS-DEFINE-CALLS',
    analyzePhase({node, moduleDoc, context}){    
      if (hasIgnoreJSDoc(node))
        return;

      /** 
       * @example customElements.define('my-el', MyEl); 
       * @example window.customElements.define('my-el', MyEl);
       */
      if(isCustomElementsDefineCall(node)) {
        const elementClass = node.parent.arguments[1].text;
        const elementTag = node.parent.arguments[0].text;

        const klass = getDeclarationInFile(elementClass, node.getSourceFile());

        if (hasIgnoreJSDoc(klass))
          return;

        const definitionDoc = {
          kind: 'custom-element-definition',
          name: elementTag,
          declaration: {
            name: elementClass,
            ...resolveModuleOrPackageSpecifier(moduleDoc, context, elementClass)
          },
        };
    
        moduleDoc.exports = [...(moduleDoc.exports || []), definitionDoc];
      }
    }
  }
}

