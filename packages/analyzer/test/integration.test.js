import { test } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import { pathToFileURL } from 'url';
import fs from 'fs';
import globby from 'globby';
import ts from 'typescript';

import { create } from '../src/create.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
let testCases = fs.readdirSync(fixturesDir);

const runSingle = testCases.find(_case => _case.startsWith('+'));
if (runSingle) {
  testCases = [runSingle];
}

testCases.forEach(testCase => {
  test(`Testcase ${testCase}`, async () => {
    // skips tests
    if (testCase.startsWith('-')) {
      assert.equal(true, true);
      return;
    }

    const fixturePath = path.join(fixturesDir, `${testCase}/fixture/custom-elements.json`);
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

    const packagePath = path.join(fixturesDir, `${testCase}/package`);
    const packagePathPosix = packagePath.split(path.sep).join(path.posix.sep);
    const outputPath = path.join(fixturesDir, `${testCase}/output.json`);

    const globs = await globby(packagePathPosix);
    const modules = globs
      .filter(path => !path.includes('custom-elements-manifest.config.js'))
      .map(glob => {
        const relativeModulePath = `.${path.sep}${path.relative(process.cwd(), glob)}`;
        const source = fs.readFileSync(relativeModulePath).toString();
    
        return ts.createSourceFile(
          relativeModulePath,
          source,
          ts.ScriptTarget.ES2015,
          true,
        );
      });

    let plugins = [];
    const manifestPathFileURL = pathToFileURL(`${packagePath}/custom-elements-manifest.config.js`).href;
    try {
      const config = await import(manifestPathFileURL);
      plugins = [...config.default.plugins];
    } catch {}
    
    const result = create({modules, plugins});

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    assert.equal(result, fixture);
  });
});

test.run();