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
import { extractTypeScriptImports, isTypeScriptFile } from './typescript-parser.js'

const require = createRequire(import.meta.url)

const configResult = loadConfig()

/**
 * Extract imports from source code using appropriate parser
 * @param {string} sourceCode - Source code content
 * @param {string} fileName - File path for parser selection and context
 * @returns {Promise<Array<{n: string}>>} Array of import objects compatible with rs-module-lexer format
 */
async function extractImports(sourceCode, fileName) {
  try {
    if (isTypeScriptFile(fileName)) {
      // Use TypeScript parser for .ts/.tsx files
      return extractTypeScriptImports(sourceCode, fileName).map(n => ({ n }))
    } else {
      // Use rs-module-lexer for .js/.jsx files
      const { output } = await rsModuleLexer.parseAsync({ input: [{ filename: fileName, code: sourceCode }] })
      return output[0]?.imports || []
    }
  } catch (error) {
    console.warn(`Failed to parse ${fileName}: ${error.message}`)
    return []
  }
}


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

let matchPath = null

if (configResult.resultType==='success') {
  matchPath = createMatchPath(configResult.absoluteBaseUrl, configResult.paths)
}


function readJsonSync (p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return undefined
  }
}


/**
 * Find all dependencies for given file paths
 * @param {string[]} paths - Array of file paths to analyze
 * @param {{
 *  nodeModulesDepth?: number,
 *  basePath?: string,
 * }} options - Configuration options
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

  const input = paths.map(path => getFileNameWithSource(path))

  // Process each file with appropriate parser
  for (const fileData of input) {
    const imports = await extractImports(fileData.code, fileData.filename)
    imports.forEach(i => {
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
  }

  while (importsToScan.size) {
    for (const dep of importsToScan) {
      importsToScan.delete(dep)
      const fileData = getFileNameWithSource(dep)
      const imports = await extractImports(fileData.code, fileData.filename)
      imports.forEach(i => {
        /** Skip built-in modules like fs, path, etc */
        if (builtinModules.includes(i.n)) return
        try {
          let pathToDependency

            if (isBareModuleSpecifier(i.n)) {
              // Check if it's a TypeScript path mapping first
              pathToDependency = null

              // Try TypeScript path mapping
              const depWithoutExt = i.n.endsWith('.js') ? i.n.slice(0, -3) : i.n
              const tsconfigSearchPath = absoluteBasePath || path.dirname(dep)
              const absoluteTsconfigPath = path.isAbsolute(tsconfigSearchPath) ? tsconfigSearchPath : path.resolve(tsconfigSearchPath)
              let currentDir = fs.existsSync(absoluteTsconfigPath) && fs.statSync(absoluteTsconfigPath).isDirectory()
                               ? absoluteTsconfigPath
                               : path.dirname(absoluteTsconfigPath)

              while (currentDir !== path.dirname(currentDir)) {
                const configResult = loadConfig(currentDir)
                if (configResult.resultType === 'success') {
                  const matchPath = createMatchPath(configResult.absoluteBaseUrl, configResult.paths)
                  const mapped = matchPath(depWithoutExt, readJsonSync, fs.existsSync, TS_EXTENSIONS)
                  if (mapped) {
                    const resolved = resolveWithExtensions(mapped)
                    if (resolved) {
                      pathToDependency = resolved
                      break
                    }
                  }
                }
                currentDir = path.dirname(currentDir)
              }

              // If TypeScript path mapping didn't work, try normal resolution
              if (!pathToDependency) {
                const { packageRoot } = splitPath(dep)
                pathToDependency = resolveDependencyPath(i.n, dep, nodeModulesDepth, packageRoot, absoluteBasePath)
              }
            } else {
              // Relative path - resolve directly from the current file's directory
              const baseDir = path.dirname(dep)
              let resolvedLocal = path.resolve(baseDir, i.n)

              // If the original import has .js extension but file doesn't exist, try .ts
              if (!fs.existsSync(resolvedLocal) && i.n.endsWith('.js')) {
                const importWithTs = i.n.slice(0, -3) + '.ts'
                resolvedLocal = path.resolve(baseDir, importWithTs)
              }

              const resolved = resolveWithExtensions(resolvedLocal)
              if (resolved) {
                pathToDependency = resolved
              } else {
                throw new Error(`Local file not found: ${resolvedLocal}`)
              }
            }

            /**
             * Don't add dependencies we've already scanned, also avoids circular dependencies
             * and multiple modules importing from the same module
             */
            if (pathToDependency) {
              const normalizedPath = path.normalize(pathToDependency)
              if (!dependencies.has(normalizedPath)) {
                importsToScan.add(normalizedPath)
                dependencies.add(normalizedPath)
              }
            }
          } catch (error) {
            console.error(`Failed to resolve dependency "${i.n}" in file "${dep}": ${error.message}`)
          }
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
 * @param originalBasePath - Original base path for tsconfig resolution.
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
                    : path.dirname(basePath)
    let resolvedLocal = path.resolve(baseDir, dep)

    // If the original dep has .js extension but file doesn't exist, try .ts
    if (!fs.existsSync(resolvedLocal) && dep.endsWith('.js')) {
      const depWithTs = dep.slice(0, -3) + '.ts'
      resolvedLocal = path.resolve(baseDir, depWithTs)
    }

    const resolved = resolveWithExtensions(resolvedLocal)
    if (resolved) {
      return resolved
    }
    throw new Error(`Local file not found: ${resolvedLocal}`)
  }

  const paths = [basePath, ...traverseUp(nodeModulesDepth, { cwd: basePath })]
  if (packageRoot) {
    paths.push(packageRoot)
  }

  // Try TypeScript path mapping using originalBasePath if available
  const tsconfigSearchPath = originalBasePath || basePath
  const absoluteTsconfigPath = path.isAbsolute(tsconfigSearchPath) ? tsconfigSearchPath : path.resolve(tsconfigSearchPath)
  let currentDir = fs.existsSync(absoluteTsconfigPath) && fs.statSync(absoluteTsconfigPath).isDirectory()
                   ? absoluteTsconfigPath
                   : path.dirname(absoluteTsconfigPath)
  // Look for tsconfig.json going up the directory tree
  while (currentDir !== path.dirname(currentDir)) {
    const configResult = loadConfig(currentDir)
    if (configResult.resultType === 'success') {
      const matchPath = createMatchPath(configResult.absoluteBaseUrl, configResult.paths)

      // Try to resolve with original dependency name
      let mapped = matchPath(dep, readJsonSync, fs.existsSync, TS_EXTENSIONS)

      // If that fails and the dependency has .js extension, try without extension
      if (!mapped && dep.endsWith('.js')) {
        const depWithoutExt = dep.slice(0, -3)
        mapped = matchPath(depWithoutExt, readJsonSync, fs.existsSync, TS_EXTENSIONS)
      }

      if (mapped) {
        const resolved = resolveWithExtensions(mapped)
        if (resolved) return resolved
      }
    }
    currentDir = path.dirname(currentDir)
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
    const stat = fs.statSync(candidate)
    if (stat.isFile()) return candidate
    if (stat.isDirectory()) {
      // Try index files with different extensions
      for (const ext of TS_EXTENSIONS) {
        const indexPath = path.join(candidate, 'index' + ext)
        if (fs.existsSync(indexPath)) return indexPath
      }
    }
  }

  // Try with different extensions
  for (const ext of TS_EXTENSIONS) {
    const pathWithExt = candidate + ext
    if (fs.existsSync(pathWithExt)) return pathWithExt
  }

  return null
}
