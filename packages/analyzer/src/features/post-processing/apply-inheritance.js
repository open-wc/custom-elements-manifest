import { getAllDeclarationsOfKind, getModuleForClassLike, getModuleFromManifests, getInheritanceTree } from '../../utils/manifest-helpers.js';
import { resolveModuleOrPackageSpecifier } from '../../utils/index.js';

/**
 * @typedef {import('custom-elements-manifest/schema').Package} CemPackage
 * @typedef {import('custom-elements-manifest/schema').ClassDeclaration} CemClassDeclaration
 * @typedef {import('custom-elements-manifest/schema').MixinDeclaration} CemMixinDeclaration
 */

/**
 * APPLY-INHERITANCE-PLUGIN
 *
 * Applies inheritance for all classes in the manifest
 */
export function applyInheritancePlugin() {
  const mapOfImportsPerFile = {};
  return {
    name: 'CORE - APPLY-INHERITANCE',
    moduleLinkPhase({moduleDoc, context}) {
      // console.log(moduleDoc.path)
      // mapOfImportsPerFile[moduleDoc.path] = context.imports;
      // then in packageLink in the `resolveModuleOrPackageSpecifier` fn,
      // I can pass the correct imports, so the output will become:
      // inheritedFrom: { module: 'bare-module' } (pseudocode)
    },
    packageLinkPhase({customElementsManifest, context}){
      const allManifests = [customElementsManifest, ...(context.thirdPartyCEMs || [])];
      /** @type {(CemClassDeclaration|CemMixinDeclaration)[]} */
      const classLikes = [];

      allManifests.forEach((manifest) => {
        const classes = /** @type {CemClassDeclaration[]} */ (
          getAllDeclarationsOfKind(manifest, 'class')
        );
        const mixins = /** @type {CemMixinDeclaration[]} */ (
          getAllDeclarationsOfKind(manifest, 'mixin')
        );
        classLikes.push(...[...classes, ...mixins]);
      });
      classLikes.forEach((customElement) => {
        const inheritanceChain = getInheritanceTree(customElementsManifest, customElement.name);

        inheritanceChain?.forEach(klass => {

          // ignore the current class itself
          if (klass?.name === customElement.name) {
            return;
          }

          ['attributes', 'members', 'events'].forEach(type => {
            klass?.[type]?.forEach(currItem => {
              const containingModulePath = getModuleForClassLike(allManifests, klass.name);
              const containingModule = getModuleFromManifests(allManifests, containingModulePath);

              const newItem = { ...currItem };

              /**
                * If an attr or member is already present in the base class, but we encounter it here,
                * it means that the base has overridden that method from the super class
                * So we either add the data to the overridden method, or we add it to the array as a new item
                */
              const existing = customElement?.[type]?.find(item => newItem.name === item.name);

              if (existing) {

                existing.inheritedFrom = {
                  name: klass.name,
                  ...resolveModuleOrPackageSpecifier(containingModule, context, klass.name)
                }

                customElement[type] = customElement?.[type]?.map(item => item.name === existing.name
                  ? {
                      ...newItem,
                      ...existing,
                      ...{
                        ...(newItem.type ? { type: newItem.type } : {}),
                        ...(newItem.privacy ? { privacy: newItem.privacy } : {})
                      }
                    }
                  : item);
              } else {
                newItem.inheritedFrom = {
                  name: klass.name,
                  ...resolveModuleOrPackageSpecifier(containingModule, context, klass.name)
                }

                customElement[type] = [...(customElement[type] || []), newItem];
              };
            });
          });
        });
      });
    }
  }
}
