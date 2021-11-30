import { describe } from '@asdgf/core';
import assert from 'assert';
import path from 'path';
import fs from 'fs';

import { customElementsManifestToMarkdown } from '../index.js';

import { normalize } from '../lib/serialize.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
let mainTestCases = fs.readdirSync(fixturesDir).filter((dir) => dir !== 'output-options');
const outputOptionsFixturesDir = path.join(process.cwd(), 'fixtures/output-options');
const outputOptionsTestCases = fs.readdirSync(outputOptionsFixturesDir, { withFileTypes: true })
.filter(dir => dir.isDirectory())
.map(dir => dir.name);

const MAIN_TEST_CASE_OPTIONS = {
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

const OUTPUT_OPTIONS_TESTS_OPTIONS = {
  'no-heading': { omitSections: ['main-heading'] },
  'class-name-filter': { classNameFilter: 'My*' },
  'no-attributes': { omitSections: ['attributes'] },
  'no-cssparts': { omitSections: ['css-parts'] },
  'no-cssproperties': { omitSections: ['css-properties'] },
  'no-events': { omitSections: ['events'] },
  'no-exports': { omitDeclarations: ['exports']},
  'no-fields': { omitSections: ['fields'] },
  'no-functions': { omitDeclarations: ['functions'] },
  'no-methods': { omitSections: ['methods'] },
  'no-mixins': { omitDeclarations: ['mixins'], omitSections: ['mixins'] },
  'no-slots': { omitSections: ['slots'] },
  'no-staticfields': { omitSections: ['static-fields'] },
  'no-staticmethods': { omitSections: ['static-methods'] },
  'no-superclass': { omitSections: ['super-class'] },
  'no-variables': { omitDeclarations: ['variables'] },
};

describe('', ({it}) => {
  mainTestCases.forEach(testCase => {
    it(`Testcase ${testCase}`, async () => {
      const manifestPath = path.join(fixturesDir, `${testCase}/custom-elements.json`);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const outputPath = path.join(fixturesDir, `${testCase}/README.md`);
      const expectPath = path.join(fixturesDir, `${testCase}/EXPECTED.md`);
  
      const { description, ...options } = MAIN_TEST_CASE_OPTIONS[testCase] ?? {}
  
      const output = customElementsManifestToMarkdown(manifest, options);
  
      const expected = fs.readFileSync(expectPath, 'utf8');
  
      fs.writeFileSync(outputPath, output, 'utf8');
  
      assert.equal(normalize(output), normalize(expected), description);
    });
  });
  
  outputOptionsTestCases.forEach(testCase => {
    it(`Testcase ${testCase}`, async () => {
      const manifestPath = path.join(outputOptionsFixturesDir, `/custom-elements.json`);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const outputPath = path.join(outputOptionsFixturesDir, `${testCase}/README.md`);
      const expectPath = path.join(outputOptionsFixturesDir, `${testCase}/EXPECTED.md`);
  
      const { description, ...options } = OUTPUT_OPTIONS_TESTS_OPTIONS[testCase] ?? {}
  
      const output = customElementsManifestToMarkdown(manifest, options);
  
      const expected = fs.readFileSync(expectPath, 'utf8');
  
      fs.writeFileSync(outputPath, output, 'utf8');
  
      assert.equal(normalize(output), normalize(expected), description);
    });
  });
});
