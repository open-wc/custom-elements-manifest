import { getDeclarationInFile, hasIgnoreJSDoc, isCustomElementsDefineCall } from '../../utils/ast-helpers.js';
import { resolveModuleOrPackageSpecifier } from '../../utils/index.js';
import { createClass } from './creators/createClass.js';

/**
 * CUSTOM-ELEMENTS-DEFINE-CALLS
 * 
 * Analyzes calls for:
 * @example customElements.define()
 * @example window.customElements.define()
 */
export function customElementsDefineCallsPlugin() {
  let counter;
  return {
    name: 'CORE - CUSTOM-ELEMENTS-DEFINE-CALLS',
    analyzePhase({node, moduleDoc, context}){    
      if(node?.type === 'Program') {
        counter = 0;
      }

      if (hasIgnoreJSDoc(node))
        return;

      /** 
       * @example customElements.define('my-el', MyEl); 
       * @example window.customElements.define('my-el', MyEl);
       */
      if(isCustomElementsDefineCall(node)) {
        const classArg = node.arguments[1];
        let isAnonymousClass = classArg?.type === 'ClassExpression';
        let isUnnamed = classArg?.id === undefined || classArg?.id === null;

        if(isAnonymousClass) {
          const klass = createClass(classArg, moduleDoc, context);

          if(isUnnamed) {
            klass.name = `anonymous_${counter}`;
          }
          moduleDoc.declarations.push(klass);
        }

        let elementClass;

        /** 
         * @example customElements.define('m-e', class extends HTMLElement{}) 
         *                                            ^
         */
        if(isAnonymousClass && isUnnamed) {
          elementClass = `anonymous_${counter}`;
          counter = counter + 1;
        }

        /** 
         * @example customElements.define('m-e', MyElement) 
         *                                       ^^^^^^^^^
         */
        if(classArg?.type === 'Identifier') {
          elementClass = classArg.name;
        }

        /** 
         * @example customElements.define('m-e', class MyElement extends HTMLElement{}) 
         *                                             ^^^^^^^^^
         */
        if(classArg?.id?.name) {
          elementClass = classArg.id.name;
        }

        const elementTag = node.arguments[0]?.value;

        const sourceFile = node._program;
        const klass = getDeclarationInFile(elementClass, sourceFile);

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

