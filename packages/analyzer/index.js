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
  addCustomElementsPropertyToPackageJson,
  mergeGlobsAndExcludes,
  createPackage,
  timestamp,
  DEFAULTS,
  MENU,
} from './src/utils/cli.js';

(async () => {
  const mainDefinitions = [{ name: 'command', defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];
  
  if (mainOptions.command === 'analyze') {

    const {
      config: configPath,
      ...cliConfig
    } = getCliConfig(argv);
    const userConfig = await getUserConfig(configPath);

    /**
     * Merged config options
     * Command line options override userConfig options
     */
    const mergedOptions = { ...DEFAULTS, ...userConfig, ...cliConfig };

    async function run() {
      const packages = [];
      const manifests = [];

      const mainPkg = await createPackage(
        'default', 
        userConfig, 
        userConfig?.overrideModuleCreation,
        () => {
          const merged = mergeGlobsAndExcludes(DEFAULTS, userConfig, cliConfig);
          return globby(merged);
        }
      );
      packages.push(mainPkg);
   
      await Promise.all(
        mergedOptions?.dependencies?.map(async ({packageName, pathToCem, analyze}) => {
          /** Validate dependency configuration */
          if(!packageName) throw new Error("Dependency must have a `packageName`.");
          if(!!pathToCem && !!analyze) throw new Error("Dependency cannot have both `pathToCem` and `analyze`. Either provide a path to it's manifest directly, or analyze the package.");

          /** 
           * No `pathToCem` was provided, and user doesn't want to analyze the dependency 
           * so by default we try to find one ourself
           */
          if(!pathToCem && !analyze) {
            const root = `${process.cwd()}${path.sep}node_modules${path.sep}${packageName}${path.sep}`;
            const packageJsonPath = `${root}package.json`;
            let packageJson;
            try {
              packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
            } catch(e) {
              throw new Error(`Failed to read package.json for package "${packageName}" from "${packageJsonPath}". Consider specifying the path to the package's manifest location, or analyzing the package instead. \n\n${e.stack}`)
            }
            const customElements = packageJson?.customElements || packageJson?.exports?.['./customElements'];
            if(customElements) {
              const manifestPath = path.posix.join(root, customElements);
              try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath).toString());
                manifests.push(manifest)
              } catch(e) {
                throw new Error(`Failed to read custom-elements.json for package "${packageName}" from "${manifestPath}". \n\n${e.stack}`);
              }
            } else {
              throw new Error(`Failed to read custom-elements.json for package "${packageName}", consider specifying the path to the package's manifest location, or analyzing the package instead.`);
            }
          }

          /** User provided a `pathToCem`, so we try to get it from that location */
          if(!!pathToCem) {
            try {
              const manifest = JSON.parse(fs.readFileSync(pathToCem).toString());
              manifests.push(manifest);
              return;
            } catch (e) {
              throw new Error(`Could not find custom-elements.json at path: "${pathToCem}" for package "${packageName}". \n\n${e.stack}`);
            }
          } 

          /** User provided `analyze` config, so they want to analyze the dependency */
          if(!!analyze) {
            const pkg = await createPackage(packageName, analyze, userConfig?.overrideModuleCreation);
            packages.push(pkg);
          }
        })
      );
  
      /**
       * Create the manifest
       */
      // const customElementsManifest = create({
      //   packages,
      //   manifests,
      //   dev: mergedOptions.dev
      // });

      // const outdir = path.join(process.cwd(), mergedOptions.outdir);
      // if (!fs.existsSync(outdir)){
      //   fs.mkdirSync(outdir, { recursive: true });
      // }
      // fs.writeFileSync(path.join(outdir, 'custom-elements.json'), `${JSON.stringify(customElementsManifest, null, 2)}\n`);
      // if(mergedOptions.dev) {
      //   console.log(JSON.stringify(customElementsManifest, null, 2));
      // }

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