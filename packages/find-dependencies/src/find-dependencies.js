import path from 'path'
import { builtinModules } from 'module'
import rsModuleLexer from 'rs-module-lexer'

import {
  getFileNameWithSource,
} from './utils.js'
import { ResolverFactory } from 'oxc-resolver'

const resolver = new ResolverFactory({
  // TODO consider how to handle alias: {},
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.d.ts', ''],
  extensionAlias: {
    '.js': ['.ts', '.js'],
    '.jsx': ['.tsx', '.jsx']
  },
  // Odpowiada resolve.mainFiles
  mainFiles: ['index'],
  // Odpowiada resolve.mainFields
  mainFields: ['module', 'browser', 'main'],
  // Odpowiada resolve.conditionNames
  conditionNames: ['import', 'require', 'node'],
  // Odpowiada resolve.descriptionFiles
  descriptionFiles: ['package.json'],
  // Odpowiada resolve.exportsFields
  exportsFields: ['exports'],
  // Odpowiada resolve.alias (jeśli masz aliasy, dodaj je tutaj)
  alias: {
    // 'my-alias': path.resolve(__dirname, '../src/my-alias')
  },
  // Odpowiada resolve.symlinks
  symlinks: true,
  // Odpowiada resolve.modules
  modules: ['node_modules']
})

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
  if (!Array.isArray(paths) || paths.length===0) {
    throw new Error('paths must be a non-empty array')
  }

  const importsToScan = new Set()
  const dependencies = new Set()

  const basePath = options?.basePath ?? process.cwd()
  const absoluteBasePath = path.isAbsolute(basePath) ? basePath : path.resolve(basePath)

  const input = paths.map(filePath => getFileNameWithSource(filePath))

  for (const fileData of input) {
    const { output } = await rsModuleLexer.parseAsync({ input: [fileData] })
    output.forEach(result => {
      result.imports?.forEach(i => {
        /** Skip built-in modules like fs, path, etc */
        if (builtinModules.includes(i.n)) return
        try {
          const pathToDependency = resolveDependencyPath(absoluteBasePath, i.n)

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
            const pathToDependency = resolveDependencyPath(baseDir, i.n)

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
 * @param absoluteBasePath
 * @param dependency
 * @returns {string}
 */
export function resolveDependencyPath (absoluteBasePath, dependency) {
  const result = resolver.sync(absoluteBasePath, dependency)
  if (!result || !result.path) {
    console.log(`Cannot resolve '${dependency}' from '${absoluteBasePath}'`)
  }
  return result.path
}
