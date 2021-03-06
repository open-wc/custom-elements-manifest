import { absoluteBaseUrlNetlify } from '@rocket/core/helpers';
import { rocketBlog } from '@rocket/blog';
import { rocketLaunch } from '@rocket/launch';
import { rocketSearch } from '@rocket/search';
import { codeTabs } from 'rocket-preset-code-tabs';

export default {
  absoluteBaseUrl: absoluteBaseUrlNetlify('http://localhost:8080'),

  presets: [
    rocketLaunch(),
    rocketBlog(),
    rocketSearch(),
    codeTabs({
      collections: {
        packageManagers: {
          npm: { label: 'NPM', iconHref: '/_merged_assets/_static/logos/npm.svg' },
          yarn: { label: 'Yarn', iconHref: '/_merged_assets/_static/logos/yarn.svg' },
          pnpm: { label: 'PNPM', iconHref: '/_merged_assets/_static/logos/pnpm.svg' },
        },
        demo: {
          input: { label: 'Input' },
          output: { label: 'Output' }
        }
      },
    }),
  ],

  eleventy(eleventyConfig) {
    eleventyConfig.addWatchTarget('docs/_assets/**/*.css');
  }
}
