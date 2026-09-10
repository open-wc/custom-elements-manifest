/**
 * Updates the version nr of the fixtures
 *
 * @example
 * node scripts/update-version.js --version 2.1.0
 */

import globby from 'globby';
import commandLineArgs from 'command-line-args';
import fs from 'fs';
  
const mainDefinitions = [
  { name: 'version' }
];

const { version } = commandLineArgs(mainDefinitions);

(async () => {
  // Update analyzer-generated results only. Manifests under package/node_modules
  // are legacy dependency inputs and intentionally retain their own versions.
  const cemPaths = await globby([
    `${process.cwd()}/fixtures/**/fixture/custom-elements.json`,
    `${process.cwd()}/fixtures/**/output.json`,
  ]);
  cemPaths.forEach(path => {
    const cem = JSON.parse(fs.readFileSync(path).toString());
    cem.schemaVersion = version;
    fs.writeFileSync(path, `${JSON.stringify(cem, null, 2)}\n`);
  });
})();
