#!/usr/bin/env node

import { parseSync } from "oxc-parser";
import { walk } from "oxc-walker";
import path from "path";
import globby from "globby";
import fs from "fs";
import commandLineArgs from "command-line-args";
import chokidar from "chokidar";
import debounce from "debounce";
import { createModuleGraph } from "@thepassle/module-graph";

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
 * Find the package root directory by walking up from a file path until we find a package.json.
 * @param {string} filePath - Absolute path to a file
 * @returns {string|null} The directory containing the nearest package.json, or null
 */
function findPackageRoot(filePath) {
  let dir = path.dirname(filePath);
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Given the external modules from the module graph, find and load any
 * custom-elements.json manifests published by those packages.
 * 
 * @param {Map<string, import('@thepassle/module-graph/types.js').ExternalModule>} externalModules
 * @param {string} basePath
 * @returns {import('custom-elements-manifest/schema').Package[]}
 */
function findExternalManifestsFromGraph(externalModules, basePath) {
  /** @type {import('custom-elements-manifest/schema').Package[]} */
  const cemsToMerge = [];
  const visited = new Set();

  for (const [, mod] of externalModules) {
    // Determine the package root from the module graph or by walking up directories
    let packageRoot;
    if (mod.packageRoot) {
      try {
        packageRoot = mod.packageRoot instanceof URL
          ? mod.packageRoot.pathname
          : new URL(mod.packageRoot).pathname;
      } catch {
        packageRoot = String(mod.packageRoot);
      }
    } else {
      // For symlinked workspace packages, packageRoot may not be available.
      // Walk up from the resolved file path to find the package.json.
      const resolvedPath = mod.pathname || mod.href;
      const filePath = resolvedPath.startsWith('file://') 
        ? new URL(resolvedPath).pathname 
        : resolvedPath;
      packageRoot = findPackageRoot(filePath);
    }

    if (!packageRoot) continue;

    // Skip if we've already visited this package root
    if (visited.has(packageRoot)) continue;
    visited.add(packageRoot);

    // Skip if this is the current project (not a dependency)
    const normalizedBase = path.resolve(basePath);
    const normalizedRoot = path.resolve(packageRoot);
    if (normalizedRoot === normalizedBase || normalizedRoot.startsWith(normalizedBase + path.sep) && !normalizedRoot.includes('node_modules')) {
      continue;
    }

    const cemPath = path.join(packageRoot, 'custom-elements.json');
    const packageJsonPath = path.join(packageRoot, 'package.json');

    // Try to find custom-elements.json at package root
    if (fs.existsSync(cemPath)) {
      try {
        const cem = JSON.parse(fs.readFileSync(cemPath).toString());
        cemsToMerge.push(cem);
        continue;
      } catch (e) {
        throw new Error(`Failed to read custom-elements.json at path "${cemPath}". \n\n${e.stack}`);
      }
    }

    // Check package.json for customElements field or export map
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
      const cemLocation = packageJson?.customElements || packageJson?.exports?.['./customElements'];

      if (cemLocation) {
        try {
          const resolvedCemPath = path.resolve(packageRoot, cemLocation);
          const cem = JSON.parse(fs.readFileSync(resolvedCemPath).toString());
          cemsToMerge.push(cem);
        } catch (e) {
          throw new Error(`Failed to read custom-elements.json at path "${cemPath}". \n\n${e.stack}`);
        }
      }
    }
  }

  return cemsToMerge;
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
      const globs = await globby(merged, { cwd });

      let thirdPartyCEMs = [];

      if (mergedOptions?.dependencies) {
        // Use module graph to discover all modules and their dependencies
        try {
          const moduleGraph = await createModuleGraph(globs, {
            basePath: cwd,
            ...(userConfig?.resolutionOptions || {}),
          });

          // Extract third-party CEMs from external modules discovered by the graph
          thirdPartyCEMs = findExternalManifestsFromGraph(
            moduleGraph.externalModules,
            cwd,
          );
        } catch (e) {
          if (mergedOptions.dev)
            console.log(`Failed to build module graph or add third party CEMs. \n\n${e.stack}`);
        }
      }

      // Parse all local modules found by the glob
      const modules = globs.map((glob) => {
        const fullPath = path.resolve(cwd, glob);
        const source = fs.readFileSync(fullPath).toString();
        return parseModule(glob, source);
      });

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
