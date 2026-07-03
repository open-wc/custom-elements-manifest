# Getting Started || 10

Custom Elements Manifest is a file format that describes custom elements. This format will allow tooling and IDEs to give rich information about the custom elements in a given project. You can find the repository for the specification of the schema [here](https://github.com/webcomponents/custom-elements-manifest).

> ✨ Try it out in the [online playground](https://custom-elements-manifest.netlify.app/)! ✨

## Install

<code-tabs collection="package-managers" default-tab="npm">

  ```bash tab npm
  npm i -D @custom-elements-manifest/analyzer
  ```

  ```bash tab yarn
  yarn add -D @custom-elements-manifest/analyzer
  ```

  ```bash tab pnpm
  pnpm add -D @custom-elements-manifest/analyzer
  ```

</code-tabs>

## Usage

### With npx

If you have `npx` installed use:

```bash copy
npx custom-elements-manifest analyze
```

or

```bash copy
npx cem analyze
```

### Without npx 

If you don't have `npx`, you can add
the modules to your PATH and run it
with:

```bash copy
custom-elements-manifest analyze
```

or

```bash copy
cem analyze
```

If you don't want to add it to your
PATH, you can call it directly:


```bash copy
./node_modules/@custom-elements-manifest/analyzer/cem.js analyze
```



## Demo

<code-tabs default-tab="my-element.js">

  ```js tab my-element.js
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

  ```json tab custom-elements.json
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

</code-tabs>

### Support

`@custom-elements-manifest/analyzer` by default supports standard JavaScript, and _vanilla_ web components. Dedicated web component libraries can be supported through the use of plugins. Currently, support for LitElement, Stencil and Catalyst is provided in this project via plugins. You can enable them by using the CLI flags `--litelement`, `--fast`, `--stencil`, `--catalyst` and `--catalyst` respectively, or loading the plugin via your `custom-elements-manifest.config.js`.

**TL;DR:**
- JavaScript
- TypeScript
- [LitElement](https://lit.dev) (opt-in via CLI flag)
- [FASTElement](https://www.fast.design/docs/fast-element/getting-started/) (opt-in via CLI flag)
- [Stencil](https://stenciljs.com/) (opt-in via CLI flag)
- [Catalyst](https://github.github.io/catalyst/) (opt-in via CLI flag)
- [Atomico](https://atomicojs.github.io/) (opt-in via [community plugin](https://github.com/atomicojs/custom-elements-manifest))

Support for other web component libraries can be done via custom [plugins](../plugins/), feel free to create your own for your favourite libraries.


### Documenting your components

For all supported syntax, please check the [fixtures](https://github.com/open-wc/custom-elements-manifest/tree/master/packages/analyzer/fixtures) folder.

`@custom-elements-manifest/analyzer` is able to figure out most of your components API by itself, but for some things it needs a little help, including the following: CSS Shadow Parts, CSS Custom Properties and Slots. You can document these using JSDoc.

<code-tabs default-tab="my-element.js">

  ```js tab my-element.js
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

    /**
     * @attr
     * @reflect
     */
    foo = 'foo';

    /**
     * @internal
     */
    _privateThing = 1;

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

  ```json tab custom-elements.json
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
                "description": "Controls the color of foo",
                "name": "--text-color"
              },
              {
                "description": "Controls the color of bar",
                "name": "--background-color"
              }
            ],
            "cssParts": [
              {
                "description": "Styles the color of bar",
                "name": "bar"
              }
            ],
            "slots": [
              {
                "description": "You can put some elements here",
                "name": "container"
              }
            ],
            "members": [
              {
                "kind": "field",
                "name": "foo",
                "type": {
                  "text": "string"
                },
                "default": "'foo'",
                "reflects": true,
                "attribute": "foo"
              },
              {
                "kind": "field",
                "name": "disabled",
                "type": {
                  "text": "boolean"
                },
                "description": "disabled state",
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
                },
                "description": "foo-event - description"
              }
            ],
            "attributes": [
              {
                "name": "foo",
                "type": {
                  "text": "string"
                },
                "default": "'foo'",
                "fieldName": "foo"
              }
            ],
            "superclass": {
              "name": "LitElement",
              "package": "lit-element"
            },
            "tagName": "my-element",
            "customElement": true
          },
          {
            "kind": "variable",
            "name": "someVariable",
            "type": {
              "text": "boolean"
            },
            "default": "true",
            "description": "This will show up in the custom-elements.json too"
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

</code-tabs>

</details>

### Supported JSDoc

| JSDoc                         | Description                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `@attr`, <br>`@attribute`     | Documents attributes for your custom element                                      |
| `@prop`, <br>`@property `     | Documents properties for your custom element                                      |
| `@part`,<br>`@csspart`        | Documents your custom elements Shadow Parts                                       |
| `@slot`                       | Documents the Slots used in your components                                       |
| `@cssprop`,<br>`@cssproperty` | Documents CSS Custom Properties for your component                                |
| `@cssState`                   | Documents the custom CSS state of your custom element when using ElementInternals |
| `@fires`,<br>`@event`         | Documents events that your component might fire                                   |
| `@tag`,<br>`@tagname`         | Documents the name of your custom element                                         |
| `@summary`                    | Documents a short summary                                                         |
| `@internal`,<br>`@ignore`     | To omit documentation of internal details                                         |
| `@default`                    | Documents the default value for a property                                        |

```js
/**
 * @attr {boolean} disabled - disables the element
 * @attribute {string} foo - description for foo
 *
 * @csspart bar - Styles the color of bar
 *
 * @slot - This is a default/unnamed slot
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
      import { ts, create, litPlugin } from '@custom-elements-manifest/analyzer/browser/index.js';
      // or
      import { ts, create, litPlugin } from 'https://unpkg.com/@custom-elements-manifest/analyzer/browser/index.js';

      const modules = [ts.createSourceFile(
        'src/my-element.js',
        'export function foo() {}',
        ts.ScriptTarget.ES2015,
        true,
      )];

      const manifest = create({
        modules,
        plugins: [...litPlugin()],
        context: {dev: false},
      });

      console.log(manifest);
    </script>
  </body>
</html>
```

Because typescript doesn't follow semver, and may do breaking changes on minor or patch versions, typescript is bundled with the analyzer to avoid any typescript version mismatches.
