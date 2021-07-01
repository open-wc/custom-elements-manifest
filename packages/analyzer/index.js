#!/usr/bin/env node

import ts from 'typescript';
import path from 'path';
import globby from 'globby';
import fs from 'fs';
import commandLineArgs from 'command-line-args';
import chokidar from 'chokidar';
import debounce from 'debounce';

import { create } from './src/create.js';
import { 
  getUserConfig, 
  getCliConfig, 
  addFrameworkPlugins, 
  addCustomElementsPropertyToPackageJson,
  mergeGlobsAndExcludes,
  timestamp,
  DEFAULTS,
  MENU
} from './src/utils/cli.js';

(async () => {
  const mainDefinitions = [{ name: 'command', defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];
  
  if (mainOptions.command === 'analyze') {

    const cliConfig = getCliConfig(argv)
    const userConfig = await getUserConfig();

    /**
     * Merged config options
     * Command line options override userConfig options
     */
    const mergedOptions = { ...DEFAULTS, ...userConfig, ...cliConfig };
    const merged = mergeGlobsAndExcludes(DEFAULTS, userConfig, cliConfig);
    const globs = await globby(merged);

    async function run() {
      /**
       * Create modules for `create()`
       * 
       * By default, the analyzer doesn't actually compile a users source code with the TS compiler
       * API. This means that by default, the typeChecker is not available in plugins.
       * 
       * If users want to use the typeChecker, they can do so by adding a `overrideModuleCreation` property
       * in their custom-elements-manifest.config.js. `overrideModuleCreation` is a function that should return
       * an array of sourceFiles.
       */
      const modules = userConfig?.overrideModuleCreation 
        ? userConfig.overrideModuleCreation({ts, globs})
        : globs.map(glob => {
            const relativeModulePath = path.relative(process.cwd(), glob);
            const source = fs.readFileSync(relativeModulePath).toString();
  
            return ts.createSourceFile(
              relativeModulePath,
              source,
              ts.ScriptTarget.ES2015,
              true,
            );
          });
  
      let plugins = await addFrameworkPlugins(mergedOptions);
      plugins = [...plugins, ...(userConfig?.plugins || [])];
  
      /**
       * Create the manifest
       */
      const customElementsManifest = create({
        modules,
        plugins,
        dev: mergedOptions.dev
      });

      const outdir = path.join(process.cwd(), mergedOptions.outdir);
      if (!fs.existsSync(outdir)){
        fs.mkdirSync(outdir, { recursive: true });
      }
      fs.writeFileSync(path.join(outdir, 'custom-elements.json'), `${JSON.stringify(customElementsManifest, null, 2)}\n`);
      if(mergedOptions.dev) {
        console.log(JSON.stringify(customElementsManifest, null, 2));
      }

      console.log(`[${timestamp()}] @custom-elements-manifest/analyzer: Created new manifest.`);
    }
    await run();

    /**
     * Watch mode
     */
    if(mergedOptions.watch) {
      const fileWatcher = chokidar.watch(globs);
  
      const onChange = debounce(run, 100);
  
      fileWatcher.addListener('change', onChange);
      fileWatcher.addListener('unlink', onChange);
    }

    try {
      addCustomElementsPropertyToPackageJson(mergedOptions.outdir);
    } catch {
      console.log(`Could not add 'customElements' property to ${process.cwd()}${path.sep}package.json. \nAdding this property helps tooling locate your Custom Elements Manifest. Please consider adding it yourself, or file an issue if you think this is a bug.\nhttps://www.github.com/open-wc/custom-elements-manifest`);
    }
  } else {
    console.log(MENU);
  }
})();