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

/**
 * Given a mono repo, creates symlinks
 */
async function symLinkMonoPackages({rootPkgJson, cwd}) {
  for (const p of rootPkgJson.workspaces) {
    const pkgJson = JSON.parse(fs.readFileSync(`${cwd}/${p}/package.json`));
    const [source, destination] = [`${cwd}/${p}`, `${cwd}/node_modules/${pkgJson.name}`];
    const nameSplit = pkgJson.name.split('/');
    if (nameSplit.length === 2 && !fs.existsSync(`${cwd}/node_modules/${nameSplit[0]}`)) {
      fs.mkdirSync(`${cwd}/node_modules/${nameSplit[0]}`);
    }
    try {
      const link = fs.readlinkSync(destination);
      if (link !== source) {
        fs.unlinkSync(source);
        await fs.promises.symlink(source, destination);
      }
    } catch (e) {
      await fs.promises.symlink(source, destination);
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

            let packagePath = path.join(fixturesDir, `${testCase.relPath}/package`);
            let packagePathPosix = packagePath.split(path.sep).join(path.posix.sep);
            // Handle monorepo
            if (!fs.existsSync(packagePathPosix)) {
              const monoRoot = path.join(fixturesDir, `${testCase.relPath}/monorepo`);
              const monoRootPosix = monoRoot.split(path.sep).join(path.posix.sep);
              const rootPkgJson = JSON.parse(fs.readFileSync(`${monoRootPosix}/package.json`));
              packagePath = path.join(monoRootPosix, rootPkgJson.analyzeTarget);
              packagePathPosix = packagePath.split(path.sep).join(path.posix.sep);
              await symLinkMonoPackages({ rootPkgJson, cwd: monoRootPosix });
            }

            const result = await cli({
              argv: ['analyze', '--dependencies'],
              cwd: packagePathPosix,
              noWrite: true
            });

            const outputPath = path.join(fixturesDir, `${testCase.relPath}/output.json`);
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            assert.deepEqual(result, fixture);
          });
        }
      });
    });
  }
});
