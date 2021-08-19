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
  globs: ['src/**/*.js'],
  exclude: ['src/foo.js'],
  outdir: 'dist',
  dev: true,
  watch: true,
  plugins: [
    myAwesomePlugin()
  ],

  /** Even more advanced usecases: */
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
  plugins: Array<() => Plugin>,
  overrideModuleCreation: ({ts: TypeScript, globs: string[]}) => SourceFile[]
}

```

### Custom config location

Using the `--config` flag in the CLI you can supply a custom path to your configuration file as follows:

```bash
cem analyze --config "./configs/custom-elements-manifest.js"
```