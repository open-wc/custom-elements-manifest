import { getAllDeclarationsOfKind, getModuleForClassLike, getModuleFromManifest, getInheritanceTree, getModuleForInterface } from '../../utils/manifest-helpers.js';
import { has, resolveModuleOrPackageSpecifier } from '../../utils/index.js';

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
      const interfaces = getAllDeclarationsOfKind(customElementsManifest, 'interface');

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

      interfaces?.forEach(int => {
        const tree = getInterfaceInheritanceChain(customElementsManifest, int.name)
        tree.forEach(supertype => {
          /** Ignore the current interface itself */
          if(int.name === supertype.name) return;

          supertype?.members?.forEach(member => {
            const containingModulePath = getModuleForInterface(customElementsManifest, supertype.name);
            const containingModule = getModuleFromManifest(customElementsManifest, containingModulePath);

            const newItem = {...member};
            const existing = int?.members?.find(item => newItem.name === item.name);

            if (existing) {
              existing.inheritedFrom = {
                name: supertype.name,
                ...resolveModuleOrPackageSpecifier(containingModule, context, supertype.name)
              }
            } else {
              newItem.inheritedFrom = {
                name: supertype.name,
                ...resolveModuleOrPackageSpecifier(containingModule, context, supertype.name)
              }
              int.members = [...(int.members || []), newItem];
            }
          });
        });
      });
    } 
  }
}


function getInterfaceInheritanceChain(customElementsManifest, name) {  
  const tree = [];
  const interfacesMap = new Map();
  const interfaces = getAllDeclarationsOfKind(customElementsManifest, 'interface');
  interfaces.forEach(int => {
    interfacesMap.set(int.name, int);
  });

  let currentInterface = interfacesMap.get(name);

  if(currentInterface) {
    tree.push(currentInterface);

    currentInterface?.supertypes?.forEach(supertype => {
      let foundSupertype = interfacesMap.get(supertype.name);

      if(foundSupertype) {
        tree.push(foundSupertype)
        while(has(foundSupertype?.supertypes)) {
          foundSupertype.supertypes.forEach(supertype => {
            foundSupertype = interfacesMap.get(supertype.name);
            if(foundSupertype) {
              tree.push(foundSupertype);
            }
          })
        }
      }
    });
  }

  return tree;
}