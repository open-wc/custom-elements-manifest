# Plugins >> Introduction || 10

You can also write custom plugins to extend the functionality to fit what your project needs. You can extract custom JSDoc tags for example, or implement support for a new Web Component library.

> ✨ **TIP:** You can use the [online playground](https://custom-elements-manifest.netlify.app/) for quickly prototyping plugin ideas, right in the browser

A plugin is a function that returns an object. You can read about plugins in more detail in the [authoring plugins documentation](./authoring/). There are several hooks you can opt in to:

- **collectPhase**: First passthrough through the AST of all modules in a project, before continuing to the `analyzePhase`. Runs for each module, and gives access to a Context object that you can use for sharing data between phases, and gives access to the AST nodes of your source code. This is useful for collecting information you may need access to in a later phase.
- **analyzePhase**: Runs for each module, and gives access to the current Module's moduleDoc, and gives access to the AST nodes of your source code. This is generally used for AST stuff.
- **moduleLinkPhase**: Runs after a module is done analyzing, all information about your module should now be available. You can use this hook to stitch pieces of information together.
- **packageLinkPhase**: Runs after all modules are done analyzing, and after post-processing. All information should now be available and linked together.

> ✨ **TIP:** When writing custom plugins, [ASTExplorer](https://astexplorer.net/#/gist/f99a9fba2c21e015d0a8590d291523e5/cce02565e487b584c943d317241991f19b105f94) is your friend 🙂

To get started developing custom plugins, take a look at the [cem-plugin-template](https://github.com/open-wc/cem-plugin-template) repository to quickly get you up and running.  Also take a look at the [authoring plugins documentation](./authoring/).

`custom-elements-manifest.config.mjs`:
```js
export default {
  plugins: [
    {
      // Make sure to always give your plugins a name, this helps when debugging
      name: 'my-plugin',
      // Runs for all modules in a project, before continuing to the `analyzePhase`
      collectPhase({ts, node, context}){},
      // Runs for each module
      analyzePhase({ts, node, moduleDoc, context}){},
      // Runs for each module, after analyzing, all information about your module should now be available
      moduleLinkPhase({moduleDoc, context}){},
      // Runs after modules have been parsed and after post-processing
      packageLinkPhase({customElementsManifest, context}){},
    }
  ]
}
```

> ✨ **TIP:** Make sure to check out the [cem-plugin-template](https://github.com/open-wc/cem-plugin-template) repository if you're interested in authoring custom plugins, and check the [authoring plugins documentation](./authoring/) for more information.

## Community Plugins

- [cem-plugin-async-function](https://www.npmjs.com/package/cem-plugin-async-function) - plugin to add (non-standard) async flag to functions
- [cem-plugin-copy](https://www.npmjs.com/package/cem-plugin-copy) - plugin to copy files when finished analyzing
- [cem-plugin-jsdoc-example](https://www.npmjs.com/package/cem-plugin-jsdoc-example) - plugin to handle jsdoc `@example` tag
- [cem-plugin-module-file-extensions](https://www.npmjs.com/package/cem-plugin-module-file-extensions) - plugin to rewrite file extensions (e.g. from `.js` to `.ts`)
- [cem-plugin-reactify](https://www.npmjs.com/package/cem-plugin-reactify) - plugin to automatically create React wrappers for your custom elements
- [cem-plugin-readonly](https://www.npmjs.com/package/cem-plugin-readonly) - plugin to handle read-only class members
- [cem-plugin-type-descriptions-markdown](https://www.npmjs.com/package/cem-plugin-type-descriptions-markdown) - plugin to add markdown type documentation to manifest member descriptions

> Want your plugin listed here? Please create a PR!
