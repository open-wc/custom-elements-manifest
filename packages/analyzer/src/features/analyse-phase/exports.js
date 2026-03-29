import {
  getDeclarationInFile,
  hasIgnoreJSDoc,
} from "../../utils/ast-helpers.js";
import { isBareModuleSpecifier, url } from "../../utils/index.js";

/**
 * EXPORTS
 *
 * In ESTree, exports are represented as:
 * - ExportNamedDeclaration (with declaration or with specifiers)
 * - ExportDefaultDeclaration
 * - ExportAllDeclaration
 */
export function exportsPlugin() {
  return {
    name: "CORE - EXPORTS",
    analyzePhase({ node, moduleDoc }) {
      if (hasIgnoreJSDoc(node)) return;

      /**
       * @example export const foo = '';
       * @example export function foo() {}
       * @example export class Foo {}
       */
      if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        const decl = node.declaration;
        
        if (decl.type === 'VariableDeclaration') {
          decl.declarations?.forEach((declaration) => {
            const _export = {
              kind: "js",
              name: declaration.id?.name || '',
              declaration: {
                name: declaration.id?.name || '',
                module: moduleDoc.path,
              },
            };
            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          });
        } else if (decl.type === 'FunctionDeclaration') {
          const _export = {
            kind: "js",
            name: decl.id?.name || '',
            declaration: {
              name: decl.id?.name || '',
              module: moduleDoc.path,
            },
          };
          moduleDoc.exports = [...(moduleDoc.exports || []), _export];
        } else if (decl.type === 'ClassDeclaration') {
          const _export = {
            kind: "js",
            name: decl.id?.name || '',
            declaration: {
              name: decl.id?.name || '',
              module: moduleDoc.path,
            },
          };
          moduleDoc.exports = [...(moduleDoc.exports || []), _export];
        }
      }

      /**
       * @example export default MyEl;
       * @example export default class MyEl {}
       */
      if (node.type === 'ExportDefaultDeclaration') {
        const decl = node.declaration;
        const _export = {
          kind: "js",
          name: "default",
          declaration: {
            name: decl?.id?.name || decl?.name || '',
            module: moduleDoc.path,
          },
        };
        moduleDoc.exports = [...(moduleDoc.exports || []), _export];
      }

      /**
       * @example export { var1, var2 };
       * @example export { var1, var2 } from 'foo';
       */
      if (node.type === 'ExportNamedDeclaration' && !node.declaration) {
        const hasSource = !!node.source;
        const hasSpecifiers = node.specifiers?.length > 0;

        if (hasSpecifiers && !hasSource) {
          /** @example export { var1, var2 }; */
          node.specifiers.forEach((specifier) => {
            const sourceFile = node._program;
            if (
              hasIgnoreJSDoc(specifier) ||
              hasIgnoreJSDoc(
                getDeclarationInFile(specifier.local?.name, sourceFile)
              )
            )
              return;

            const _export = {
              kind: "js",
              name: specifier.exported?.name || '',
              declaration: {
                name: specifier.local?.name || specifier.exported?.name || '',
                module: moduleDoc.path,
              },
            };
            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          });
        }

        if (hasSpecifiers && hasSource) {
          /** @example export { var1, var2 } from 'foo'; */
          node.specifiers.forEach((specifier) => {
            const _export = {
              kind: "js",
              name: specifier.exported?.name || '',
              declaration: {
                name: specifier.local?.name || specifier.exported?.name || '',
              },
            };

            const sourcePath = node.source.value;
            if (isBareModuleSpecifier(sourcePath)) {
              _export.declaration.package = sourcePath;
            } else {
              _export.declaration.module = sourcePath;
            }

            moduleDoc.exports = [...(moduleDoc.exports || []), _export];
          });
        }
      }

      /**
       * @example export * from 'foo';
       * @example export * from './my-module.js';
       * @example export * as foo from 'foo';
       * @example export * as foo from './my-module.js';
       */
      if (node.type === 'ExportAllDeclaration') {
        const specifier = node.source?.value || '';
        const isBare = isBareModuleSpecifier(specifier);
        const _export = {
          kind: "js",
          name: "*",
          declaration: {
            name: node?.exported?.name ?? "*",
            ...(isBare
              ? { package: specifier }
              : {
                  module: new URL(
                    specifier,
                    `file:///${moduleDoc.path}`
                  ).pathname.replace(/^\/+/, ""),
                }),
          },
        };
        moduleDoc.exports = [...(moduleDoc.exports || []), _export];
      }
    },
  };
}
