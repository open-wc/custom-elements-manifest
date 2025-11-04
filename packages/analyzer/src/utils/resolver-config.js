/**
 * @typedef {import('oxc-resolver').NapiResolveOptions} NapiResolveOptions
 */

/**
 * Default resolution options for oxc-resolver
 * @type {NapiResolveOptions}
 */
export const DEFAULT_RESOLUTION_OPTIONS = {
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
 * Merge user provided resolution options with defaults
 * @param {Partial<NapiResolveOptions>} userOptions - User config resolution options
 * @param {Partial<NapiResolveOptions>} cliOptions - CLI resolution options
 * @returns {NapiResolveOptions}
 */
export function mergeResolutionOptions (userOptions, cliOptions) {
  // Priority: CLI > user config > defaults
  const merged = {
    ...DEFAULT_RESOLUTION_OPTIONS,
    ...(userOptions || {}),
    ...(cliOptions || {})
  }

  // Handle special merging for extensionAlias
  if (userOptions?.extensionAlias || cliOptions?.extensionAlias) {
    merged.extensionAlias = {
      ...DEFAULT_RESOLUTION_OPTIONS.extensionAlias,
      ...(userOptions?.extensionAlias || {}),
      ...(cliOptions?.extensionAlias || {})
    }
  }

  return merged
}
