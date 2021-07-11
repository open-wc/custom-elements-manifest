import { test } from 'uvu';
import * as assert from 'uvu/assert';

import ts from 'typescript';

import { readmePlugin } from '../index.js';
import { create } from '@custom-elements-manifest/analyzer/src/create.js';
import { readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(new URL(import.meta.url)));

const read = path => readFileSync(path, 'utf8');

const casesDir = join(__dirname, 'cases');

const OPTIONS = {

  'header-and-footer': {
    description: 'Writes README with header, footer, private API in details, and heading offset',
    header: 'README.head.md',
    footer: 'README.foot.md',
    private: 'details',
  },

  'header-only': {
    description: 'Writes README with header and private API',
    private: 'all',
    header: 'README.head.md',
  },

  'footer-only': {
    description: 'Writes README with footer, omitting private API',
    private: 'hidden',
    footer: 'README.foot.md',
  },

  'default-options': {
    description: 'Writes README using default options'
  },

  'custom-kinds': {
    description: 'Replaces export kinds with custom options',
    exportKinds: {
      'custom-element-definition': { url: 'https://raw.githubusercontent.com/webcomponents/webcomponents.org/master/client/assets/logo.svg' },
      'js': 'JavaScript',
    }
  }
};

readdirSync(casesDir).forEach(testCase => {
  test(`readmePlugin ${testCase}`, function() {
    const input = join(casesDir, testCase, 'fixture', 'my-element.js');
    const from = join(casesDir, testCase, 'fixture');
    const to = join('..', 'out', 'README.md');
    const expectedPath = join(from, '..', 'expected', 'README.md')
    const actualPath = join(from, to);

    const source = read(input);

    const { description, ...options } = OPTIONS[testCase] ?? {};

    const customElementsManifest = create({
      modules: [ts.createSourceFile(
        join('./fixture', 'my-element.js'),
        source,
        ts.ScriptTarget.ES2015,
        true
      )],
      plugins: [readmePlugin({ from, to, ...options })],
    });

    assert.equal(read(actualPath), read(expectedPath), description);
  });
});

test.run();
