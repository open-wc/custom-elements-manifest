import fs from 'fs';
import path from 'path';
import { createRequire, builtinModules } from 'module';
import { init, parse } from 'es-module-lexer';

import {
  isBareModuleSpecifier,
  splitPath,
  traverseUp
} from './utils.js';

const require = createRequire(import.meta.url);

/**
 *
 * @param {string[]} paths
 * @param {{
 *  nodeModulesDepth?: number,
 *  basePath?: string,
 * }} options
 * @returns {Promise<string[]>}
 */
export async function findDependencies(paths, options = {}) {
  const importsToScan = new Set();
  const dependencies = new Set();

  const nodeModulesDepth = options?.nodeModulesDepth ?? 3;
  const basePath = options?.basePath ?? process.cwd();

  /** Init es-module-lexer wasm */
  await init;

  paths.forEach(path => {
    const source = fs.readFileSync(path).toString();
    const [imports] = parse(source);

    imports?.forEach(i => {
      /** Skip built-in modules like fs, path, etc */
      if(builtinModules.includes(i.n)) return;
      try {
        const pathToDependency = require.resolve(i.n, {paths: [
          /** Current project's node_modules */
          basePath,
          /** Monorepo, look upwards in filetree n times */
          ...traverseUp(nodeModulesDepth, { cwd: basePath })
        ]});

        importsToScan.add(pathToDependency);
        dependencies.add(pathToDependency);
      } catch {
        console.log(`Failed to resolve dependency "${i.n}".`);
      }
    });
  });

  while(importsToScan.size) {
    importsToScan.forEach(dep => {
      importsToScan.delete(dep);

      const source = fs.readFileSync(dep).toString();
      const [imports] = parse(source);

      imports?.forEach(i => {
        /** Skip built-in modules like fs, path, etc */
        if(builtinModules.includes(i.n)) return;
        const { packageRoot } = splitPath(dep);
        const fileToFind = isBareModuleSpecifier(i.n) ? i.n : path.join(path.dirname(dep), i.n);
        try {
          /**
           * First check in the dependencies' node_modules, then in the project's node_modules,
           * then up, and up, and up
           */
          const pathToDependency = require.resolve(fileToFind, {paths: [
            /** Nested node_modules */
            packageRoot,
            /** Current project's node_modules */
            basePath,
            /** Monorepo, look upwards in filetree n times */
            ...traverseUp(nodeModulesDepth, { cwd: basePath })
          ]});
          /**
           * Don't add dependencies we've already scanned, also avoids circular dependencies
           * and multiple modules importing from the same module
           */
          if(!dependencies.has(pathToDependency)) {
            importsToScan.add(pathToDependency);
            dependencies.add(pathToDependency);
          }
        } catch(e) {
          console.log(`Failed to resolve dependency "${i.n}".`);
        }
      });
    });
  }

  return [...dependencies];
}