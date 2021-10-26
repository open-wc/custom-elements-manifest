# `@custom-elements-manifest`

Custom Elements Manifest is a file format that describes custom elements. This format will allow tooling and IDEs to give rich information about the custom elements in a given project. You can find the repository for the specification of the schema [here](https://github.com/webcomponents/custom-elements-manifest).

> ✨ Try it out in the [online playground](https://custom-elements-manifest.netlify.app/)! ✨
## Packages

- [`@custom-elements-manifest/analyzer`](./packages/analyzer) Generate manifests from source
- [`@custom-elements-manifest/find-dependencies`](./packages/find-dependencies) Given an array of paths, scans all modules and returns all depending paths
- [`@custom-elements-manifest/to-markdown`](./packages/to-markdown) Generate markdown from manifests
- [`cem-plugin-readme`](./plugins/readme) Generate README files
