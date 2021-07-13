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

```bash
custom-elements-manifest analyze
```

or

```bash
cem analyze
```

## Options

| Command/option   | Type       | Description                                                 | Example               |
| ---------------- | ---------- | ----------------------------------------------------------- | --------------------- |
| analyze          |            | Analyze your components                                     |                       |
| --globs          | string[]   | Globs to analyze                                            | `--globs "foo.js"`    |
| --exclude        | string[]   | Globs to exclude                                            | `--exclude "foo.js"`  |
| --outdir         | string     | Directory to output the Manifest to                         | `--outdir dist`       |
| --watch          | boolean    | Enables watch mode, generates a new manifest on file change | `--watch`             |
| --dev            | boolean    | Enables extra logging for debugging                         | `--dev`               |
| --litelement     | boolean    | Enable special handling for LitElement syntax               | `--litelement`        |
| --fast           | boolean    | Enable special handling for FASTElement syntax              | `--fast`              |
| --stencil        | boolean    | Enable special handling for Stencil syntax                  | `--stencil`           |
| --catalyst       | boolean    | Enable special handling for Catalyst syntax                 | `--catalyst`          |
