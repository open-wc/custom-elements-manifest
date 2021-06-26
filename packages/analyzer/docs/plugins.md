# Authoring Plugins

Different projects often have different requirements, and ways of documenting their components. Maybe you need to support custom JSDoc? Custom Decorators? Custom libraries? Custom anything? `@custom-elements-manifest/analyzer` has a rich plugin system that allows you to extend its functionality, and add whatever extra metadata you need to your `custom-elements.json`.

> ✨ **TIP:** When writing custom plugins, [ASTExplorer](https://astexplorer.net/#/gist/f99a9fba2c21e015d0a8590d291523e5/cce02565e487b584c943d317241991f19b105f94) is your friend 🙂

## Getting started

Want to quickly get started and write some code? Take a look at the [cem-plugin-template](https://github.com/open-wc/cem-plugin-template) starter repository.

> ✨ **TIP:** You can also use the [online playground](https://custom-elements-manifest.netlify.app/) for quickly prototyping plugin ideas, right in the browser

## Introduction

`@custom-elements-manifest/analyzer` under the hood makes use of the TypeScript compiler API. This API can take source code, and create an Abstract Syntax Tree (from here on out referred to as: AST) out of it.

If you're unfamiliar with ASTs, they are essentially a great big object that contains a lot of information about your source code. If you're interested in learning more about AST's, I've previously written about them [here](https://dev.to/thepassle/babel-beyond-assumptions-6ep). That blog refers to the AST Babel creates for you, but the concepts are the same.

In short; an AST consists of _nodes_. Given the following source code:

```js
export function foo() {
  return true;
}
```

A (very simplified/psuedocode) AST of this source code could look something like this:
```json
{
  "SourceFile": {
    "statements": [
      {
        "FunctionDeclaration": {
          "name": {
            "text": "foo"
          },
          "modifiers": [
            {
              "ExportKeyword": {}
            }
          ],
          "body": {
            "statements": [
              {
                "ReturnStatement": {
                  "expression": {
                    "TrueKeyword": {}
                  }
                }
              }
            ],
          }
        }
      }
    ]
  }
}
```

> Note: This is not a 1-on-1 example of the AST TypeScript creates, this is only for illustrative purposes.

In this (simplified/psuedocode) AST, you can see we have a lot of information available about our source code. We can use these objects (or _AST nodes_) to create our Custom Elements Manifest. Custom plugins give you hooks that allow you to _traverse_ (or: loop through) all the nodes in a module's AST, and give you access to any metadata about your source code, so we can alter or append information to our Custom Elements Manifest.

## Plugin hooks

A plugin usually is a function that returns an object, and has several (optional) hooks you can opt in to:

```js
export default function myPlugin() {
  return {
    // Make sure to always give your plugin a name! This helps when debugging
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
}
```

## Plugin Hooks Lifecycle

### `collectPhase`

When the analyzer starts analyzing, it will first go through _all_ modules, and run all the plugins `collectPhase` hooks, before moving on to any other hooks. This hook is useful for _collecting_ any information, like for example: imports, types, etc, from all modules before moving on to the next plugin hooks. 

The `collectPhase` hook will go through each node in the AST of all modules.


### `analyzePhase`

Once all the collecting is done, and all modules have been visited, we loop through all modules again. This phase is generally used for 'feature discovery'; maybe you need to discover a certain JSDoc annotation, or a specifically named function. During this phase, you can also combine information you gathered in the `collectPhase`.

The `analyzePhase` hook will go through each node in the AST of all modules.

### `moduleLinkPhase`

_After_ analyzing a module, and _before_ moving on to the next module, the `moduleLinkPhase` is run. All of the AST nodes of a module have now been visited, so you can use this phase to stitch pieces of information together; like for example a `customElements.define()` call to the class that it gets passed.

This hook gets passed the current module's `moduleDoc`. You can mutate the object as you like.

### `analyzePhase`

After all modules have been analyzed and all the ASTs have been traversed, the Manifest should now be fully constructed. You can use the `analyzePhase` for any post-processing you may need to do. 

This hook gets passed the complete Custom Elements Manifest.

### Concluding

Here's a simplified pseudocode/illustration of when the different plugin hooks run in the analyzer:

```js
modules.forEach(mod => {
  /** Visit each node in a module's AST and execute `collectPhase` hooks */
  collect(mod, context, plugins);
});

modules.forEach(mod => {
  /** Visit each node in a module's AST and execute `analyzePhase` hook */
  analyze(mod, moduleDoc, context, plugins);

  /** 
   * All AST nodes for the module have been visited, the moduleDoc should be constructed,
   * so we run the moduleLinkPhase 
   */
  plugins.forEach(({moduleLinkPhase}) => {
    moduleLinkPhase?.({ts, moduleDoc, context});
  });
});

/**
 * All modules have now been processed, the full Custom Elements Manifest should be constructed, 
 * we can now do post-processing
 */
plugins.forEach(({packageLinkPhase}) => {
  packageLinkPhase?.({customElementsManifest, context});
});
```

## Context

You may have noticed the `context` object that gets passed to each plugin hook. This is just an object that you can use to mutate and pass arbitrary data around in your plugins different hooks. It also contains some meta information, like for example whether or not a user is running the analyzer in `--dev` mode, for extra logging. This can be helpful for debugging purposes. The `context` object also holds an array of a modules imports.

### Dev logging

This means you can use the `context` object to supply additional logging, for example: 
```js
export default function myPlugin() {
  return {
    name: 'my-plugin',
    analyzePhase({context}) {
      if(context.dev) {
        console.log('[my-plugin-name]: Some extra logging!');
      }
    }
  }
}
```

Alternatively, it's also fine to keep 'state' in the closure of your plugin:

```js
export default function myPlugin() {
  const state = {};
  return {
    name: 'my-plugin',
    analyzePhase() {
      // do something with state
    }
  }
}
```

### Imports

The `context` object also holds an array of a modules imports that are available during the `analyzePhase` and the `moduleLinkPhase`.

Source code:
```js
import { foo } from 'bar';
```

Plugin code:
```js
export default function myPlugin() {
  return {
    name: 'my-plugin',
    analyzePhase({context}) {
      console.log(context.imports);
    }
  }
}
```

Outputs:
```js
[
  {
    name: 'foo',
    kind: 'named',
    importPath: 'bar',
    isBareModuleSpecifier: true,
    isTypeOnly: false // handles `import type { Foo } from 'bar';
  },
]
```

## Example Plugin

Let's take a look at an example plugin:

Imagine we have some source code, with a custom `@foo` JSDoc annotation and some information that we'd like to add to our `custom-elements.json`:

`my-element.js`:
```js
export class MyElement extends HTMLElement {
  /**
   * @foo Some custom information!
   */ 
  message = ''
}
```

In a custom plugin, we have full access to our source code's AST, and we can easily loop through any members of a class, and see if it has a JSDoc tag with the name `foo`. If it does, we add the description to our `custom-elements.json`:

`custom-elements-manifest.config.js`:
```js
export default function fooPlugin() {
  return {
    name: 'foo-plugin',
    analyzePhase({ts, node, moduleDoc, context}){
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          /* If the current AST node is a class, get the class's name */
          const className = node.name.getText();

          /* We loop through all the members of the class */
          node.members?.forEach(member => {
            const memberName = member.name.getText();

            /* If a member has JSDoc notations, we loop through them */
            member?.jsDoc?.forEach(jsDoc => {
              jsDoc?.tags?.forEach(tag => {
                /* If we find a `@foo` JSDoc tag, we want to extract the comment */
                if(tag.tagName.getText() === 'foo') {
                  const description = tag.comment;

                  /* We then find the current class from the `moduleDoc` */
                  const classDeclaration = moduleDoc.declarations.find(declaration => declaration.name === className);
                  /* And then we find the current field from the class */
                  const messageField = classDeclaration.members.find(member => member.name === memberName);
                  
                  /* And we mutate the field with the information we got from the `@foo` JSDoc annotation */
                  messageField.foo = description
                }
              });
            });
          });
      }
    }
  }
}
```

And as a result, the output `custom-elements.json` will look like this:
```diff
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "my-element.js",
      "declarations": [
        {
          "kind": "class",
          "description": "",
          "name": "MyElement",
          "members": [
            {
              "kind": "field",
              "name": "message",
              "default": "",
+             "foo": "Some custom information!"
            }
          ],
          "superclass": {
            "name": "HTMLElement"
          },
          "customElement": true
        }
      ],
      "exports": [
        {
          "kind": "js",
          "name": "MyElement",
          "declaration": {
            "name": "MyElement",
            "module": "my-element.js"
          }
        }
      ]
    }
  ]
}
```

### Another example

You can also use plugins to output custom documentation:

```js
import path from 'path';
import fs from 'fs';

