import path from 'path'
import fs from 'fs'
import { createRequire, builtinModules } from 'module'
import rsModuleLexer from 'rs-module-lexer'

import {
  getFileNameWithSource,
  isBareModuleSpecifier,
  splitPath,
  traverseUp
} from './utils.js'
import { loadConfig, createMatchPath } from 'tsconfig-paths'

const require = createRequire(import.meta.url)

const TS_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.d.ts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json'
]

function readJsonSync (p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return undefined
  }
}


/**
 * Find all dependencies of the given file paths
 * @param {string[]} paths - Array of file paths to analyze
 * @param {{
 *  nodeModulesDepth?: number,
 *  basePath?: string,
 * }} options - Options object
 * @returns {Promise<string[]>} Array of dependency paths
 */
export async function findDependencies (paths, options = {}) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('paths must be a non-empty array')
  }
  
  const importsToScan = new Set()
  const dependencies = new Set()

  const nodeModulesDepth = options?.nodeModulesDepth ?? 3
  const basePath = options?.basePath ?? process.cwd()
  const absoluteBasePath = path.isAbsolute(basePath) ? basePath : path.resolve(basePath)

  const input = paths.map(filePath => getFileNameWithSource(filePath))
  
  // Process initial files
  for (const fileData of input) {
    const { output } = await rsModuleLexer.parseAsync({ input: [fileData] })
    output.forEach(result => {
      result.imports?.forEach(i => {
        /** Skip built-in modules like fs, path, etc */
        if (builtinModules.includes(i.n)) return
        try {
          const pathToDependency = resolveDependencyPath(i.n, basePath || fileData.filename, nodeModulesDepth, undefined, absoluteBasePath)
          if (pathToDependency) {
            const normalizedPath = path.normalize(pathToDependency)
            importsToScan.add(normalizedPath)
            dependencies.add(normalizedPath)
          }
        } catch (error) {
          console.log(`Failed to resolve dependency "${i.n}": ${error.message}`)
        }
      })
    })
  }

  // Process dependencies recursively
  while (importsToScan.size) {
    for (const dep of importsToScan) {
      importsToScan.delete(dep)
      if (!dep || typeof dep !== 'string') {
        console.log(`Skipping invalid dependency: ${dep}`)
        continue
      }
      const fileData = getFileNameWithSource(dep)
      const { output } = await rsModuleLexer.parseAsync({ input: [fileData] })
      output.forEach(result => {
        result.imports?.forEach(i => {
          /** Skip built-in modules like fs, path, etc */
          if (builtinModules.includes(i.n)) return
          try {
            let pathToDependency
            
            if (isBareModuleSpecifier(i.n)) {
              // Bare module specifier - resolve from the current file's directory
              const { packageRoot } = splitPath(dep)
              const baseDir = path.dirname(dep)
              pathToDependency = resolveDependencyPath(i.n, baseDir, nodeModulesDepth, packageRoot, absoluteBasePath)
            } else {
              // Relative path - resolve directly from the current file's directory
              const baseDir = path.dirname(dep)
              pathToDependency = resolveDependencyPath(i.n, baseDir, nodeModulesDepth, undefined, absoluteBasePath)
            }
            
            /**
             * Don't add dependencies we've already scanned, also avoids circular dependencies
             * and multiple modules importing from the same module
             */
            if (pathToDependency && !dependencies.has(pathToDependency)) {
              const normalizedPath = path.normalize(pathToDependency)
              importsToScan.add(normalizedPath)
              dependencies.add(normalizedPath)
            }
          } catch (error) {
            console.log(`Failed to resolve dependency "${i.n}" in file "${dep}": ${error.message}`)
          }
        })
      })
    }
  }

  return [...dependencies]
}


/**
 * Resolves dependency path, considering tsconfig aliases, local files and node_modules directories.
 * @param {string} dep - Dependency name or path to resolve.
 * @param {string} basePath - Base directory from which to start the search.
 * @param {number} [nodeModulesDepth=3] - Maximum number of levels to traverse up for node_modules.
 * @param {string} [packageRoot] - Optional package root directory.
 * @param {string} [originalBasePath] - Original base path for tsconfig resolution.
 * @returns {string} - Full path to the dependency.
 * @throws {Error} - When the path cannot be resolved.
 * @example
 * resolveDependencyPath('lodash', '/project/packages/my-package')
 */
