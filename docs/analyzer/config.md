# Configuration || 20

## CLI Options

| Command/option   | Type       | Description                                                 | Example                                                 |
| ---------------- | ---------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| analyze          |            | Analyze your components                                     |                                                         |
| --config         | string     | Path to custom config location                              | \`--config "../custom-elements-manifest.config.js"\`    |
| --globs          | string[]   | Globs to analyze                                            | \`--globs "foo.js"\`                                    |
| --exclude        | string[]   | Globs to exclude                                            | \`--exclude "foo.js"\`                                  |
| --outdir         | string     | Directory to output the Manifest to                         | \`--outdir dist\`                                       |
| --watch          | boolean    | Enables watch mode, generates a new manifest on file change | \`--watch\`                                             |
| --dev            | boolean    | Enables extra logging for debugging                         | \`--dev\`                                               |
| --litelement     | boolean    | Enable special handling for LitElement syntax               | \`--litelement\`                                        |
| --fast           | boolean    | Enable special handling for FASTElement syntax              | \`--fast\`                                              |
| --stencil        | boolean    | Enable special handling for Stencil syntax                  | \`--stencil\`                                           |
| --catalyst       | boolean    | Enable special handling for Catalyst syntax                 | \`--catalyst\`                                          |

## Config File

You can specify a custom `custom-elements-manifest.config.mjs` configuration file that allows the following properties:

`custom-elements-manifest.config.mjs`:
```js
import { myAwesomePlugin } from 'awesome-plugin';

export default {
  /** Globs to analyze */
  globs: ['src/**/*.js'],
  /** Globs to exclude */
  exclude: ['src/foo.js'],
  /** Directory to output CEM to */
  outdir: 'dist',
  /** Run in dev mode, provides extra logging */
  dev: true,
  /** Run in watch mode, runs on file changes */
  watch: true,
  /** Enable special handling for litelement */
  litelement: true,
  /** Enable special handling for catalyst */
  catalyst: false,
  /** Enable special handling for fast */
  fast: false,
  /** Enable special handling for stencil */
  stencil: false,
  /** Provide custom plugins */
  plugins: [
    myAwesomePlugin()
  ],

  /** Overrides default module creation: */
  overrideModuleCreation: ({ts, globs}) => {
    const program = ts.createProgram(globs, defaultCompilerOptions);
    const typeChecker = program.getTypeChecker();

    return program.getSourceFiles().filter(sf => globs.find(glob => sf.fileName.includes(glob)));
  },
}
```

Config types:

```ts
interface userConfigOptions {
  globs: string[],
  exclude: string[],
  outdir: string,
  dev: boolean,
  watch: boolean,

  litelement: boolean,
  catalyst: boolean,
  fast: boolean,
  stencil: boolean,
  
  plugins: Array<() => Plugin>,
  overrideModuleCreation: ({ts: TypeScript, globs: string[]}) => SourceFile[]
}

```

### Custom config location

Using the `--config` flag in the CLI you can supply a custom path to your configuration file as follows:

```bash
cem analyze --config "../configs/custom-elements-manifest.js"
```

### Analyzing dependencies

By default, the analyzer doesn't analyze any code inside `node_modules/`. For several reasons; you dont want all of `lodash` to accidentally get analyzed and output in your manifest, but also, we don't actually know which dependencies your project uses _until_ we're analyzing the code, by which time glob collection and compilation has already happened.

If you want to analyze third-party dependencies, you're responsible for providing the globs for them as either a cli option, or in your `custom-elements-manifest.config.js` configuration file.

Example:
```js
export default {
  globs: [
    'src/**/*.js',
    'node_modules/foo/**/*.js'
  ]
}
```