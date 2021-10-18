# find-dependencies

Given an array of paths, scans all modules and returns all depending paths.

Intended to be used on post-build, frontend facing, ESM based code.

## Usage

```js
const inputPaths = ['my-package/index.js'];
```

Where `my-package/index.js` contains:

```js
import '@scoped/package';
import {b} from '@scoped/package/baz/index.js';
import c from 'export-map';
import d from 'nested';
import e from 'regular';
import g from './bla.js';
import('dynamic-import');
```

```js
const inputPaths = ['my-package/index.js'];
const dependencies = await findDependencies(inputPaths);
```

Will output:

```js
[
  '/users/blank/my-package/node_modules/@scoped/package/index.js',
  '/users/blank/my-package/node_modules/@scoped/package/baz/index.js',
  '/users/blank/my-package/node_modules/export-map/long/path/index.js',
  '/users/blank/my-package/node_modules/nested/index.js',
  '/users/blank/my-package/node_modules/regular/index.js',
  '/users/blank/my-package/node_modules/dynamic-import/index.js',
  '/users/blank/my-package/node_modules/nested/node_modules/regular/index.js'
]
```

## Configuration

```js
export interface Options {
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