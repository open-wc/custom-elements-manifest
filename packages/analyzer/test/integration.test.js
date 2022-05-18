import { describe } from '@asdgf/cli';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { cli } from '../cli.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');

let groups = fs.readdirSync(fixturesDir);
const singleGroup = groups.find((_case) => _case.startsWith('+'));
if (singleGroup) {
  groups = [singleGroup];
}

for (const group of groups) {
  for (const test of fs.readdirSync(path.join(fixturesDir, group))) {
    if (test.startsWith('+')) {
      groups = [group];
      break;
    }
  }
}

let testCases = [];
describe('@CEM/A', ({ it }) => {
  for (const group of groups) {
    testCases = fs
      .readdirSync(path.join(fixturesDir, group))
      .map((test) => ({ group, test, relPath: path.join(group, test) }));
    const runSingle = testCases.find((_case) => _case.test.startsWith('+'));
    if (runSingle) {
      testCases = [runSingle];
    }

    describe(group, ({ it }) => {
      testCases.forEach((testCase) => {
        if (testCase.test.startsWith('-')) {
          it.skip(`Testcase ${testCase.test}`, () => {});
        } else {
          it(`Testcase ${testCase.test}`, async () => {
            const fixturePath = path.join(
              fixturesDir,
              `${testCase.relPath}/fixture/custom-elements.json`,
            );
            const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

            const packagePath = path.join(fixturesDir, `${testCase.relPath}/package`);
            const packagePathPosix = packagePath.split(path.sep).join(path.posix.sep);
            const result = await cli({ argv: ['analyze', '--dependencies'], cwd: packagePathPosix, noWrite: true });

            const outputPath = path.join(fixturesDir, `${testCase.relPath}/output.json`);
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            assert.deepEqual(result, fixture);
          });
        }
      });
    });
  }
});
