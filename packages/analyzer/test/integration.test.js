import { describe } from '@asdgf/cli';
import * as assert from 'uvu/assert';
import path from 'path';
import { pathToFileURL } from 'url';
import fs from 'fs';
import globby from 'globby';
import ts from 'typescript';

import { create } from '../src/create.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');

let groups = fs.readdirSync(fixturesDir);
const singleGroup = groups.find(_case => _case.startsWith('+'));
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

const stripRegex = /\.?\/?fixtures\/(.*?)\/(.*?)\//;
function stripFixturePaths(cem, testCase) {
  if (typeof cem === 'object') {
    Object.keys(cem).forEach(key => {
      cem[key] = stripFixturePaths(cem[key], testCase);
    });
  }
  if (Array.isArray(cem)) {
    cem.forEach(key => {
      cem[key] = stripFixturePaths(cem[key], testCase);
    });
  }
  if (typeof cem === 'string') {
    cem = cem.replace(stripRegex, '');
  }
  return cem;
}

let testCases = [];
describe('@CEM/A', ({it}) => {
  for (const group of groups) {
    testCases = fs.readdirSync(path.join(fixturesDir, group)).map(test => ({ group, test, relPath: path.join(group, test) }));
    const runSingle = testCases.find(_case => _case.test.startsWith('+'));
    if (runSingle) {
      testCases = [runSingle];
    }

    describe(group, ({it}) => {
      testCases.forEach(testCase => {
        if(testCase.test.startsWith('-')) {
          it.skip(`Testcase ${testCase.test}`, () =>{});
        } else {
          it(`Testcase ${testCase.test}`, async () => {
            const fixturePath = path.join(fixturesDir, `${testCase.relPath}/fixture/custom-elements.json`);
            const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
        
            const packagePath = path.join(fixturesDir, `${testCase.relPath}/package`);
            const packagePathPosix = packagePath.split(path.sep).join(path.posix.sep);
            const outputPath = path.join(fixturesDir, `${testCase.relPath}/output.json`);
        
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
            stripFixturePaths(result, testCase.relPath); // adjusts result
        
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
            assert.equal(result, fixture);
          });
        }
      });
    });
  }
});
