#!/usr/bin/env node

import { parseSync } from "oxc-parser";
import { createModuleGraph } from "@thepassle/module-graph";
import { walk } from "oxc-walker";
import { parse as parseJsDoc } from "comment-parser";
import path from "path";
import globby from "globby";
import fs from "fs";
import commandLineArgs from "command-line-args";
import chokidar from "chokidar";
import debounce from "debounce";

import { create } from "./src/create.js";
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

/**
 * Associate JSDoc comments with AST nodes by position.
 */
function associateJsDoc(program, comments, sourceText) {
  if (!comments || comments.length === 0) return;

  const jsDocComments = comments
    .filter(c => c.type === 'Block' && c.value.startsWith('*'))
    .map(c => ({
      ...c,
      fullText: `/*${c.value}*/`,
      commentEnd: c.end + 2,
    }));

  if (jsDocComments.length === 0) return;

  walk(program, {
    enter(node) {
      if (!node || node.start == null) return;
      for (const comment of jsDocComments) {
        const between = sourceText.slice(comment.commentEnd, node.start);
        if (between.trim() === '' || between.trim() === 'export' || between.trim() === 'export default') {
          if (!node._jsdoc) {
            node._jsdoc = [];
          }
          const parsed = parseJsDoc(comment.fullText);
          if (parsed.length > 0) {
            node._jsdoc.push(parsed[0]);
          }
          node._rawJsDoc = node._rawJsDoc || [];
          node._rawJsDoc.push(comment.fullText);
          break;
        }
      }
    }
  });
}

/**
 * Annotate all nodes in the tree with _sourceText and _program references.
 */
function annotateTree(program, sourceText) {
  walk(program, {
    enter(node) {
      if (node) {
        node._sourceText = sourceText;
        node._program = program;
      }
    }
  });
}

/**
 * Parse a source file with oxc-parser and return a module object.
 */
function parseModule(filePath, source) {
  const ext = path.extname(filePath);
  const langMap = { '.ts': 'ts', '.tsx': 'tsx', '.jsx': 'jsx' };
  const opts = {};
  if (langMap[ext]) {
    opts.lang = langMap[ext];
  }
  
  const result = parseSync(filePath, source, opts);
  
  // Associate JSDoc comments with nodes
  associateJsDoc(result.program, result.comments, source);
  
  // Annotate tree with source text
  annotateTree(result.program, source);
  
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
