# Analyzing dependencies

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
MAYBE I HAVE TO MAKE BEFORE ASYNC, WHICH MEANS I HAVE TO MAKE `CREATE` ASYNC

because I might need to async globby, and async add frameworkplugins

If we do go down this road, we can do something like this:
We should then probably do this for all lifecycle hooks.
Using for/of because execution order is important.

```js
async function withErrorHandling(name, cb) {
  try {
    await cb()
  } catch(e) {
    console.log(e.stack)
  }
}

for (const {name, before} of plugins) {
  await withErrorHandling(name, async () => {
    await before?.();
  });
}
```

✅ instead, take it in steps. First only support scooping up the CEM. If we need to _really_ analyze dependencies, we can always improve and do the breaking changes then

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

```js
import fs from 'fs';
import path from 'path';
// import { globby } from 'globby';

// const compileGlob = (glob, basePath) => {
//   const modulePath = path.join(basePath, glob);
//   const source = fs.readFileSync(modulePath).toString();

//   return ts.createSourceFile(
//     modulePath,
//     source,
//     ts.ScriptTarget.ES2015,
//     true,
//   );
// }

function includeDependencies({dependencies}) {
  if(!dependencies) throw new Error("No dependencies provided for plugin 'include-dependencies'.");

  return {
    name: 'include-dependencies',
    /** 
     * Runs before collect phase 
     * gets an empty manifest (the manifest was only just instantiated), but this lifecycle hook can be used to set stuff up
     * like for example adding third party modules
     */
    before({ts, customElementsManifest, context}) {
      dependencies?.forEach(({name, pathToManifest, analyze}) => {
        if(!name) throw new Error("Dependency must have a `name` property.");

        // if(!!pathToManifest && !!analyze) throw new Error("Dependency cannot have both `pathToManifest` and `analyze`. Either provide a path to it's manifest directly, or analyze the package.");

        /**
         * if only `name` is provided, we try to scoop the CEM up from `${process.cwd()}${path.sep}node_modules${path.sep}${name}{path.sep}package.json`
         *  - from packagejson.customElements
         *  - from packagejson.exports.['./customElements']
         */
        if(!pathToManifest) {
          const rootPath = `${process.cwd()}${path.sep}node_modules${path.sep}${name}${path.sep}`;
          const packageJsonPath = `${root}package.json`;
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
          const customElements = packageJson?.customElements || packageJson?.exports?.['./customElements'];
          
          if(customElements) {
            const manifestPath = path.posix.join(rootPath, customElements);
            try {
              const manifest = JSON.parse(fs.readFileSync(manifestPath).toString());
              customElementsManifest.modules.push(...manifest.modules);
            } catch(e) {
              throw new Error(`Failed to read custom-elements.json for package "${name}" from "${manifestPath}". \n\n${e.stack}`);
            }
          } else {
            // if(!analyze) {
              throw new Error(`Failed to find custom-elements.json in the package.json of package "${name}", consider specifying the path to the package's manifest location directly via the \`pathToManifest\` property.`);
            // }
          }
        }
        
        /**
         * User provided a `pathToManifest`, so we just grab it from there directly
         */
        if(!!pathToManifest) {
          try {
            const manifest = JSON.parse(fs.readFileSync(pathToManifest).toString());
            customElementsManifest.modules.push(...manifest.modules);
          } catch (e) {
            throw new Error(`Could not find custom-elements.json at path: "${pathToManifest}" for package "${packageName}". \n\n${e.stack}`);
          }
        } 

        // // If the first solution is not enough, in the future we can decide to analyze separately here:
        // if(!!analyze) {
        //   const basePath = analyze?.nodeModulesPath 
        //     ? `${analyze?.nodeModulesPath}${path.sep}${name}` 
        //     : `${process.cwd()}${path.sep}node_modules${path.sep}${name}`;
          
        //   const mergedGlobs = [...(analyze.globs || []), ...(analyze.exclude?.map((i) => `!${i}`) || []) ];
        //   const globs = await globby(mergedGlobs, { cwd: basePath });
  
        //   const modules = globs.map(g => compileGlob(g, basePath));
  
        //   let plugins = await addFrameworkPlugins(packageConfig);
        //   plugins = [...plugins, ...(packageConfig?.plugins || [])];

        //   const cem = create({
        //     plugins,
        //     modules,
        //     dev: context.dev
        //   });
        //   customElementsManifest.modules.push(...cem.modules);
        // }
      });
    },
    packageLinkPhase({customElementsManifest, context}) {
      /** 
       * @TODO
       * Remove node_modules stuff from the manifest
       */
    }
  }
}

