# @custom-elements-manifest/analyzer

Custom Elements Manifest is a file format that describes custom elements. This format will allow tooling and IDEs to give rich information about the custom elements in a given project. You can find the repository for the specification of the schema [here](https://github.com/webcomponents/custom-elements-manifest).

> ✨ Try it out in the [online playground](https://custom-elements-manifest.netlify.app/)! ✨

## Table of Contents

- [Usage](#install)
- [Libraries Support](#support)
- [JSDoc Support](#supported-jsdoc)
- [Advanced configuration](#advanced-configuration)
- [Plugins](#plugins)
- [Authoring Plugins Handbook](docs/plugins.md)
- [Browser](#usage-in-the-browser)

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

### Options

| Command/option   | Type       | Description                                          | Example               |
| ---------------- | ---------- | ---------------------------------------------------- | --------------------- |
| analyze          |            | Analyze your components                              |                       |
| --globs          | string[]   | Globs to analyze                                     | `--globs "foo.js"`    |
| --exclude        | string[]   | Globs to exclude                                     | `--exclude "foo.js"`  |
| --dev            | boolean    | Enables extra logging for debugging                  | `--dev`               |
| --litelement     | boolean    | Enable special handling for LitElement syntax        | `--litelement`        |
| --fast           | boolean    | Enable special handling for FASTElement syntax       | `--fast`              |
| --stencil        | boolean    | Enable special handling for Stencil syntax           | `--stencil`           |
| --catalyst       | boolean    | Enable special handling for Catalyst syntax          | `--catalyst`          |

## Demo

`my-element.js`:

```js
class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ['disabled'];
  }

  set disabled(val) {
    this.__disabled = val;
  }
  get disabled() {
    return this.__disabled;
  }

  fire() {
    this.dispatchEvent(new Event('disabled-changed'));
  }
}

customElements.define('my-element', MyElement);
```

`custom-elements.json`:

```JSON
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "fixtures/-default/package/my-element.js",
      "declarations": [
        {
          "kind": "class",
          "description": "",
          "name": "MyElement",
          "members": [
            {
              "kind": "field",
              "name": "disabled"
            },
            {
              "kind": "method",
              "name": "fire"
            }
          ],
          "events": [
            {
              "name": "disabled-changed",
              "type": {
                "text": "Event"
              }
            }
          ],
          "attributes": [
            {
              "name": "disabled"
            }
          ],
          "superclass": {
            "name": "HTMLElement"
          },
          "tagName": "my-element"
        }
      ],
      "exports": [
        {
          "kind": "custom-element-definition",
          "name": "my-element",
          "declaration": {
            "name": "MyElement",
            "module": "fixtures/-default/package/my-element.js"
          }
        }
      ]
    }
  ]
}
```

### Support

`@custom-elements-manifest/analyzer` by default supports standard JavaScript, and _vanilla_ web components. Dedicated web component libraries can be supported through the use of plugins. Currently, support for LitElement, Stencil and Catalyst is provided in this project via plugins. You can enable them by using the CLI flags `--litelement`, `--fast`, `--stencil` and `--catalyst` respectively, or loading the plugin via your `custom-elements-manifest.config.js`.

**TL;DR:** 
- JavaScript 
- TypeScript
- [LitElement](https://lit.dev) (opt-in via CLI flag) 
- [FASTElement](https://www.fast.design/docs/fast-element/getting-started/) (opt-in via CLI flag) 
- [Stencil](https://stenciljs.com/) (opt-in via CLI flag)
- [Catalyst](https://github.github.io/catalyst/) (opt-in via CLI flag)
- [Atomico](https://atomicojs.github.io/) (opt-in via [community plugin](https://github.com/atomicojs/custom-elements-manifest))

Support for other web component libraries can be done via custom [plugins](#plugins), feel free to create your own for your favourite libraries.


### Documenting your components

For all supported syntax, please check the [fixtures](./fixtures) folder.

`@custom-elements-manifest/analyzer` is able to figure out most of your components API by itself, but for some things it needs a little help, including the following: CSS Shadow Parts, CSS Custom Properties and Slots. You can document these using JSDoc.

```js
import { LitElement, html, css } from 'lit-element';

/**
 * @slot container - You can put some elements here
 *
 * @cssprop --text-color - Controls the color of foo
 * @cssproperty --background-color - Controls the color of bar
 *
 * @csspart bar - Styles the color of bar
 */
class MyElement extends LitElement {
  static get styles() {
    return css`
      :host {
        color: var(--text-color, black);
        background-color: var(--background-color, white);
      }
    `;
  }

  constructor() {
    super();
    /** @type {boolean} - disabled state */
    this.disabled = true;
  }

  get disabled() {
    /* etc */
  }
  set disabled(val) {
    /* etc */
  }

  fire() {
    /** @type {FooEvent} foo-event - description */
    this.dispatchEvent(new FooEvent('foo-changed'));
  }

  render() {
    return html`
      <div part="bar"></div>
      <slot name="container"></slot>
    `;
  }
}

/** @type {boolean} - This will show up in the custom-elements.json too */
export const someVariable = true;

customElements.define('my-element', MyElement);
```

<details>
  <summary>
    <code>custom-elements.json</code>:
  </summary>

```json
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "fixtures/-default/package/my-element.js",
      "declarations": [
        {
          "kind": "class",
          "description": "",
          "name": "MyElement",
          "cssProperties": [
            {
              "description": "- Controls the color of foo",
              "name": "--text-color"
            },
            {
              "description": "- Controls the color of bar",
              "name": "--background-color"
            }
          ],
          "cssParts": [
            {
              "description": "- Styles the color of bar",
              "name": "bar"
            }
          ],
          "slots": [
            {
              "description": "- You can put some elements here",
              "name": "container"
            }
          ],
          "members": [
            {
              "kind": "field",
              "name": "disabled",
              "type": {
                "text": "boolean"
              },
              "default": "true"
            },
            {
              "kind": "method",
              "name": "fire"
            }
          ],
          "events": [
            {
              "name": "foo-changed",
              "type": {
                "text": "FooEvent"
              }
            }
          ],
          "superclass": {
            "name": "LitElement"
          },
          "tagName": "my-element"
        },
        {
          "kind": "variable",
          "name": "someVariable",
          "type": {
            "text": "boolean"
          }
        }
      ],
      "exports": [
        {
          "kind": "js",
          "name": "someVariable",
          "declaration": {
            "name": "someVariable",
            "module": "fixtures/-default/package/my-element.js"
          }
        },
        {
          "kind": "custom-element-definition",
          "name": "my-element",
          "declaration": {
            "name": "MyElement",
            "module": "fixtures/-default/package/my-element.js"
          }
        }
      ]
    }
  ]
}
```

</details>

### Supported JSDoc

| JSDoc                         | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `@attr`, <br>`@attribute`     | Documents attributes for your custom element       |
| `@prop`, <br>`@property `     | Documents properties for your custom element       |
| `@csspart`                    | Documents your custom elements CSS Shadow Parts    |
| `@slot`                       | Documents the Slots used in your components        |
| `@cssprop`,<br>`@cssproperty` | Documents CSS Custom Properties for your component |
| `@fires`,<br>`@event`         | Documents events that your component might fire    |
| `@tag`,<br>`@tagname`         | Documents the name of your custom element          |
| `@summary`                    | Documents a short summary                          |

```js
/**
 * @attr {boolean} disabled - disables the element
 * @attribute {string} foo - description for foo
 *
 * @csspart bar - Styles the color of bar
 *
 * @slot container - You can put some elements here
 *
 * @cssprop --text-color - Controls the color of foo
 * @cssproperty [--background-color=red] - Controls the color of bar
 *
 * @prop {boolean} prop1 - some description
 * @property {number} prop2 - some description
 *
 * @fires custom-event - some description for custom-event
 * @fires {Event} typed-event - some description for typed-event
 * @event {CustomEvent} typed-custom-event - some description for typed-custom-event
 * 
 * @summary This is MyElement
 * 
 * @tag my-element
 * @tagname my-element
 */
class MyElement extends HTMLElement {}
```

## Advanced configuration

You can also specify a custom `custom-elements-manifest.config.mjs` configuration file that allows the following properties:

`custom-elements-manifest.config.mjs`:
```js
import myAwesomePlugin from 'awesome-plugin';

export default {
  globs: ['src/**/*.js'], 
  exclude: ['src/foo.js'],
  dev: true,
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
  dev: boolean,
  plugins: Array<() => Plugin>,
  overrideModuleCreation: ({ts: TypeScript, globs: string[]}) => SourceFile[]
}

```

## Plugins

You can also write custom plugins to extend the functionality to fit what your project needs. You can extract custom JSDoc tags for example, or implement support for a new Web Component library.

> ✨ **TIP:** You can use the [online playground](https://custom-elements-manifest.netlify.app/) for quickly prototyping plugin ideas, right in the browser

A plugin is a function that returns an object. You can read about plugins in more detail in the [authoring plugins documentation](docs/plugins.md). There are several hooks you can opt in to:

- **collectPhase**: First passthrough through the AST of all modules in a project, before continuing to the `analyzePhase`. Runs for each module, and gives access to a Context object that you can use for sharing data between phases, and gives access to the AST nodes of your source code. This is useful for collecting information you may need access to in a later phase.
- **analyzePhase**: Runs for each module, and gives access to the current Module's moduleDoc, and gives access to the AST nodes of your source code. This is generally used for AST stuff.
- **moduleLinkPhase**: Runs after a module is done analyzing, all information about your module should now be available. You can use this hook to stitch pieces of information together.
- **packageLinkPhase**: Runs after all modules are done analyzing, and after post-processing. All information should now be available and linked together.

> ✨ **TIP:** When writing custom plugins, [ASTExplorer](https://astexplorer.net/#/gist/f99a9fba2c21e015d0a8590d291523e5/cce02565e487b584c943d317241991f19b105f94) is your friend 🙂

To get started developing custom plugins, take a look at the [cem-plugin-template](https://github.com/open-wc/cem-plugin-template) repository to quickly get you up and running.  Also take a look at the [authoring plugins documentation](docs/plugins.md).

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

> ✨ **TIP:** Make sure to check out the [cem-plugin-template](https://github.com/open-wc/cem-plugin-template) repository if you're interested in authoring custom plugins, and check the [authoring plugins documentation](docs/plugins.md) for more information.

## How it works

`@custom-elements-manifest/analyzer` will scan the source files in your project, and run them through the TypeScript compiler to gather information about your package. Construction of the `custom-elements.json` happens in several phases:

### Collect phase

During the collect phase, `@custom-elements-manifest/analyzer` goes through the AST of every module in your package. You can use this phase to _collect_ any information that you may need in a later stage. All modules in a project are visited before continuing to the `analyzePhase`.

### Analyze phase

During the analyze phase, `@custom-elements-manifest/analyzer` goes through the AST of every module in your package, and gathers as much information about them as possible, like for example a class and all its members, events, attributes, etc. During this phase it also gathers a modules imports, imports are not specified in `custom-elements.json`, but are required for the second phase, and then deleted once processed.

### Module link phase (per module)

During the module Link phase you can link information together about a current module. For example, if a module contains a class declaration, and a `customElements.define` call, you can already link the components `tagName` to the classDoc. You'll also have access to a modules imports during this phase.

### Package link phase (per package)

During the package link phase, we'll have all the information we need about a package and its custom elements, and we can start joining them together. Examples of this are:

- Finding a CustomElement's tagname by finding its `customElements.define()` call, if present
- Applying inheritance to classes (adding inherited members/attributes/events etc)

## Usage in the browser

You can also run the analyzer in the browser. You can import it like so:

```html
<html>
  <body>
    <script type="module">
      import { ts, create, litPlugin } from '@custom-element-manifest/analyzer/browser/index.js';
      // or
      import { ts, create, litPlugin } from 'https://unpkg.com/@custom-element-manifest/analyzer/browser/index.js';

      const modules = [ts.createSourceFile(
        'src/my-element.js',
        'export function foo() {}',
        ts.ScriptTarget.ES2015,
        true,
      )];

      const manifest = create({
        modules,
        plugins: [litPlugin()],
        dev: false
      });

      console.log(manifest);
    </script>
  </body>
</html>
```

Because typescript doesn't follow semver, and may do breaking changes on minor or patch versions, typescript is bundled with the analyzer to avoid any typescript version mismatches.