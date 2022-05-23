import fs from 'fs';
import path from 'path';

/**
 * @param {string} p
 * @returns {string}
 */
const toUnix = p => p.replace(/\\/g, '/');

/**
 * @param {number} depth
 * @param {{ cwd:string }} [opts]
 * @returns {string[]}
 */
 export function traverseUp(depth, { cwd = process.cwd() }) {
  return Array(depth).fill().map((_, i) => path.join(cwd, ...Array(i).fill('..')));
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

const memoize = (fn, cache = {}) => (x) => (x in cache && cache[x]) || (cache[x] = fn(x));

const getPackageRootAndName = memoize((potentialRoot) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(`${potentialRoot}/package.json`, 'utf8'));
    return {
      packageName: pkg.name,
      packageRoot: potentialRoot,
    };
  } catch {}
  return null;
});

const splitPathForResolvedSymlinks = memoize((unixPath) => {
  // Given ['','path','to','monorepo','pkg','src'], iterate till /path/to/monorepo/pkg is found
  const parts = path.dirname(unixPath).split(path.sep);
  for (let i = 0; i < parts.length; i += 1) {
    const consideredParts = i > 0 ? parts.slice(0, -i) : parts;
    const potentialRoot = consideredParts.join(path.sep);
    const packageOutput = getPackageRootAndName(potentialRoot);
    if (packageOutput) {
      return {
        ...packageOutput,
        specifier: `${parts.slice(i)}/${path.basename(unixPath)}`,
        type: path.extname(unixPath),
      };
    }
  }
  throw new Error(`No package found in parent hierarchy of path ${unixPath}`);
});


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
 * @param {string} fullPath For instance '/path/to/monorepo/pkg/src/mainEntry.js'
 * @returns {{
 *  packageRoot: string,
 *  packageName: string,
 *  specifier: string,
 *  type: 'js' | 'json' | 'css'
 * }}
 */
export function splitPath(fullPath) {
  const unixPath = toUnix(fullPath);
  const position = unixPath.lastIndexOf('node_modules/');

  if (position === -1) {
    // When we are not in node_modules, we deal with resolved symlinks in a monorepo
    return splitPathForResolvedSymlinks(unixPath);
  }

  const packageRootMinusSpecifier = unixPath.substring(0, position + 'node_modules/'.length);

  const specifier = unixPath.substring(position + 'node_modules/'.length, unixPath.length);
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