export default {
  globs: [],
  plugins: [
    includeDependencies({
      dependencies: [
        {
          // scoop up from `${process.cwd()}${path.sep}node_modules${path.sep}${name}{path.sep}package.json`
          name: 'ing-web/button',
        },
        {
          name: 'vaadin/card',
          // relative to process.cwd()
          pathToManifest: 'node_modules/vaadin/card/dist/custom-elements.json',
          // or in monorepos:
          // pathToManifest: '../../node_modules/vaadin/card/custom-elements.json',
        },
        // If we implement analyzing:
        // {
        //   name: 'foo',
        //   analyze: {
        //     globs: [],
        //     exclude: [],
        //     litelement: true,
        //     // in case your node_modules are not in process.cwd() (like for example in a monorepo)
        //     // we expect the relative path to node_modules, includes the text `node_modules`
        //     nodeModulesPath: '../../node_modules',
        //   }
        // }
      ]
    })
  ]
}
```

```js
// just documenting where to implement the lifecycle
export function create({modules, plugins = [], dev = false}) {
  const customElementsManifest = {
    schemaVersion: '1.0.0',
    readme: '',
    modules: [],
  };

  const mergedPlugins = [
    ...FEATURES,
    ...plugins,
  ];

  const context = { dev };

  if(dev) console.log('[BEFORE]');
  mergedPlugins.forEach(({name, before}) => {
    withErrorHandling(name, () => {
      before?.({ts, customElementsManifest, context});
    });
  });

  modules.forEach(currModule => {
    if(dev) console.log('[ANALYZE PHASE]: ', currModule.fileName);
  // etc
```

## Plugin

It _could_ potentially be a plugin:

```js
export default {
  globs: [],
  plugins: [
    includeDependencies([
      {
        // if only `name` is provided, we try to scoop the CEM up from process.cwd()+node_modules+name/package.json:
        //  - from packagejson.customElements
        //  - from packagejson.exports.['./customElements']
        name: 'ing-web/button', 
        // if pathToManifest is provided, we just scoop it up from there instead
        pathToManifest: '../../node_modules/ing-web/button/dist/custom-elements.json'
      }
    ])
  ]
}
```

```js
const mergedPlugins = [
  // default features
  ...FEATURES,
  // user plugins
  ...plugins,
  // inheritance
  inheritancePlugin()
];
```

Maybe this is tricky because what if people want to execute logic _after_ inheritance is applied? Might need a new lifecycle method "after" or something like that

### PROS:

- Only bother with finding `custom-elements.json`, instead of analyzing a third party package
- 

### CONS:

- Makes plugin lifecycle a bit messy
- Requires dependencies to ship a `custom-elements.json`
  - also a pro because maybe that increases adoption? lolol

## Config options

Similar to the plugin option, but:
```js
export default {
  globs: [],
  dependencies: [
    {
      name: 'ing-web/button',
      // etc
    }
  ]
}
```

```js
const mergedPlugins = [
  // default features
  ...FEATURES,
  // maybe can even go earlier?
  addThirdPartyDependencies(dependencies),
  // user plugins
  ...plugins,
  // inheritance
  inheritancePlugin()
];
```

### PROS:
- would not mess up current lifecycle stuff
- doesnt break anything for current users
  - purely additive feature
- can always do this, if users _still_ want to analyze dependencies, can always take it a step further later

### CONS
- 