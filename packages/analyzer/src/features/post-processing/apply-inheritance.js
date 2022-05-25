import { getModuleForClassLike, getModuleFromManifest } from '../../utils/manifest-helpers.js';
import { has, resolveModuleOrPackageSpecifier } from '../../utils/index.js';


/**
 * APPLY-INHERITANCE-PLUGIN
 * 
 * Applies inheritance for all classes in the manifest
 */
export function applyInheritancePlugin() {
  return {
    name: 'CORE - APPLY-INHERITANCE',
    packageLinkPhase({customElementsManifest, context}) {

      const classLikes = [];
      const packageMap = new Map();

      /**
       * Create a package map of the project for easy resolving of symbols
       */
      customElementsManifest?.modules?.forEach(mod => {
        const declarations = new Map();

        mod.declarations.forEach(declaration => {
          declarations.set(declaration.name, declaration);
          
          if(declaration.kind === 'mixin' || declaration.kind === 'class') {
            classLikes.push(declaration);
          }
        });

        packageMap.set(mod.path, declarations);
      });

      const getReference = (mod, name) => {
        for (const extension of ['', '.js', '.ts', '.tsx']) {
          let r = packageMap.get(mod + extension)?.get(name);
          if(r) return r;
        }

        return null;
      }

      const createMixinHandler = tree => mixin => {
        let foundMixin = getReference(mixin.module, mixin.name);
        if (foundMixin) {
          // @TODO
          // foundMixin.import = mixin.module;
          tree.push(foundMixin);
          
          while(has(foundMixin?.mixins)) {
            foundMixin?.mixins?.forEach(mixin => {
              foundMixin = getReference(mixin.module, mixin.name);
              if(foundMixin) {
                // @TODO
                // foundMixin.import = mixin.module;
                tree.push(foundMixin);
              }
            });
          }
        }
      }
      
      function getInheritanceTree(customElement) {
        let currentClass = customElement;
        const tree = [];
        const mixinHandler = createMixinHandler(tree);

        tree.push(currentClass);
        currentClass?.mixins?.forEach(mixinHandler);

        while(
          /** There is a superclass */
          currentClass?.superclass 
          /** The superclass is imported from a third party package or module */
          // @TODO should we really add it to the tree if its from a third party?
          && (currentClass.superclass.package ?? currentClass.superclass.module)
        ) {
          const specifier = currentClass.superclass.package ?? currentClass.superclass.module;
          const superclass = getReference(specifier, currentClass.superclass.name);

          superclass?.mixins?.forEach(mixinHandler);

          tree.push(superclass);
          currentClass = superclass;
        }

        return tree;
      }
      
      classLikes.forEach((customElement) => {
        const inheritanceChain = getInheritanceTree(customElement);

        inheritanceChain?.forEach(klass => {
          console.log(1, klass);
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
