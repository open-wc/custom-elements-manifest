import { test } from 'uvu';
import * as assert from 'uvu/assert';
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
  'no-heading': { mainHeading: false },
  'class-name-filter': { classNameFilter: 'My*' },
  'no-attributes': { attributes: false },
  'no-cssparts': { cssParts: false },
  'no-cssproperties': { cssProperties: false },
  'no-events': { events: false },
  'no-exports': { exports: false },
  'no-fields': { fields: false },
  'no-functions': { functions: false },
  'no-methods': { methods: false },
  'no-mixins': { mixins: false },
  'no-slots': { slots: false },
  'no-staticfields': { staticFields: false },
  'no-staticmethods': { staticMethods: false },
  'no-superclass': { superClass: false },
  'no-variables': { variables: false },
};

mainTestCases.forEach(testCase => {
  test(`Testcase ${testCase}`, async () => {
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
  test(`Testcase ${testCase}`, async () => {
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

test.run();
