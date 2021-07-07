import chalk from 'chalk';
import hirestime from 'hirestime';
import mkdirp from 'mkdirp';

import { customElementsManifestToMarkdown } from '@custom-elements-manifest/to-markdown';

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

/**
 * @typedef {object} Options
 * @property {string} [from] absolute path to package root
 * @property {string} [to="README.md"] relative path from package root to output file
 * @property {boolean} quiet suppress logs
 */

/**
 * @param  {Options} options
 * @return {import('@custom-elements-manifest/analyzer').Plugin}
 */
export function readmePlugin(options) {
  const {
    footer,
    from = join(dirname(fileURLToPath(import.meta.url)), '..', '..'),
    header,
    headingOffset = 1,
    quiet = false,
    to = 'README.md',
  } = options ?? {};
  return {
    name: 'readme',
    packageLinkPhase({ customElementsManifest }) {
      const time = hirestime.default();

      const outPath = join(from, to);

      try {
        const head = readFileSync(join(from, header));
        const foot = readFileSync(join(from, footer));

        const markdown = customElementsManifestToMarkdown(customElementsManifest, {
          headingOffset,
          private: options?.private ?? 'details',
        });

        const content = `${head ? head + '\n\n' : ''}${markdown}${foot ? '\n\n' + foot : ''}`;

        mkdirp(dirname(outPath));

        writeFileSync(outPath, content);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }

      if (!quiet)
        console.log(chalk.yellow`[cem-plugin-readme] ` + chalk.green`Wrote ${chalk.bold(relative(from, to))} in ${time.seconds()}s`);
    },
  };
}
