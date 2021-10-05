/**
 * REMOVE-NODE-MODULES
 * 
 * Removes any modules from `node_modules`
 */
export function removeNodeModulesPlugin() {
  return {
    name: 'CORE - REMOVE-NODE-MODULES',
    packageLinkPhase({customElementsManifest}){
      customElementsManifest.modules = customElementsManifest?.modules?.filter(mod => {
        return !mod?.path?.includes('node_modules');
      });
    },
  }
}