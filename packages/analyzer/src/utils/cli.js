import { readConfig, ConfigLoaderError } from '@web/config-loader';
import fs from 'fs';
import path from 'path';
import commandLineArgs from 'command-line-args';
import { has } from './index.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

const IGNORE = [
  '!node_modules/**/*.*',
  '!bower_components/**/*.*',
  '!**/*.test.{js,ts}',
  '!**/*.suite.{js,ts}',
  '!**/*.config.{js,ts}'
];

export function mergeGlobsAndExcludes(defaults, userConfig, cliConfig) {
  const hasProvidedCliGlobs = has(cliConfig?.globs) || has(userConfig?.globs);

  if(hasProvidedCliGlobs) {
    defaults.globs = defaults.globs.filter(glob => glob !== '**/*.{js,ts,tsx}');
  }

  const merged = [
    ...defaults.globs,
    ...(userConfig?.globs || []),
    ...(cliConfig?.globs || []),
    ...(userConfig?.exclude?.map((i) => `!${i}`) || []),
    ...(cliConfig?.exclude?.map((i) => `!${i}`) || []),
    ...IGNORE,
  ];

  return merged;
}

export async function getUserConfig(configPath) {
  let userConfig = {};
  try {
    userConfig = await readConfig('custom-elements-manifest.config', configPath);
  } catch (error) {
    if (error instanceof ConfigLoaderError) {
      console.error(error.message);
      return;
    }
    console.error(error);
    return;
  }
  return userConfig || {};
}

export const DEFAULTS = {
  outdir: '',
  globs: ['**/*.{js,ts,tsx}'],
  dev: false,
  dependencies: false,
  packagejson: true,
  watch: false,
  litelement: false,
  stencil: false,
  fast: false,
  catalyst: false
}

export function getCliConfig(argv) {
  const optionDefinitions = [
    { name: 'config', type: String},
    { name: 'globs', type: String, multiple: true },
    { name: 'exclude', type: String, multiple: true },
    { name: 'outdir', type: String },
    { name: 'dev', type: Boolean },
    { name: 'dependencies', type: Boolean },
    { name: 'packagejson', type: Boolean },
    { name: 'watch', type: Boolean },
    { name: 'litelement', type: Boolean },
    { name: 'stencil', type: Boolean },
    { name: 'fast', type: Boolean },
    { name: 'catalyst', type: Boolean },
  ];

  return commandLineArgs(optionDefinitions, { argv });
}

export async function addFrameworkPlugins(mergedOptions) {
  let plugins = [];
  if(mergedOptions?.litelement) {
    const { litPlugin } = await import('../features/framework-plugins/lit/lit.js');
    plugins = [...(litPlugin() || [])]
  }

  if(mergedOptions?.fast) {
    const { fastPlugin } = await import('../features/framework-plugins/fast/fast.js');
    plugins = [...(fastPlugin() || [])]
  }

  if(mergedOptions?.stencil) {
    const { stencilPlugin } = await import('../features/framework-plugins/stencil/stencil.js');
    plugins.push(stencilPlugin());
  }

  if(mergedOptions?.catalyst) {
    const { catalystPlugin } = await import('../features/framework-plugins/catalyst/catalyst.js');
    plugins = [...(catalystPlugin() || [])]
  }

  return plugins;
}

export function timestamp() {
  const date = new Date();
  return date.toLocaleTimeString();
}

export function addCustomElementsPropertyToPackageJson(outdir) {
  const packageJsonPath = `${process.cwd()}${path.sep}package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  const manifestPath = `./${path.posix.join(outdir, 'custom-elements.json')}`;
  
  const packageHasExportsMap = !!packageJson?.exports;
  /** Is there a pointer to the CEM in the package.json at all yet? */
  const isListed = !!packageJson?.customElements || !!packageJson?.exports?.['./customElements'];

  /** If CEM is not listed in package.json yet */
  if(!isListed) {
    if(packageHasExportsMap) {
      /** If the package has an export map, add it there */
      packageJson.exports['./customElements'] = manifestPath;
    } else {
      /** Otherwise use the custom `customElements` key */
      packageJson.customElements = manifestPath;
    }
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    return;
  } else {
    /** CEM is already listed in package.json */

    /** It's listed under custom `customElements` key */
    if(!!packageJson?.customElements) {
      /** Only update if it has actually changed */
      if(packageJson.customElements !== manifestPath) {
        packageJson.customElements = manifestPath;
        fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }
    }

    /** It's listed in the exports map */
    if(!!packageJson?.exports?.['./customElements']) {
      /** Only update if it has actually changed */
      if(packageJson.exports['./customElements'] !== manifestPath) {
        packageJson.exports['./customElements'] = manifestPath;
        fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }
    }
  }
}

export const MENU = `
@custom-elements-manifest/analyzer (${version})

Available commands:
    | Command/option   | Type       | Description                                                 | Example                                                 |
    | ---------------- | ---------- | ----------------------------------------------------------- | ------------------------------------------------------- |
    | analyze          |            | Analyze your components                                     |                                                         |
    | --config         | string     | Path to custom config location                              | \`--config "../custom-elements-manifest.config.js"\`    |
    | --globs          | string[]   | Globs to analyze                                            | \`--globs "foo.js"\`                                    |
    | --exclude        | string[]   | Globs to exclude                                            | \`--exclude "foo.js"\`                                  |
    | --outdir         | string     | Directory to output the Manifest to                         | \`--outdir dist\`                                       |
    | --dependencies   | boolean    | Include third party custom elements manifests               | \`--dependencies\`                                      |
    | --packagejson    | boolean    | Output CEM path to \`package.json\`, defaults to true       | \`--packagejson\`                                       |
    | --watch          | boolean    | Enables watch mode, generates a new manifest on file change | \`--watch\`                                             |
    | --dev            | boolean    | Enables extra logging for debugging                         | \`--dev\`                                               |
    | --litelement     | boolean    | Enable special handling for LitElement syntax               | \`--litelement\`                                        |
    | --fast           | boolean    | Enable special handling for FASTElement syntax              | \`--fast\`                                              |
    | --stencil        | boolean    | Enable special handling for Stencil syntax                  | \`--stencil\`                                           |
    | --catalyst       | boolean    | Enable special handling for Catalyst syntax                 | \`--catalyst\`                                          |

Examples:
    custom-elements-manifest analyze --litelement --globs "**/*.js" --exclude "foo.js" "bar.js"
`
