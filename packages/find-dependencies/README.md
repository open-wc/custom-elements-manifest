# find-dependencies

Given an array of paths, scans all modules and returns all depending paths.

Intended to be used on post-build, frontend facing, ESM based code.

## Usage

```js
import { findDependencies } from '@custom-elements-manifest/find-dependencies';

const inputPaths = ['my-package/index.ts'];
const dependencies = await findDependencies(inputPaths);
```

Where `my-package/index.ts` contains:

```js
import '@scoped/package';
import {b} from '@scoped/package/baz/index.ts';
import c from 'export-map';
import d from 'nested';
import e from 'regular';
import g from './bla.js';
import('dynamic-import');
```

Will output:

```js
[
  '/Users/blank/my-package/node_modules/@scoped/package/index.ts',
  '/Users/blank/my-package/node_modules/@scoped/package/baz/index.ts',
  '/Users/blank/my-package/node_modules/export-map/long/path/index.ts',
  '/Users/blank/my-package/node_modules/nested/index.ts',
  '/Users/blank/my-package/node_modules/regular/index.ts',
  '/Users/blank/my-package/node_modules/dynamic-import/index.ts',
  '/Users/blank/my-package/node_modules/nested/node_modules/regular/index.ts'
]
```

## Configuration

```ts
interface Options {
  /** 
   * In case `node_modules` is higher up in the file tree, for example in a monorepo
   * Defaults to 3 
   */
  nodeModulesDepth?: number,
  /** Defaults to `process.cwd()` */
  basePath?: string
}
```

```js
findDependencies(inputPaths, {
  basePath: 'foo/bar',
  nodeModulesDepth: 5,
});
```

## Utils

```js
import { 
  splitPath, 
  getUniquePackages, 
  extractPackageNameFromSpecifier, 
  isBareModuleSpecifier, 
  isScopedPackage 
} from '@custom-elements-manifest/find-dependencies';
```


### `splitPath`
```js
splitPath('/blank/node_modules/foo/index.ts');
// {packageRoot: '/blank/node_modules/foo', packageName: 'foo', specifier: 'foo/index.ts', type: 'js' }

splitPath('/blank/node_modules/foo/data.json');
// {packageRoot: '/blank/node_modules/foo', packageName: 'foo', specifier: 'foo/data.json', type: 'json' }
```

### `extractPackageNameFromSpecifier`
```js
extractPackageNameFromSpecifier('foo/index.ts') // foo
extractPackageNameFromSpecifier('foo/bar/baz/index.ts') // foo
extractPackageNameFromSpecifier('@foo/bar/index.ts') // @foo/bar
extractPackageNameFromSpecifier('@foo/bar/baz/asdgf/index.ts') // @foo/bar
```
### `isBareModuleSpecifier`
```js
isBareModuleSpecifier('foo') // true
isBareModuleSpecifier('foo/bar.js') // true
isBareModuleSpecifier('./foo.js') // false
isBareModuleSpecifier('../foo.js') // false
```
### `isScopedPackage`
```js
isScopedPackage('foo') // false
isScopedPackage('@foo/bar') // true
```

### `getUniquePackages`
```js
getUniquePackages([
  'blank/node_modules/foo/index.ts', 
  'blank/node_modules/bar/index.ts',
  'blank/node_modules/bar/index2.js',
  'blank/node_modules/bar/index3.js'
])
// ['foo', 'bar',]

/** Or */
const dependencies = await findDependencies(inputPaths);
const unique = getUniquePackages(dependencies);
```