import { test } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import fs from 'fs';
import * as child_process from 'child_process';
import { promisify } from 'util'

const exec = promisify(child_process.exec);

const fixturesDir = path.join(process.cwd(), 'fixtures');
let testCases = fs.readdirSync(fixturesDir).filter(x => x.startsWith('cli-'));

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

    const fixturePath = path.join(fixturesDir, testCase, 'fixture');
    const fixture = JSON.parse(fs.readFileSync(path.join(fixturePath, 'custom-elements.json'), 'utf-8'));

    const packagePath = path.join(fixturesDir, testCase, 'package');

    const outputPath = path.join(fixturesDir, testCase);

    try {
      const { stdout, stderr } = await exec('node ../../../index.js analyze --readme --outdir ..', { cwd: packagePath });
      console.log(stdout)
      if (stderr)
        throw new Error(stderr);
    } catch (e) {
      console.error(e); // should contain code (exit code) and signal (that caused the termination).
    }

    const result = JSON.parse(fs.readFileSync(path.join(outputPath, 'custom-elements.json'), 'utf-8'));

    assert.equal(result, fixture);

    if (testCase.includes('readme')) {
      assert.equal(
        fs.readFileSync(path.join(outputPath, 'README.md'), 'utf8'),
        fs.readFileSync(path.join(fixturePath, 'README.md'), 'utf8'),
      );
    }
  });
});

test.run();
