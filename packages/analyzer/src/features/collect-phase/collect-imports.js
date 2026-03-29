import {
  hasDefaultImport,
  hasNamedImport,
  hasAggregatingImport,
  hasSideEffectImport,
} from '../../utils/imports.js';
import { isBareModuleSpecifier } from '../../utils/index.js';

/**
 * COLLECT-IMPORTS
 * 
 * Collects a modules imports so that declarations can later be resolved to their module/package.
 */
export function collectImportsPlugin() {
  const files = {};
  let currModuleImports;

  return {
    name: 'CORE - IMPORTS',
    collectPhase({node, context}) {
      if(node.type === 'Program') {
        /**
         * Create an empty array for each module we visit
         */
        const fileName = context._currentFileName || '';
        files[fileName] = [];
        currModuleImports = files[fileName];
      }

      /** 
       * @example import defaultExport from 'foo'; 
       */
      if (hasDefaultImport(node)) {
        const defaultSpec = node.specifiers.find(s => s.type === 'ImportDefaultSpecifier');
        const importTemplate = {
          name: defaultSpec.local.name,
          kind: 'default',
          importPath: node.source.value,
          isBareModuleSpecifier: isBareModuleSpecifier(node.source.value),
          isTypeOnly: !!node?.importKind && node.importKind === 'type'
        };
        currModuleImports.push(importTemplate);
      }

      /**
       * @example import { export1, export2 } from 'foo';
       * @example import { export1 as alias1 } from 'foo';
       * @example import { export1, export2 as alias2 } from 'foo';
       */
      if (hasNamedImport(node)) {
        node.specifiers
          .filter(s => s.type === 'ImportSpecifier')
          .forEach((element) => {
            const importTemplate = {
              name: element.local.name,
              kind: 'named',
              importPath: node.source.value,
              isBareModuleSpecifier: isBareModuleSpecifier(node.source.value),
              isTypeOnly: !!node?.importKind && node.importKind === 'type'
            };
            currModuleImports.push(importTemplate);
          });
      }

      /**
       * @example import * as name from './my-module.js'; 
       */
      if (hasAggregatingImport(node)) {
        const nsSpec = node.specifiers.find(s => s.type === 'ImportNamespaceSpecifier');
        const importTemplate = {
          name: nsSpec.local.name,
          kind: 'aggregate',
          importPath: node.source.value,
          isBareModuleSpecifier: isBareModuleSpecifier(node.source.value),
          isTypeOnly: !!node?.importKind && node.importKind === 'type'
        };
        currModuleImports.push(importTemplate);
      }

      /**
       * @example import './my-module.js';
       */
      if(hasSideEffectImport(node)) {
        const importTemplate = {
          kind: 'side-effect',
          importPath: node.source.value,
          isBareModuleSpecifier: isBareModuleSpecifier(node.source.value),
          isTypeOnly: false
        };
        currModuleImports.push(importTemplate);
      }
    },
    analyzePhase({node, context}) {
      if(node.type === 'Program') {
        const fileName = context._currentFileName || '';
        /** Makes the imports available on the context object for a given module */
        context.imports = files[fileName];
      }
    },
    packageLinkPhase({context}) {
      /** Reset */
      context.imports = [];
    }
  }
}

