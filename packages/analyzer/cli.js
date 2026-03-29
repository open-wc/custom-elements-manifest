#!/usr/bin/env node

import { parseSync } from "oxc-parser";
import { walk } from "oxc-walker";
import path from "path";
import globby from "globby";
import fs from "fs";
import commandLineArgs from "command-line-args";
import chokidar from "chokidar";
import debounce from "debounce";

import { create, associateJsDoc } from "./src/create.js";
import {
  getUserConfig,
  getCliConfig,
  addFrameworkPlugins,
  addCustomElementsPropertyToPackageJson,
  mergeGlobsAndExcludes,
  timestamp,
  DEFAULTS,
  MENU,
} from "./src/utils/cli-helpers.js";
import { findExternalManifests } from "./src/utils/find-external-manifests.js";
import { mergeResolutionOptions } from "./src/utils/resolver-config.js";
import { annotateTree } from "./src/utils/index.js";

/**
 * Parse a source file with oxc-parser and return a module object.
 */
function parseModule(filePath, source) {
  const ext = path.extname(filePath);
  // Always parse with TypeScript support to handle TS annotations in JS files
  // (accessibility modifiers, type annotations, as const, etc.)
  const langMap = { '.tsx': 'tsx', '.jsx': 'jsx' };
  const opts = { lang: langMap[ext] || 'ts' };
  
  const result = parseSync(filePath, source, opts);
  
  // Associate JSDoc comments with nodes (uses non-enumerable properties)
  associateJsDoc(result.program, result.comments, source);
  
  // Annotate tree with source text and program refs (uses non-enumerable properties)
  annotateTree(result.program, source, walk);
  
  return {
    program: result.program,
    sourceText: source,
    fileName: filePath,
    comments: result.comments,
  };
}

/**
 * @param {{argv:string[]; cwd: string; noWrite:boolean}} [opts]
 */
export async function cli({
  argv = process.argv,
  cwd = process.cwd(),
  noWrite,
} = {}) {
  const mainDefinitions = [{ name: "command", defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
    argv,
  });
  const cliArgs = mainOptions._unknown || [];

  if (mainOptions.command === "analyze") {
    const { config: configPath, ...cliConfig } = getCliConfig(cliArgs);
    const userConfig = await getUserConfig(configPath, cwd);
    /**
     * Merged config options
     * Command line options override userConfig options
     */
    const mergedOptions = { ...DEFAULTS, ...userConfig, ...cliConfig };
    const merged = mergeGlobsAndExcludes(DEFAULTS, userConfig, cliConfig);
    async function run() {
      // Merge resolution options with priority: CLI > user config > defaults
      const resolutionOptions = mergeResolutionOptions(
        userConfig?.resolutionOptions
      );

      const globs = await globby(merged, { cwd });
      
      const modules = globs.map((glob) => {
        const fullPath = path.resolve(cwd, glob);
        const source = fs.readFileSync(fullPath).toString();
        return parseModule(glob, source);
      });

      let thirdPartyCEMs = [];
      if (mergedOptions?.dependencies) {
        try {
          const fullPathGlobs = globs.map((glob) => path.resolve(cwd, glob));
          thirdPartyCEMs = await findExternalManifests(fullPathGlobs, {
            basePath: cwd,
            resolutionOptions,
          });
        } catch (e) {
          if (mergedOptions.dev)
            console.log(`Failed to add third party CEMs. \n\n${e.stack}`);
        }
      }

      let plugins = await addFrameworkPlugins(mergedOptions);
      plugins = [...plugins, ...(userConfig?.plugins || [])];

      const context = { dev: mergedOptions.dev, thirdPartyCEMs };

      /**
       * Create the manifest
       */
      const customElementsManifest = create({ modules, plugins, context });

      if (mergedOptions.dev) {
        console.log(JSON.stringify(customElementsManifest, null, 2));
      }

      if (!noWrite) {
        const outdir = path.join(cwd, mergedOptions.outdir);
        if (!fs.existsSync(outdir)) {
          fs.mkdirSync(outdir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(outdir, "custom-elements.json"),
          `${JSON.stringify(customElementsManifest, null, 2)}\n`
        );
      }

      if (!mergedOptions.quiet) {
        console.log(
          `[${timestamp()}] @custom-elements-manifest/analyzer: Created new manifest.`
        );
      }

      return customElementsManifest;
    }
    /** The manifest that will be returned for programmatic calls of cli */
    const manifest = await run();

    /**
     * Watch mode
     */
    if (mergedOptions.watch) {
      const fileWatcher = chokidar.watch(merged);

      const onChange = debounce(run, 100);

      fileWatcher.addListener("add", onChange);
      fileWatcher.addListener("change", onChange);
      fileWatcher.addListener("unlink", onChange);
    }

    try {
      if (mergedOptions.packagejson) {
        addCustomElementsPropertyToPackageJson(mergedOptions.outdir);
      }
    } catch {
      console.log(
        `Could not add 'customElements' property to ${cwd}${path.sep}package.json. \nAdding this property helps tooling locate your Custom Elements Manifest. Please consider adding it yourself, or file an issue if you think this is a bug.\nhttps://www.github.com/open-wc/custom-elements-manifest`
      );
    }

    return manifest;
  } else {
    console.log(MENU);
  }
}
