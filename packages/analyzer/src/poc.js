const has = arr => Array.isArray(arr) && arr.length > 0;
const createOptions = {
  dev: true,
  cemsToMerge: [],
  packages: [
    {
      packageName: '', // 'default' or 'ing-web/button'
      modules: [],
      plugins: []
    }
  ]
}

function create({dev, packages, manifests}) {
  const customElementsManifest = {schemaVersion: '1.0.0', readme: '', modules:[]};
  const context = { dev };
  
  if(dev) console.log('[BEFORE]');
  packages.forEach(({packageName, plugins}) => {
    plugins.forEach(({name, before}) => {
      withErrorHandling(packageName, name, () => {
        before?.({customElementsManifest, context});
      });
    });
  });

  /** If we found a manifest of a `dependency`, we can just add them */
  manifests?.forEach(({modules}) => {
    customElementsManifest.modules.push(...modules);
  });

  packages.reduce((customElementsManifest, {packageName, modules, plugins}) => {
    if(dev) console.log(`  [ANALYZING PACKAGE]: ${packageName}`);
    return analyzePackage({
      packageName,
      customElementsManifest,
      modules,
      plugins,
      context,
    });
  }, customElementsManifest);

  if(dev) console.log('[AFTER]');
  packages.forEach(({packageName, plugins}) => {
    plugins.forEach(({name, after}) => {
      
      // check how context gets used in linkphase pkges
      // context gets used to check for imports?
      withErrorHandling(packageName, name, () => {
        after?.({customElementsManifest, context});
      });
    });
  });

  return customElementsManifest;
}

function analyzePackage({
  packageName,
  customElementsManifest = {},
  modules = [],
  plugins = [],
  context = {}
}) {

}