import { describe } from '@asdgf/cli';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { Validator } from 'jsonschema';
import { cli } from '../cli.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
const require = createRequire(import.meta.url);
const cem21Schema = require('custom-elements-manifest');
const validator = new Validator();

const legacyDependencyManifests = [
  '02-inheritance/04-external/package/node_modules/@ext-scoped/with-export-map/custom-elements.json',
  '02-inheritance/04-external/package/node_modules/ext-pkg-without-export-map/custom-elements.json',
  '02-inheritance/05-external-in-monorepo/monorepo/node_modules/ext-pkg-without-export-map/custom-elements.json',
  '02-inheritance/05-external-in-monorepo/monorepo/packages/sibling-pkg/custom-elements.json',
];

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
  it('keeps legacy dependency fixtures at CEM 1.0', () => {
    for (const manifestPath of legacyDependencyManifests) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(fixturesDir, manifestPath), 'utf-8'),
      );
      assert.equal(manifest.schemaVersion, '1.0.0');
    }
  });

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

            assert.equal(result.schemaVersion, '2.1.0');
            const validation = validator.validate(result, cem21Schema);
            assert.equal(
              validation.errors.length,
              0,
              validation.errors.map((error) => error.stack).join('\n'),
            );

            if (testCase.relPath === path.join('01-class', '04-readonly')) {
              const declaration = result.modules[0].declarations[0];
              assert.deepEqual(
                declaration.members
                  .filter((member) => member.readonly !== undefined)
                  .map(({ name, readonly }) => ({ name, readonly })),
                [
                  { name: 'foo', readonly: true },
                  { name: 'bar', readonly: true },
                  { name: 'qux', readonly: true },
                ],
              );
            }

            if (testCase.relPath === path.join('01-class', '05-custom-states')) {
              assert.deepEqual(result.modules[0].declarations[0].cssStates, [
                {
                  description: 'Applies when the element is active',
                  name: 'active',
                },
              ]);
            }

            if (testCase.relPath === path.join('02-inheritance', '04-external')) {
              const declaration = result.modules[0].declarations.find(
                ({ name }) => name === 'MyElement',
              );
              assert.deepEqual(
                declaration.members.map(({ name }) => name),
                ['extClassProp', 'extMixinProp'],
              );
              assert.deepEqual(
                declaration.attributes.map(({ name }) => name),
                ['ext-mixin-attr', 'ext-class-attr'],
              );
            }

            if (
              testCase.relPath ===
              path.join('02-inheritance', '05-external-in-monorepo')
            ) {
              const legacyModule = result.modules.find(
                ({ path: modulePath }) => modulePath === 'internalFile.js',
              );
              assert.equal(legacyModule.declarations[0].name, 'internalVar');
              assert.equal(legacyModule.exports[0].name, 'internalVar');
            }

            const outputPath = path.join(fixturesDir, `${testCase.relPath}/output.json`);
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            assert.deepEqual(result, fixture);
          });
        }
      });
    });
  }
});
