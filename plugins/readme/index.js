import { customElementsManifestToMarkdown } from '@custom-elements-manifest/to-markdown';

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * @typedef {import('@custom-elements-manifest/to-markdown').Options} Options
 * @property {string} [from] absolute path to package root
 * @property {string} [to="README.md"] relative path from package root to output file
 * @property {number} [headingOffset=1] offset for markdown heading level
 * @property {string} [header] relative path to header file
 * @property {string} [footer] relative path to footer file
 */

/**
 * @param  {Options} options
 * @return {import('@custom-elements-manifest/analyzer').Plugin}
 */
export function readmePlugin(options) {
  const {
    header,
    footer,
    from = join(dirname(fileURLToPath(import.meta.url)), '..', '..'),
    to = 'README.md',
    headingOffset = 1,
    exportKinds,
  } = options ?? {};
  return {
    name: 'readme',
    packageLinkPhase({ customElementsManifest }) {
      const outPath = join(from, to);

      try {
        const head = header && readFileSync(join(from, header));
        const foot = footer && readFileSync(join(from, footer));

        const markdown = customElementsManifestToMarkdown(customElementsManifest, {
          exportKinds,
          headingOffset,
          private: options?.private ?? 'details',
        });

        const content = `${head ? head + '\n\n' : ''}${markdown}${foot ? '\n\n' + foot : ''}`;

        mkdirSync(dirname(outPath), { recursive: true });

        writeFileSync(outPath, content);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    },
  };
}
