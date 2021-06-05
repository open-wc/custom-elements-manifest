/**
 * REMOVE-UNEXPORTED-DECLARATIONS
 * 
 * If a module has declarations that are _not_ exported, that means those declarations are considered 'private' to that module, and they shouldnt be present in the manifest, so we remove them.
 */
export function removeUnexportedDeclarationsPlugin() {
  return {
    moduleLinkPhase({moduleDoc}){
      moduleDoc.declarations = moduleDoc?.declarations?.filter(declaration => {
        return moduleDoc?.exports?.some(_export => {
          return declaration?.name === _export?.name || declaration?.name === _export?.declaration?.name;
        });
      });
    },
  }
}
