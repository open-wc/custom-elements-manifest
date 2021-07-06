import globby from 'globby';
import fs from 'fs';
import path from 'path';

import { customElementsManifestToMarkdown} from '../index.js';

(async () => {
  const cemPaths = await globby([`${process.cwd()}/fixtures/**/custom-elements.json`]);
  cemPaths.forEach(path => {
    const cem = JSON.parse(fs.readFileSync(path).toString());
    fs.writeFileSync(path.join(path.dirname(path), 'EXPECTED.md'), customElementsManifestToMarkdown(cem), 'utf8');
  });
})();
