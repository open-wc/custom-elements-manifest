import { describe } from '@asdgf/core';
import assert from 'assert';
import path from 'path';
import fs from 'fs';

import { customElementsManifestToMarkdown } from '../index.js';

import { normalize } from '../lib/serialize.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
let testCases = fs.readdirSync(fixturesDir);

const OPTIONS = {
    'heading-offset-2': { headingOffset: 2 },
    'hide-private': { private: 'hidden' },
    'details-private': { private: 'details' },
    'export-kinds': {
      exportKinds: {
        'js': 'JavaScript',
        'custom-element-definition': { url: 'https://raw.githubusercontent.com/webcomponents/webcomponents.org/master/client/assets/logo.svg' }
      }
    }
};

describe('to-markdown', ({it}) => {
  testCases.forEach(testCase => {
    it(testCase, async () => {
      const manifestPath = path.join(fixturesDir, `${testCase}/custom-elements.json`);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const outputPath = path.join(fixturesDir, `${testCase}/README.md`);
      const expectPath = path.join(fixturesDir, `${testCase}/EXPECTED.md`);
  
      const { description, ...options } = OPTIONS[testCase] ?? {}
  
      const output = customElementsManifestToMarkdown(manifest, options);
  
      const expected = fs.readFileSync(expectPath, 'utf8');
  
      fs.writeFileSync(outputPath, output, 'utf8');
  
      assert.equal(normalize(output), normalize(expected), description);
    });
  });
});
