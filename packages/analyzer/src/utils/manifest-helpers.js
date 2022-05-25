/**
 * UTILITIES RELATED TO GETTING INFORMATION OUT OF A MANIFEST OR DOC
 */

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
      if((declaration.kind === 'class' || declaration.kind === 'mixin') && declaration.name === className) {
        result = _module.path;
      }
    });
  });

  return result;
}
