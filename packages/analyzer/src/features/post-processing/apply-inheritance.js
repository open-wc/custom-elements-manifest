import { getAllDeclarationsOfKind, getModuleForClassLike, getModuleFromManifest, getInheritanceTree } from '../../utils/manifest-helpers.js';
import { resolveModuleOrPackageSpecifier } from '../../utils/index.js';

/**
 * APPLY-INHERITANCE-PLUGIN
 * 
 * Applies inheritance for all classes in the manifest
 */
export function applyInheritancePlugin() {
  return {
    name: 'CORE - APPLY-INHERITANCE',
    packageLinkPhase({customElementsManifest, context}){
      const classes = getAllDeclarationsOfKind(customElementsManifest, 'class');
      const mixins = getAllDeclarationsOfKind(customElementsManifest, 'mixin');

      [...classes, ...mixins].forEach((customElement) => {
        const inheritanceChain = getInheritanceTree(customElementsManifest, customElement.name);

        inheritanceChain?.forEach(klass => {
          // Handle mixins
          if (klass?.kind !== 'class') {
            if (klass?.package) {
              // the mixin comes from a bare module specifier, skip it
              return;
            }
          }

          // ignore the current class itself
          if (klass?.name === customElement.name) {
            return;
          }

          ['attributes', 'members', 'events'].forEach(type => {
            klass?.[type]?.forEach(currItem => {
              const containingModulePath = getModuleForClassLike(customElementsManifest, klass.name);
              const containingModule = getModuleFromManifest(customElementsManifest, containingModulePath);

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