export function resolveDependencyPath (dep, basePath, nodeModulesDepth = 5, packageRoot, originalBasePath) {
  if (typeof dep !== 'string' || !dep) {
    throw new Error('Invalid dependency name')
  }

  // Handle relative paths
  if (!isBareModuleSpecifier(dep)) {
    const baseDir = fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()
      ? basePath
      : path.dirname(basePath);
    let resolvedLocal = path.resolve(baseDir, dep);

    // Try all possible extensions and directory index files
    const resolved = resolveWithExtensions(resolvedLocal);
    if (resolved) {
      return resolved;
    }
    throw new Error(`Local file not found: ${resolvedLocal}`);
  }

  const paths = [basePath, ...traverseUp(nodeModulesDepth, { cwd: basePath })];
  if (packageRoot) {
    paths.push(packageRoot);
  }

  // Try TypeScript path mapping using originalBasePath if available
  const tsconfigSearchPath = originalBasePath || basePath;
  const absoluteTsconfigPath = path.isAbsolute(tsconfigSearchPath) ? tsconfigSearchPath : path.resolve(tsconfigSearchPath);
  let currentDir = fs.existsSync(absoluteTsconfigPath) && fs.statSync(absoluteTsconfigPath).isDirectory()
    ? absoluteTsconfigPath
    : path.dirname(absoluteTsconfigPath);
  // Look for tsconfig.json going up the directory tree
  while (currentDir !== path.dirname(currentDir)) {
    const configResult = loadConfig(currentDir);
    if (configResult.resultType === 'success') {
      const matchPath = createMatchPath(configResult.absoluteBaseUrl, configResult.paths);
      // Try to resolve with original dependency name
      let mapped = matchPath(dep, readJsonSync, fs.existsSync, TS_EXTENSIONS);
      // If that fails and the dependency has .js extension, try without extension
      if (!mapped && dep.endsWith('.js')) {
        const depWithoutExt = dep.slice(0, -3);
        mapped = matchPath(depWithoutExt, readJsonSync, fs.existsSync, TS_EXTENSIONS);
      }
      if (mapped) {
        const resolved = resolveWithExtensions(mapped);
        if (resolved) return resolved;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  // Search in node_modules directories
  for (const dir of paths) {
    const nodeModulesDir = path.join(dir, 'node_modules')
    if (!fs.existsSync(nodeModulesDir)) continue
    
    const packagePath = path.join(nodeModulesDir, dep)
    if (fs.existsSync(packagePath)) {
      const resolved = resolveWithExtensions(packagePath)
      if (resolved) return resolved
    }
  }

  // Try require.resolve as fallback
  try {
    return require.resolve(dep, { paths })
  } catch (err) {
    throw new Error(`Could not resolve dependency: ${dep}. ${err.message}`)
  }
}

function resolveWithExtensions (candidate) {
  // Check if exact file exists
  if (fs.existsSync(candidate)) {
    const stat = fs.statSync(candidate);
    if (stat.isFile()) {
      return candidate;
    }
    if (stat.isDirectory()) {
      // Try index files with different extensions
      for (const ext of TS_EXTENSIONS) {
        const indexPath = path.join(candidate, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }
  // Try with different extensions
  for (const ext of TS_EXTENSIONS) {
    const pathWithExt = candidate + ext;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }
  // If the candidate ends with .js, try .ts and .d.ts as well
  if (candidate.endsWith('.js')) {
    const tsCandidate = candidate.slice(0, -3) + '.ts';
    if (fs.existsSync(tsCandidate)) {
      return tsCandidate;
    }
    const dtsCandidate = candidate.slice(0, -3) + '.d.ts';
    if (fs.existsSync(dtsCandidate)) {
      return dtsCandidate;
    }
  }
  // Try directory with index files if candidate is missing extension
  const dirCandidate = candidate.replace(/\.[^/.]+$/, '');
  if (fs.existsSync(dirCandidate) && fs.statSync(dirCandidate).isDirectory()) {
    for (const ext of TS_EXTENSIONS) {
      const indexPath = path.join(dirCandidate, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  }
  return null;
}
