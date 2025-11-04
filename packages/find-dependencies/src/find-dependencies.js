import path from 'path'
import { builtinModules } from 'module'
import rsModuleLexer from 'rs-module-lexer'

import {
  getFileNameWithSource,
} from './utils.js'
import { ResolverFactory } from 'oxc-resolver'

/**
 * @typedef {import('oxc-resolver').NapiResolveOptions} NapiResolveOptions
 */

/**
 *
 * @type {NapiResolveOptions}
 */
const DEFAULT_RESOLUTION_OPTIONS = {
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.d.ts', ''],
  extensionAlias: {
    '.js': ['.ts', '.js'],
    '.jsx': ['.tsx', '.jsx']
  },
  mainFiles: ['index'],
  mainFields: ['module', 'browser', 'main'],
  conditionNames: ['import', 'require', 'node'],
  exportsFields: ['exports'],
  alias: {},
  symlinks: true,
  modules: ['node_modules']
}



/**
 * Find all dependencies of the given file paths
 * @param {string[]} paths - Array of file paths to analyze
 * @param {{
 *  basePath?: string,
 *  resolutionOptions?: NapiResolveOptions
 * }} options - Options object
 * @returns {Promise<string[]>} Array of dependency paths
 */
export async function findDependencies (paths, options = {}) {
  if (!Array.isArray(paths) || paths.length===0) {
    throw new Error('paths must be a non-empty array')
  }

  const importsToScan = new Set()
  const dependencies = new Set()

  const basePath = options?.basePath ?? process.cwd()
  const absoluteBasePath = path.isAbsolute(basePath) ? basePath : path.resolve(basePath)
  const resolver = new ResolverFactory({ ...DEFAULT_RESOLUTION_OPTIONS, ...(options?.resolutionOptions ?? {}) });

  const input = paths.map(filePath => getFileNameWithSource(filePath))

  for (const fileData of input) {
    const { output } = await rsModuleLexer.parseAsync({ input: [fileData] })
    output.forEach(result => {
      result.imports?.forEach(i => {
        /** Skip built-in modules like fs, path, etc */
        if (builtinModules.includes(i.n)) return
        try {
          const pathToDependency = resolveImport(resolver,absoluteBasePath, i.n)

          if (pathToDependency) {
            importsToScan.add(pathToDependency)
            dependencies.add(pathToDependency)
          }
        } catch (error) {
          console.log(`Failed to resolve dependency "${i.n}": ${error.message}`)
        }
      })
    })
  }

  while (importsToScan.size) {
    for (const dep of importsToScan) {
      importsToScan.delete(dep)
      if (!dep || typeof dep!=='string') {
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
            const baseDir = path.dirname(dep)
            const pathToDependency = resolveImport(resolver,baseDir, i.n)

            /**
             * Don't add dependencies we've already scanned, also avoids circular dependencies
             * and multiple modules importing from the same module
             */
            if (pathToDependency && !dependencies.has(pathToDependency)) {
              importsToScan.add(pathToDependency)
              dependencies.add(pathToDependency)
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
 *
 * @param resolver
 * @param absoluteBasePath
 * @param dependency
 * @returns {string}
 */
export function resolveImport (resolver, absoluteBasePath, dependency) {
  const result = resolver.sync(absoluteBasePath, dependency)
  if (!result || !result.path) {
    console.log(`Cannot resolve '${dependency}' from '${absoluteBasePath}'`)
  }
  return result.path
}
