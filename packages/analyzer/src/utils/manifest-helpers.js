/**
 * UTILITIES RELATED TO GETTING INFORMATION OUT OF A MANIFEST OR DOC
 */

import { has } from "./index.js";


function loopThroughDeclarations(manifest, predicate) {
  manifest?.modules?.forEach(_module => {
    _module?.declarations?.forEach(predicate);
  });
}

function loopThroughExports(manifest, predicate) {
  manifest?.modules?.forEach(_module => {
    _module?.exports?.forEach(predicate);
  });
}

/**
 * Loops through all modules' exports, and returns the kind provided by the users
 * 
 * @example getKind('class');
 * @example getKind('custom-element-definition');
 */
export function getAllExportsOfKind(manifest, kind) {
  const result = [];
  loopThroughExports(manifest, (_export) => {
    if(_export.kind === kind) {
      result.push(_export);
    }
  });
  return result;
}


/**
 * Loops through all modules' declarations, and returns the kind provided by the users
 * 
 * @example getKind('class');
 * @example getKind('custom-element-definition');
 */
export function getAllDeclarationsOfKind(manifest, kind) {
  const result = [];
  loopThroughDeclarations(manifest, (declaration) => {
    if(declaration.kind === kind) {
      result.push(declaration);
    }
  });
  return result;
}

/**
 * Gets the inheritance tree from a manifest given a className
 * Returns an array of a classes mixins/superclasses all the way up the chain
 */
export function getInheritanceTree(cem, className) {
  const tree = [];

  const allClassLikes = new Map();

  const _classes = getAllDeclarationsOfKind(cem, 'custom-element');
  const _mixins = getAllDeclarationsOfKind(cem, 'mixin');
  
  [..._mixins, ..._classes].forEach(klass => {
    allClassLikes.set(klass.name, klass);
  });

  let klass = allClassLikes.get(className)

  if(klass) {
    tree.push(klass)

    klass?.mixins?.forEach(mixin => {
      let foundMixin = _mixins.find(m => m.name === mixin.name);
      if(foundMixin) {
        tree.push(foundMixin);

        while(has(foundMixin?.mixins)) {
          foundMixin?.mixins?.forEach(mixin => {
            foundMixin =  _mixins.find(m => m.name === mixin.name);
            if(foundMixin) {
              tree.push(foundMixin);
            }
          });
        }
      }
    });
    
    while(allClassLikes.has(klass.superclass?.name)) {
      const newKlass = allClassLikes.get(klass.superclass.name);
      
      klass?.mixins?.forEach(mixin => {
        let foundMixin = _mixins.find(m => m.name === mixin.name);
        if(foundMixin) {
          tree.push(foundMixin);
  
          while(has(foundMixin?.mixins)) {
            foundMixin?.mixins?.forEach(mixin => {
              foundMixin =  _mixins.find(m => m.name === mixin.name);
              if(foundMixin) {
                tree.push(foundMixin);
              }
            });
          }
        }
      });

      tree.push(newKlass);
      klass = newKlass;
    }
    return tree;
  } 
  return [];
}

export function getModuleFromManifest(cem, modulePath) {
  let result = undefined;

  cem?.modules?.forEach(_module => {
    if(_module.path === modulePath) {
      result = _module;
    }
  });

  return result;
}

export function getModuleForClassLike(cem, className) {
  let result = undefined;

  cem?.modules?.forEach(_module => {
    _module?.declarations?.forEach(declaration => {
      if((declaration.kind === 'class' || declaration.kind === 'mixin' || declaration.kind === 'custom-element') && declaration.name === className) {
        result = _module.path;
      }
    });
  });
  
  return result;
}

