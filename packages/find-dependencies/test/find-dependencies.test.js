import { describe } from '@asdgf/cli';
import { globby } from 'globby';
import assert from 'assert';

import { findDependencies } from '../src/find-dependencies.js';

describe('find-dependencies', ({it}) => {
  it('finds dependencies for monorepo setup', async () => {
    const globs = await globby(['fixtures/monorepo/packages/my-package/*.js']);
    let dependencies = await findDependencies(globs, { basePath: 'fixtures/monorepo/packages/my-package' });
    dependencies = dependencies.map(d => d.split('fixtures')[1]);

    assert.deepEqual(dependencies,
      [
        '/monorepo/packages/my-package/node_modules/@scoped/package/index.js',
        '/monorepo/packages/my-package/node_modules/@scoped/package/baz/index.js',
        '/monorepo/packages/my-package/node_modules/export-map/long/path/index.js',
        '/monorepo/packages/my-package/node_modules/nested/index.js',
        '/monorepo/packages/my-package/node_modules/regular/index.js',
        '/monorepo/node_modules/monorepo-dep/index.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/index.js',
        '/monorepo/packages/my-package/node_modules/dynamic-import/index.js',
        '/monorepo/packages/my-package/node_modules/nested/node_modules/regular/index.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/a.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/b.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/c.js'
      ]
    )
  });

  it('finds dependencies for regular setup', async () => {
    const globs = await globby(['fixtures/regular/*.js']);
    let dependencies = await findDependencies(globs, { basePath: 'fixtures/regular' });
    dependencies = dependencies.map(d => d.split('fixtures')[1]);

    assert.deepEqual(dependencies,
      [ 
        '/regular/node_modules/bar/index.js',
        '/regular/node_modules/foo/index.js'
      ]
    )
  });
});