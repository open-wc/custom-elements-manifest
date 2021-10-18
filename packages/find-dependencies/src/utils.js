import path from 'path';

/**
 * @param {number} depth 
 * @returns {string[]}
 */
export function traverseUp(depth) {
  return Array(depth).fill().map((_, i) => path.join(process.cwd(), ...Array(i).fill('..')));
}

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
 *  specifier: 'nested/index.js'
 * }
 * ```
 * 
 * @param {string} path
 * @returns {{
 *  packageRoot: string,
 *  packageName: string,
 *  specifier: string
 * }}
 */
export function splitPath(path) {
  const position = path.lastIndexOf('node_modules/');
  const packageRootMinusSpecifier = path.substring(0, position + 'node_modules/'.length);

  const specifier = path.substring(position + 'node_modules/'.length, path.length)
  const packageName = extractPackageNameFromSpecifier(specifier);

  const packageRoot = packageRootMinusSpecifier + packageName;

  return {
    packageRoot,
    packageName,
    specifier
  }
}