function generateReadme() {
  const components = ['my-component-a', 'my-component-b'];

  return {
    name: 'readme-plugin',
    packageLinkPhase({customElementsManifest, context}) {
      customElementsManifest.modules.forEach(mod => {
        mod.declarations.forEach(declaration => {
          if(components.includes(declaration.tagName)) {
            fs.writeFileSync(
              `${path.dirname(mod.path)}/README.md`, 
              renderClassdocAsMarkdown(declaration)
            );
          }
        });
      });
    }
  }
}
```

## Advanced usage

### Overriding sourceFile creation

By default, `@custom-elements-manifest/analyzer` does _not_ compile any code with TS. It just uses the TS compiler API to create an AST of your source code. This means that there is no `typeChecker` available in plugins.

If you _do_ want to use the `typeChecker`, you can override the creation of modules in your `custom-elements-manifest.config.js`:

```js
import { defaultCompilerOptions } from './compilerOptions.js';
import { myPlugin } from './my-plugin.js';

let typeChecker;

export default {
  globs: ['fixtures/-default/package/**/*.js'], 
  exclude: [],
  dev: true,
  overrideModuleCreation: ({ts, globs}) => {
    const program = ts.createProgram(globs, defaultCompilerOptions);
    typeChecker = program.getTypeChecker();

    return program.getSourceFiles().filter(sf => globs.find(glob => sf.fileName.includes(glob)));
  },
  plugins: [
    /** You can now pass the typeChecker to your plugins */
    myPlugin(typeChecker)
  ],
}

