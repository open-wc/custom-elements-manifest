import ts from "typescript";
import path from "path";
import globby from "globby";
import fs from "fs";

import { create } from "./src/create.js";
import {
  getUserConfig,
  addFrameworkPlugins,
  mergeGlobsAndExcludes,
  DEFAULTS,
} from "./src/utils/cli-helpers.js";
import { findExternalManifests } from "./src/utils/find-external-manifests.js";
import { mergeResolutionOptions } from "./src/utils/resolver-config.js";

/**
 * This module provides functionality to generate a manifest file
 * based on the provided configuration.
 * @param {import('./index').Config | string} config - Configuration object or path to config file
 * @param {Object} options - Additional options
 * @param {string} [options.cwd=process.cwd()] - Current working directory
 * @param {boolean} [options.write=true] - Whether to write the manifest to disk
 * @returns {Promise<import('custom-elements-manifest/schema').Package>} The generated custom elements manifest
 */
export async function generateManifest(config, options = {}) {
  const { cwd = process.cwd(), write = true } = options;
  
  // Load user config if a path was provided
  let userConfig = {};
  if (typeof config === 'string') {
    userConfig = await getUserConfig(config, cwd);
  } else {
    userConfig = config || {};
  }

  // Merge with defaults
  const mergedOptions = { ...DEFAULTS, ...userConfig };
  const merged = mergeGlobsAndExcludes(DEFAULTS, userConfig, {});

  // Merge resolution options with priority: user config > defaults
  const resolutionOptions = mergeResolutionOptions(
    userConfig?.resolutionOptions
  );

  // Resolve globs
  const globs = await globby(merged, { cwd });

  // Create TypeScript source files from globs
  const modules = userConfig?.overrideModuleCreation
    ? userConfig.overrideModuleCreation({ ts, globs })
    : globs.map((glob) => {
        const fullPath = path.resolve(cwd, glob);
        const source = fs.readFileSync(fullPath).toString();
        return ts.createSourceFile(
          glob,
          source,
          ts.ScriptTarget.ES2015,
          true
        );
      });

  // Find third-party custom elements manifests if dependencies option is enabled
  let thirdPartyCEMs = [];
  if (mergedOptions?.dependencies) {
    try {
      const fullPathGlobs = globs.map((glob) => path.resolve(cwd, glob));
      thirdPartyCEMs = await findExternalManifests(fullPathGlobs, {
        basePath: cwd,
        resolutionOptions,
      });
    } catch (e) {
      if (mergedOptions.dev) {
        console.log(`Failed to add third party CEMs. \n\n${e.stack}`);
      }
    }
  }

  // Add framework plugins
  let plugins = await addFrameworkPlugins(mergedOptions);
  plugins = [...plugins, ...(userConfig?.plugins || [])];

  // Create context
  const context = { dev: mergedOptions.dev, thirdPartyCEMs };

  // Generate the manifest
  const customElementsManifest = create({ modules, plugins, context });

  if (mergedOptions.dev) {
    console.log(JSON.stringify(customElementsManifest, null, 2));
  }

  // Write manifest to disk if requested
  if (write) {
    const outdir = path.join(cwd, mergedOptions.outdir);
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(outdir, "custom-elements.json"),
      `${JSON.stringify(customElementsManifest, null, 2)}\n`
    );

    if (!mergedOptions.quiet) {
      console.log(
        `@custom-elements-manifest/analyzer: Created custom-elements.json`
      );
    }
  }

  return customElementsManifest;
}