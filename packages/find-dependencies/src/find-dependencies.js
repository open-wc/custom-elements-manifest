import fs from 'fs';
import path from 'path';
import { createRequire, builtinModules } from 'module';
import { init, parse } from 'es-module-lexer';

import { 
  isBareModuleSpecifier,
} from './utils.js';

/**
 * 
 * @param {string[]} paths 
 * @param {{
 *  nodeModulesDepth?: number,
 * }} options 
 * @returns {Promise<string[]>}
 */
export async function findDependencies(paths, options = {}) {
  const importsToScan = new Set();
  const dependencies = new Set();

  const nodeModulesDepth = options?.nodeModulesDepth ?? 3;

  /** Init es-module-lexer wasm */
  await init;

  paths.forEach(filePath => {
    const source = fs.readFileSync(filePath).toString();
    const [imports] = parse(source);

    const pathRequire = createRequire(path.resolve(filePath));

    imports?.forEach(i => {
      /** Skip built-in modules like fs, path, etc */
      if(builtinModules.includes(i.n)) return;
      try {
        const pathToDependency = pathRequire.resolve(i.n);

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

      const depRequire = createRequire(dep);

      imports?.forEach(i => {
        /** Skip built-in modules like fs, path, etc */
        if(builtinModules.includes(i.n)) return;
        const fileToFind = isBareModuleSpecifier(i.n) ? i.n : path.join(path.dirname(dep), i.n);
        try {
          /**
           * First check in the dependencies' node_modules, then in the project's node_modules,
           * then up, and up, and up
           */
          const pathToDependency = depRequire.resolve(fileToFind);
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
