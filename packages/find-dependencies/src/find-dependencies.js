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

const configResult = loadConfig()


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
 *
 * @param {string[]} paths
 * @param {{
 *  nodeModulesDepth?: number,
 *  basePath?: string,
 * }} options
 * @returns {Promise<string[]>}
 */
export async function findDependencies (paths, options = {}) {
  const importsToScan = new Set()
  const dependencies = new Set()

  const nodeModulesDepth = options?.nodeModulesDepth ?? 3
  const basePath = options?.basePath ?? process.cwd()
  const absoluteBasePath = path.isAbsolute(basePath) ? basePath : path.resolve(basePath)

  const input = paths.map(path => getFileNameWithSource(path))
  const { output } = await rsModuleLexer.parseAsync({ input })
  
  output.forEach(result => {
    result.imports?.forEach(i => {
      /** Skip built-in modules like fs, path, etc */
      if (builtinModules.includes(i.n)) return
      try {
        const pathToDependency = resolveDependencyPath(i.n, basePath || result.filename, nodeModulesDepth, undefined, absoluteBasePath)
        importsToScan.add(pathToDependency)
        dependencies.add(pathToDependency)
      } catch (error) {
        console.log(`Failed to resolve dependency "${i.n}": ${error.message}`)
      }
    })
  })

  while (importsToScan.size) {
    for (const dep of importsToScan) {
      importsToScan.delete(dep)
      const input = getFileNameWithSource(dep)
      const { output } = await rsModuleLexer.parseAsync({ input: [input] })
      output.forEach(result => {
        result.imports?.forEach(i => {
          /** Skip built-in modules like fs, path, etc */
          if (builtinModules.includes(i.n)) return
          try {
            const { packageRoot } = splitPath(dep)
            let pathToDependency
            
            if (isBareModuleSpecifier(i.n)) {
              // Bare module specifier - use normal resolution
              pathToDependency = resolveDependencyPath(i.n, dep, nodeModulesDepth, packageRoot, absoluteBasePath)
            } else {
              // Relative path - resolve directly from the current file's directory
              const baseDir = path.dirname(dep)
              const resolvedLocal = path.resolve(baseDir, i.n)
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
            if (!dependencies.has(pathToDependency)) {
              importsToScan.add(pathToDependency)
              dependencies.add(pathToDependency)
            }
          } catch (error) {
            console.error(`Failed to resolve dependency "${i.n}" in file "${dep}": ${error.message}`)
          }
        })
      })
    }
  }

  return [...dependencies]
}

/** Pierwotna wersja
 *
 * @param {string} dep
 * @param {string} basePath
 * @param {number} [nodeModulesDepth=3]
 * @param {string} [packageRoot]
 * @return {string}
 */
//export function resolveDependencyPath (dep, basePath, nodeModulesDepth = 3, packageRoot) {
//  // If it is relative path, resolve it
//  if (!isBareModuleSpecifier(dep)) {
//    return path.resolve(path.dirname(basePath), dep)
//  }
//
//  const paths = [basePath, ...traverseUp(nodeModulesDepth, { cwd: basePath })]
//  if (packageRoot) {
//    paths.push(packageRoot)
//  }
//  console.log(paths)
//
//  // Próba zmapowania aliasu z tsconfig-paths
//  if (matchPath) {
//    const mapped = matchPath(dep, readJsonSync, fs.existsSync, TS_EXTENSIONS)
//    if (mapped) {
//      try {
//        return resolveWithExtensions(mapped)
//      } catch {
//        // jeżeli mapowanie nie wskazuje na istniejący plik, spróbuj dalej
//      }
//    }
//  }
//
//  // For bareSpecifier, try to resolve it
//  return require.resolve(dep, {
//    paths
//  })
//}


/**
 * Rozwiązuje ścieżkę do zależności, uwzględniając aliasy z tsconfig, lokalne pliki oraz katalogi node_modules.
 * @param {string} dep - Nazwa lub ścieżka zależności do rozwiązania.
 * @param {string} basePath - Bazowy katalog, od którego rozpoczyna się wyszukiwanie.
 * @param {number} [nodeModulesDepth=3] - Maksymalna liczba poziomów do przeszukania w górę dla node_modules.
 * @param {string} [packageRoot] - Opcjonalny katalog root paczki.
 * @returns {string} - Pełna ścieżka do zależności.
 * @throws {Error} - Gdy nie uda się rozwiązać ścieżki.
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
    const resolvedLocal = path.resolve(baseDir, dep)
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
  
  while (currentDir !== path.dirname(currentDir)) {
    const configResult = loadConfig(currentDir)
    if (configResult.resultType === 'success') {
      const matchPath = createMatchPath(configResult.absoluteBaseUrl, configResult.paths)
      const mapped = matchPath(dep, readJsonSync, fs.existsSync, TS_EXTENSIONS)
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
