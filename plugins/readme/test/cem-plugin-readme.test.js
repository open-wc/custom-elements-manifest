import { test } from 'uvu';
import * as assert from 'uvu/assert';

import ts from 'typescript';

import { readmePlugin } from '../index.js';
import { create } from '@custom-elements-manifest/analyzer/src/create.js';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const getRelative = path => resolve(fileURLToPath(new URL(path, import.meta.url)));
const read = path => readFileSync(getRelative(path), 'utf8');

test('readmePlugin', function() {
  const path = './fixture/my-element.js';
  const source = read(path);

  const customElementsManifest = create({
    modules: [ts.createSourceFile(path, source, ts.ScriptTarget.ES2015, true)],
    plugins: [readmePlugin({
      from: getRelative('./fixture'),
      to: '../out/README.md',
      header: 'README.head.md',
      footer: 'README.foot.md',
      private: 'details',
    })],
  });


  assert.equal(
    read('./EXPECTED.md'),
    read('./out/README.md'),
    'Writes README with header, footer, private API in details, and heading offset'
  );
});

test.run();
