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

  const input = paths.map(path => getFileNameWithSource(path))

  const { output } = await rsModuleLexer.parseAsync({ input })
  output.forEach(result => {
    result.imports?.forEach(i => {
      /** Skip built-in modules like fs, path, etc */
      if (builtinModules.includes(i.n)) return
      try {
        const pathToDependency = resolveDependencyPath(i.n, basePath || result.filename, nodeModulesDepth)

        importsToScan.add(pathToDependency)
        dependencies.add(pathToDependency)
      } catch {
        console.log(`Failed to resolve dependency "${i.n}".`)
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
            const fileToFind = isBareModuleSpecifier(i.n) ? i.n : path.join(path.dirname(dep), i.n)
            /**
             * First check in the dependencies' node_modules, then in the project's node_modules,
             * then up, and up, and up
             */
            const pathToDependency = resolveDependencyPath(fileToFind, basePath, nodeModulesDepth, packageRoot)
            /**
             * Don't add dependencies we've already scanned, also avoids circular dependencies
             * and multiple modules importing from the same module
             */
            if (!dependencies.has(pathToDependency)) {
              importsToScan.add(pathToDependency)
              dependencies.add(pathToDependency)
            }
          } catch (e) {
            console.log(`Failed to resolve dependency "${i.n}".`)
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
export function resolveDependencyPath (dep, basePath, nodeModulesDepth = 3, packageRoot) {
  try {
    if (typeof dep!=='string' || !dep) {
      throw new Error('Nieprawidłowa nazwa zależności')
    }

    // Rozwiązanie ścieżki względnej
    if (!isBareModuleSpecifier(dep)) {
      const baseDir = fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()
                      ? basePath
                      : path.dirname(basePath)
      const resolvedLocal = path.resolve(baseDir, dep)
      if (fs.existsSync(resolvedLocal)) {
        return resolvedLocal
      }
      throw new Error(`Nie znaleziono lokalnego pliku: ${resolvedLocal}`)
    }

    const paths = [basePath, ...traverseUp(nodeModulesDepth, { cwd: basePath })]
    if (packageRoot) {
      paths.push(packageRoot)
    }

    // Próba zmapowania aliasu z tsconfig-paths
    if (matchPath) {
      const mapped = matchPath(dep, readJsonSync, fs.existsSync, TS_EXTENSIONS)
      if (mapped) {
        try {
          const resolved = resolveWithExtensions(mapped)
          if (resolved) return resolved
        } catch (error) {
          console.log(error)
          // jeżeli mapowanie nie wskazuje na istniejący plik, spróbuj dalej
        }
      }
    }

    // Szukanie w node_modules w katalogach nadrzędnych
    for (const dir of paths) {
      try {
        const nodeModulesPath = path.join(dir, 'node_modules', dep)
        if (fs.existsSync(nodeModulesPath)) {
          const resolved = resolveWithExtensions(nodeModulesPath)
          if (resolved) return resolved
        }
      } catch (e) {
        console.log(e)
      }

    }

    // Ostateczna próba przez require.resolve
    try {
      const resolved = require.resolve(dep, { paths })
      if (fs.existsSync(resolved)) {
        return resolved
      }
      throw new Error(`Plik ${resolved} nie istnieje po rozwiązaniu przez require.resolve`)
    } catch (err) {
      throw new Error(`Nie udało się rozwiązać zależności: ${dep}. ${err.message}`)
    }
  } catch (e) {
    console.log(e)
  }
}

function resolveWithExtensions (candidate) {
  // Dokładny plik
  try {
    if (fs.existsSync(candidate)) {
      const stat = fs.statSync(candidate)
      if (stat.isFile()) return candidate
      if (stat.isDirectory()) {
        for (const ext of TS_EXTENSIONS) {
          const idx = path.join(candidate, 'index' + ext)
          if (fs.existsSync(idx)) return idx
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}