```

`my-plugin.js`:
```js
export function myPlugin(typeChecker) {
  return {
    name: 'my-plugin',
    analyzePhase({ts, moduleDoc, context}) {
      // do something with typeChecker
    }
  }
}

```

## Conventions

- Document an example of the syntax your plugin supports in your plugins `README.md`
- Document an example of the expected Custom Elements Manifest your plugin should output in your plugins `README.md`
- Publish your plugin as `cem-plugin-<my-plugin-name>`, e.g.: `cem-plugin-async`

## FAQ

### Can I bring my own instance of TS?

No! Or well, you can. But that might break things. TypeScript doesn't follow semver, which means that there may be breaking changes in between minor or even patch versions of TypeScript. This means that if you use a different version of TypeScript than the analyzer's version of TypeScript, things will almost definitely break. As a convenience, plugin functions get passed the analyzer's version of TS to ensure there are no version incompatibilities, and everything works as expected.

## Consuming plugins

You can use plugins by creating a `custom-elements-manifest.config.js` configuration file in the root of your project. This file will automatically get picked up by the analyzer if it exists.

You can now install any custom plugins from NPM, and add them to your `plugins` array:
```bash
npm i -D cem-plugin-someplugin
```

```js
import somePlugin from 'cem-plugin-someplugin';

export default {
  plugins: [
    somePlugin()
  ]
}
```