import { readConfig, ConfigLoaderError } from '@web/config-loader';
import fs from 'fs';
import commandLineArgs from 'command-line-args';
import { has } from './index.js';

const IGNORE = [
  '!node_modules/**/*.*', 
  '!bower_components/**/*.*', 
  '!**/*.test.{js,ts}', 
  '!**/*.suite.{js,ts}', 
  '!**/*.config.{js,ts}'
];

export function mergeGlobsAndExcludes(userConfig, cliConfig) {
  const hasProvidedCliGlobs = cliConfig?.globs?.[0] !== '**/*.{js,ts}' || has(userConfig?.globs);

  if(hasProvidedCliGlobs) {
    cliConfig.globs = cliConfig?.globs?.filter(glob => glob !== '**/*.{js,ts}');
  }

  const merged = [
    ...(userConfig?.globs || []),
    ...(cliConfig?.globs || []),
    ...(userConfig?.exclude?.map((i) => `!${i}`) || []),
    ...(cliConfig?.exclude?.map((i) => `!${i}`) || []),
    ...IGNORE,
  ];

  return merged;
}

export async function getUserConfig() {
  let userConfig = {};
  try {
    userConfig = await readConfig('custom-elements-manifest.config');
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

export function getCliConfig(argv) {
  const optionDefinitions = [
    { name: 'globs', type: String, multiple: true, defaultValue: ['**/*.{js,ts}'] },
    { name: 'exclude', type: String, multiple: true },
    { name: 'dev', type: Boolean, defaultValue: false },
    { name: 'litelement', type: Boolean, defaultValue: false },
    { name: 'stencil', type: Boolean, defaultValue: false },
    { name: 'fast', type: Boolean, defaultValue: false },
    { name: 'catalyst', type: Boolean, defaultValue: false },
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

export function addCustomElementsPropertyToPackageJson() {
  const packageJsonPath = `${process.cwd()}/package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  
  if(packageJson?.customElements) {
    return;
  } else {
    packageJson.customElements = 'custom-elements.json';
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }
}

export const MENU = `
@custom-elements-manifest/analyzer

Available commands:
    | Command/option   | Type       | Description                                          | Example               |
    | ---------------- | ---------- | ---------------------------------------------------- | --------------------- |
    | analyze          |            | Analyze your components                              |                       |
    | --globs          | string[]   | Globs to analyze                                     | \`--globs "foo.js"\`    |
    | --exclude        | string[]   | Globs to exclude                                     | \`--exclude "foo.js"\`  |
    | --litelement     | boolean    | Enable special handling for LitElement syntax        | \`--litelement\`        |
    | --stencil        | boolean    | Enable special handling for Stencil syntax           | \`--stencil\`           |
    | --catalyst       | boolean    | Enable special handling for Catalyst syntax          | \`--catalyst\`          |

Example:
    custom-elements-manifest analyze --litelement --globs "**/*.js" --exclude "foo.js" "bar.js"
`