import path from 'path';
import {createRequire, builtinModules} from 'module';
import rsModuleLexer from 'rs-module-lexer';

import {
    getFileNameWithSource,
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

    const input = paths.map(path => getFileNameWithSource(path))

    const { output} = await rsModuleLexer.parseAsync({ input });
    output.forEach(result => {
        result.imports?.forEach(i => {
            /** Skip built-in modules like fs, path, etc */
            if (builtinModules.includes(i.n)) return;
            try {
                const pathToDependency = require.resolve(i.n, {
                    paths: [
                        /** Current project's node_modules */
                        basePath,
                        /** Monorepo, look upwards in filetree n times */
                        ...traverseUp(nodeModulesDepth, {cwd: basePath})
                    ]
                });

                importsToScan.add(pathToDependency);
                dependencies.add(pathToDependency);
            } catch {
                console.log(`Failed to resolve dependency "${i.n}".`);
            }
        });
    });

    while (importsToScan.size) {
        for (const dep of importsToScan) {
            importsToScan.delete(dep);
            const input = getFileNameWithSource(dep)
            const { output } = await rsModuleLexer.parseAsync({ input: [input] });
            output.forEach(result => {
                result.imports?.forEach(i => {
                    /** Skip built-in modules like fs, path, etc */
                    if (builtinModules.includes(i.n)) return;
                    const {packageRoot} = splitPath(dep);
                    const fileToFind = isBareModuleSpecifier(i.n) ? i.n : path.join(path.dirname(dep), i.n);
                    try {
                        /**
                         * First check in the dependencies' node_modules, then in the project's node_modules,
                         * then up, and up, and up
                         */
                        const pathToDependency = require.resolve(fileToFind, {
                            paths: [
                                /** Nested node_modules */
                                packageRoot,
                                /** Current project's node_modules */
                                basePath,
                                /** Monorepo, look upwards in filetree n times */
                                ...traverseUp(nodeModulesDepth, {cwd: basePath})
                            ]
                        });
                        /**
                         * Don't add dependencies we've already scanned, also avoids circular dependencies
                         * and multiple modules importing from the same module
                         */
                        if (!dependencies.has(pathToDependency)) {
                            importsToScan.add(pathToDependency);
                            dependencies.add(pathToDependency);
                        }
                    } catch (e) {
                        console.log(`Failed to resolve dependency "${i.n}".`);
                    }
                });
            });
        }
    }

    return [...dependencies];
}