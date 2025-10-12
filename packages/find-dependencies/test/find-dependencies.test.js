import { describe } from '@asdgf/cli'
import { globby } from 'globby'
import assert from 'assert'

import { findDependencies, resolveDependencyPath } from '../src/find-dependencies.js'
import { toPosix } from '../src/utils.js'

describe('find-dependencies', ({ it }) => {
  it('finds dependencies for monorepo setup', async () => {
    const globs = await globby(['fixtures/monorepo/packages/my-package/*.js'])
    let dependencies = await findDependencies(globs, { basePath: 'fixtures/monorepo/packages/my-package' })
    dependencies = dependencies
    .map(d => d.split('fixtures')[1])
    .map(d => toPosix(d))
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
        '/monorepo/packages/my-package/bla.js',
        '/monorepo/packages/my-package/node_modules/nested/node_modules/regular/index.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/a.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/b.js',
        '/monorepo/packages/my-package/node_modules/internal-shared/c.js'
      ]
    )
  })

  it('finds dependencies for regular setup', async () => {
    const globs = await globby(['fixtures/regular/index.js'])
    let dependencies = await findDependencies(globs, { basePath: 'fixtures/regular' })
    dependencies = dependencies
    .map(d => d.split('fixtures')[1])
    .map(d => toPosix(d))

    assert.deepEqual(dependencies,
      [
        '/regular/node_modules/foo/index.js',
        '/regular/internal.js',
        '/regular/node_modules/bar/index.js'
      ]
    )
  })
  it('finds dependencies for regular-react setup with jsx, ts, tsx', async () => {
    const globs = await globby(['fixtures/regular-react/index.ts'])
    let dependencies = await findDependencies(globs, { basePath: 'fixtures/regular-react' })
    dependencies = dependencies
    .map(d => d.split('fixtures')[1])
    .map(d => toPosix(d))

    assert.deepEqual(dependencies,
      [
        '/regular-react/node_modules/foo/index.js',
        '/regular-react/internal-ts.ts',
        '/regular-react/internal-jsx.jsx',
        '/regular-react/internal-tsx.tsx',
        '/regular-react/node_modules/bar/index.js'
      ]
    )
  })
  it('resolves .ts, directory index.* and .d.ts without specifying extensions', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-'))
    const dir = path.join(tmp, 'pkg')
    fs.mkdirSync(dir, { recursive: true })

    const main = path.join(dir, 'main.ts')
    const foo = path.join(dir, 'foo.ts')
    const dts = path.join(dir, 'types.d.ts')
    const subDir = path.join(dir, 'dir')
    const subIndex = path.join(subDir, 'index.ts')

    fs.mkdirSync(subDir, { recursive: true })
    fs.writeFileSync(main, 'export {}')
    fs.writeFileSync(foo, 'export const x = 1;')
    fs.writeFileSync(subIndex, 'export const y = 2;')
    fs.writeFileSync(dts, 'declare const z: number; export {};')

    const fooResolved = resolveDependencyPath('./foo', main)
    const dirResolved = resolveDependencyPath('./dir', main)
    const dtsResolved = resolveDependencyPath('./types', main)

    assert.equal(path.normalize(fooResolved), path.normalize(foo))
    assert.equal(path.normalize(dirResolved), path.normalize(subIndex))
    assert.equal(path.normalize(dtsResolved), path.normalize(dts))
  })
})
