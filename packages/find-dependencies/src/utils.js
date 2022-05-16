import path from 'path';

/**
 * @param {string} p 
 * @returns {string}
 */
const toUnix = p => p.replace(/\\/g, '/');

/**
 * @param {string} specifier
 * @returns {boolean}
 */
export function isBareModuleSpecifier(specifier) {
  return !!specifier?.replace(/'/g, '')[0].match(/[@a-zA-Z]/g);
}

/**
 * @param {string} specifier
 * @returns {boolean}
 */
export function isScopedPackage(specifier) {
  return specifier.startsWith('@');
}

/**
 * 
 * @param {string} specifier 
 * @returns {string}
 */
export function extractPackageNameFromSpecifier(specifier) {
  specifier = toUnix(specifier);
  if(isScopedPackage(specifier)) {
    /**
     * @example '@foo/bar'
     * @example '@foo/bar/baz.js'
     */
    const split = specifier.split('/');
    return [split[0], split[1]].join('/');
  } else {
    /**
     * @example 'foo'
     * @example 'foo/bar/baz.js'
     */
    return specifier.split('/')[0];
  }
}

/**
 * Takes a path, returns some split-up information about the path
 * @example 
 * ```
 * '/Users/blank/custom-elements-manifest/packages/analyzer/node_modules/foo/node_modules/nested/index.js'
 * ```
 * 
 * returns:
 * ```
 * {
 *  packageRoot: '/Users/blank/custom-elements-manifest/packages/analyzer/node_modules/foo/node_modules/nested',
 *  packageName: 'nested',
 *  specifier: 'nested/index.js',
 *  type: 'js'
 * }
 * ```
 * 
 * @param {string} path
 * @returns {{
 *  packageRoot: string,
 *  packageName: string,
 *  specifier: string,
 *  type: 'js' | 'json' | 'css'
 * }}
 */
export function splitPath(path) {
  const unixPath = toUnix(path);
  const position = unixPath.lastIndexOf('node_modules/');
  const packageRootMinusSpecifier = unixPath.substring(0, position + 'node_modules/'.length);

  const specifier = unixPath.substring(position + 'node_modules/'.length, unixPath.length)
  const packageName = extractPackageNameFromSpecifier(specifier);

  const packageRoot = packageRootMinusSpecifier + packageName;
  
  /** @type {'js' | 'json' | 'css'} */
  let type;
  if(specifier.endsWith('js')) {
    type = 'js'
  } else if (specifier.endsWith('json')) {
    type = 'json'
  } else if (specifier.endsWith('css')) {
    type = 'css'
  }

  return {
    packageRoot,
    packageName,
    specifier,
    type
  }
}

/**
 * @param {string[]} paths
 * @returns {string[]}
 */
export function getUniquePackages(paths) {
  const unique = new Set();
  paths.forEach(pkg => {
    const { packageName } = splitPath(pkg);
    unique.add(packageName);
  });
  return [...unique];
}
