import {
  hasDefaultImport,
  hasNamedImport,
  hasAggregatingImport,
} from '../../utils/imports.js';
import { isBareModuleSpecifier } from '../../utils/index.js';

/**
 * COLLECT-IMPORTS
 * 
 * Collects a modules imports so that declarations can later be resolved to their module/package.
 * 
 * Imports are not specified in the schema, so they will be deleted from the Manifest at a later stage.
 */
export function collectImportsPlugin() {
  const imports = [];

  return {
    analyzePhase({node, moduleDoc}){

      /** 
       * @example import defaultExport from 'foo'; 
       */
      if (hasDefaultImport(node)) {
        const importTemplate = {
          name: node.importClause.name.text,
          kind: 'default',
          importPath: node.moduleSpecifier.text,
          isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
        };
        imports.push(importTemplate);
      }

      /**
       * @example import { export1, export2 } from 'foo';
       * @example import { export1 as alias1 } from 'foo';
       * @example import { export1, export2 as alias2 } from 'foo';
       */
      if (hasNamedImport(node)) {
        node.importClause.namedBindings.elements.forEach((element) => {
          const importTemplate = {
            name: element.name.text,
            kind: 'named',
            importPath: node.moduleSpecifier.text,
            isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
          };
          imports.push(importTemplate);
        });
      }

      /** 
       * @example import * as name from './my-module.js'; 
       */
      if (hasAggregatingImport(node)) {
        const importTemplate = {
          name: node.importClause.namedBindings.name.text,
          kind: 'aggregate',
          importPath: node.moduleSpecifier.text,
          isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
        };
        imports.push(importTemplate);
      }

      moduleDoc.imports = imports;
    },

    packageLinkPhase({customElementsManifest, context}){
      /**
       * Delete `imports` from the moduleDoc, since they are not specced in the schema
       * and we only need them during AST stuff.
       */
      customElementsManifest.modules.forEach(moduleDoc => {
        delete moduleDoc.imports;
      });
    },
  }
}

