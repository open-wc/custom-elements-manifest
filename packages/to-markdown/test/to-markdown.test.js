import { test } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import fs from 'fs';

import { customElementsManifestToMarkdown } from '../index.js';

import { normalize } from '../lib/serialize.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
let testCases = fs.readdirSync(fixturesDir);

testCases.forEach(testCase => {
  test(`Testcase ${testCase}`, async () => {
    const manifestPath = path.join(fixturesDir, `${testCase}/custom-elements.json`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const outputPath = path.join(fixturesDir, `${testCase}/README.md`);
    const expectPath = path.join(fixturesDir, `${testCase}/EXPECTED.md`);

    // TODO: do this bettere
    const options =
        testCase === 'heading-offset-2' ? { headingOffset: 2 }
      : undefined;

    const output = customElementsManifestToMarkdown(manifest, options);

    const expected = fs.readFileSync(expectPath, 'utf8');

    fs.writeFileSync(outputPath, output, 'utf8');

    assert.equal(
      normalize(output),
      normalize(expected)
    );
  });
});

test.run();
