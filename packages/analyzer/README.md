# @custom-elements-manifest/analyzer

<!-- [=> See Source <=](../../docs/analyzer/index.md) -->

Custom Elements Manifest is a file format that describes custom elements. This format will allow tooling and IDEs to give rich information about the custom elements in a given project. You can find the repository for the specification of the schema [here](https://github.com/webcomponents/custom-elements-manifest).

> ✨ Try it out in the [online playground](https://custom-elements-manifest.netlify.app/)! ✨

[**Read the Docs**](https://custom-elements-manifest.open-wc.org/)

## Install

```bash
npm i -D @custom-elements-manifest/analyzer
```

## Usage

### CLI

```bash
custom-elements-manifest analyze
```

or

```bash
cem analyze
```

### Programmatic API

You can also use the analyzer programmatically in your Node.js scripts:

```javascript
import { generateManifest } from '@custom-elements-manifest/analyzer';

// Using a configuration object
const manifest = await generateManifest({
  globs: ['src/**/*.js'],
  exclude: ['**/*.test.js'],
  outdir: './dist',
  litelement: true,
  dependencies: true
});

console.log(manifest);
```

Generate without writing to disk:

```javascript
import { generateManifest } from '@custom-elements-manifest/analyzer';

// Generate manifest without writing to disk
const manifest = await generateManifest({
  globs: ['src/**/*.js'],
  outdir: './dist'
}, {
  write: false  // Don't write to disk
});

// Process manifest in memory
console.log(JSON.stringify(manifest, null, 2));
```

### Build Tool Plugins

#### Rollup Plugin

Integrate manifest generation into your Rollup build process:

```javascript
// rollup.config.js
import { rollupCemAnalyzerPlugin } from '@custom-elements-manifest/analyzer';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [
    rollupCemAnalyzerPlugin({
      globs: ['src/**/*.js'],
      exclude: ['**/*.test.js'],
      outdir: './dist',
      litelement: true
    })
  ]
};
```

The plugin is compatible with Rollup and Rollup-based tools like Vite and Web Dev Server. It automatically generates the manifest at the start of each build.

## Options

| Command/option     | Type     | Description                                                 | Example                                            |
| ------------------ | -------- | ----------------------------------------------------------- | -------------------------------------------------- |
| analyze            |          | Analyze your components                                     |                                                    |
| --config           | string   | Path to custom config location                              | `--config "../custom-elements-manifest.config.js"` |
| --globs            | string[] | Globs to analyze                                            | `--globs "foo.js"`                                 |
| --exclude          | string[] | Globs to exclude                                            | `--exclude "foo.js"`                               |
| --outdir           | string   | Directory to output the Manifest to                         | `--outdir dist`                                    |
| --dependencies     | boolean  | Include third party custom elements manifests               | `--dependencies`                                   |
| --packagejson      | boolean  | Output CEM path to `package.json`, defaults to true         | `--packagejson`                                    |
| --watch            | boolean  | Enables watch mode, generates a new manifest on file change | `--watch`                                          |
| --dev              | boolean  | Enables extra logging for debugging                         | `--dev`                                            |
| --quiet            | boolean  | Hides all logging                                           | `--quiet`                                          |
| --litelement       | boolean  | Enable special handling for LitElement syntax               | `--litelement`                                     |
| --fast             | boolean  | Enable special handling for FASTElement syntax              | `--fast`                                           |
| --stencil          | boolean  | Enable special handling for Stencil syntax                  | `--stencil`                                        |
| --catalyst         | boolean  | Enable special handling for Catalyst syntax                 | `--catalyst`                                       |
| --catalyst-major-2 | boolean  | Enable special handling for Catalyst syntax ^2.0.0          | `--catalyst-major-2`                               |
