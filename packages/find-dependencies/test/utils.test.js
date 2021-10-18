import { describe } from '@asdgf/cli';
import assert from 'assert';

import { 
  isBareModuleSpecifier, 
  isScopedPackage, 
  getUniquePackages,
  splitPath
} from '../src/utils.js';

describe('utils', () => {
  describe('isBareModuleSpecifier', ({it}) => {
    ['./foo', './foo.js', '../foo', '../foo.js'].forEach((specifier) => {
      it(`case "${specifier}" is false`, () => {
        assert(!isBareModuleSpecifier(specifier));
      });
    });

    ['foo', '@foo/bar'].forEach((specifier) => {
      it(`case "${specifier}" is true`, () => {
        assert(isBareModuleSpecifier(specifier));
      });
    });
  });

  describe('getUniquePackages', ({it}) => {
    it('gets unique packages', () => {
      assert.deepEqual(
        getUniquePackages([
          'blank/node_modules/foo/index.js', 
          'blank/node_modules/bar/index.js',
          'blank/node_modules/bar/index2.js'
        ]),
        ['foo', 'bar',]
      )
    });
  });

  describe('isScopedPackage', ({it}) => {
    it('is scoped package', () => {
      assert(isScopedPackage('@foo/bar'));
    });

    it('is not scoped package', () => {
      assert(!isScopedPackage('foo'));
    });
  });

  describe('splitPath', ({it}) => {
    [
      {
        path: '/long/mock/path/node_modules/@foo/bar/index.js', 
        packageRoot: '/long/mock/path/node_modules/@foo/bar', 
        packageName: '@foo/bar', 
        specifier: '@foo/bar/index.js'
      },
      {
        path: '/long/mock/path/node_modules/bar/index.js', 
        packageRoot: '/long/mock/path/node_modules/bar', 
        packageName: 'bar', 
        specifier: 'bar/index.js'
      },
      {
        path: '/long/mock/path/node_modules/@foo/bar/baz/asd.js', 
        packageRoot: '/long/mock/path/node_modules/@foo/bar', 
        packageName: '@foo/bar', 
        specifier: '@foo/bar/baz/asd.js'
      },
      {
        path: '/long/mock/path/node_modules/foo/index.js', 
        packageRoot: '/long/mock/path/node_modules/foo', 
        packageName: 'foo', 
        specifier: 'foo/index.js'
      },
    ].forEach((test) => {
      it(`case "${test.path}"`, () => {
        const { packageRoot, packageName, specifier } = splitPath(test.path);
        assert.equal(packageRoot, test.packageRoot);
        assert.equal(packageName, test.packageName);
        assert.equal(specifier, test.specifier);
      });
    });
  });
});