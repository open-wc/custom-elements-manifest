# @custom-elements-manifest/to-markdown

Custom-elements.json is a file format that describes custom elements. This format will allow tooling and IDEs to give rich information about the custom elements in a given project. It is, however, very experimental and things are subject to change. Follow the discussion [here](https://github.com/webcomponents/custom-elements-manifest).

This library takes a Custom Elements Manifest and renders it to markdown.

## Usage

Install:
```bash
npm i -S @custom-elements-manifest/to-markdown
```

Import and use in your code:
```js
import fs from 'fs';
import { customElementsManifestToMarkdown } from '@custom-elements-manifest/to-markdown';

const manifest = JSON.parse(fs.readFileSync('./custom-elements.json', 'utf-8'));
const markdown = customElementsManifestToMarkdown(manifest);

fs.writeFileSync('./custom-elements.md', markdown);
```

### Options

| Option             | Type                         | Default | Description |
| -------------      | ---------------------------- | ------- | ----------- |
| headingOffset      | Integer                      | 0       | Offset the heading level by this number |
| private            | `'all'\|'details'\|'hidden'` | `'all'` | See [Private Members](#private-members) |
| omitDeclarations   | `OptionalDeclarations[]`     | []      | See [Omit Declarations](#omit-declarations) |
| omitSections       | `OptionalSections[]`         | []      | See [Omit Sections](#omit-sections) |
| classNameFilter    | `string \| (() => string)`   | `'.*'`  | See [Class Name Filter](#class-name-filter) |

#### Private Members

The `private` option controls how private members appear in the markdown.
- `'all'`: private members appear alongside public members according to source order
- `'hidden'`: private members do not appear at all in markdown, but protected members do
- `'details'`: private and protected members appear in a details disclosure widget below the table

#### Omit Declarations

The `omitDeclarations` option is a `string[]` that controls which kinds of entities are rendered in the final markdown output. The four declaration types are:

- mixins
- variables
- functions
- exports

The following is an example config that would filter out all four declaration types:

```js
customElementsManifestToMarkdown(manifest, {
  omitDeclarations: ['mixins', 'variables', 'functions', 'exports' ]
})
```
**Note: ** Mixins can be rendered both as declarations AND as sections inside a declaration. The `omitDeclarations` option for `mixins` will only filter out top level mixin declarations. To filter out mixin sections from a `class` declaration, use the `mixin` filter from `omitSections`.

#### Omit Sections

The `omitSections` option is a `string[]` that controls which sections of a declaration's full entry in the manifest.json should be rendered in the final markdown output. The section names are:

- mainHeading
- superClass
- fields
- methods
- staticFields
- staticMethods
- slots
- events
- attributes
- cssProperties
- cssParts
- mixins

The following is an example config showing how to filter out a few sections:

```js
customElementsManifestToMarkdown(manifest, {
  // static fields and static methods tables will not be present
  // in the markdown result
  omitSections: [ 'staticFields', 'staticMethods' ]
})
```

#### Class Name Filter
Depending on the source files you pass to the analyzer, your `custom-elements-manifest.json` may contain more class file declarations than you need for the final markdown output. The `classNameFilter` option accepts a regex as a string (or a function that returns one) that will be used to filter out class declarations before rendering.

```js
customElementsManifestToMarkdown(manifest, {
  classNameFilter: () => {
    // some logic
    return `(${prefix}-*|SuperClassExact)`; // filters out every class name that doesnt match the regex provided
  } 
})
```

## Demo

```js
customElementsManifestToMarkdown(manifest, {
  headingOffset: 1,
  private: 'details',
})
```
<details><summary>Source</summary>

```json
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "./fixtures/-TEST/package/my-element.js",
      "declarations": [
        {
          "kind": "class",
          "name": "SuperClass",
          "events": [
            {
              "name": "custom-event",
              "type": {
                "text": "SuperCustomEvent"
              },
              "description": "this is custom"
            }
          ],
          "superclass": {
            "name": "LitElement",
            "package": "lit-element"
          },
          "members": [
            {
              "kind": "method",
              "name": "superClassMethod",
              "privacy": "public"
            }
          ]
        },
        {
          "kind": "class",
          "name": "MyElement",
          "cssProperties": [
            {
              "name": "--background-color",
              "description": "Controls the color of bar"
            }
          ],
          "cssParts": [
            {
              "name": "bar",
              "description": "Styles the color of bar"
            }
          ],
          "slots": [
            {
              "name": "container",
              "description": "You can put some elements here"
            }
          ],
          "events": [
            {
              "name": "my-event",
              "type": {
                "text": "Event"
              }
            },
            {
              "name": "custom-event",
              "type": {
                "text": "SuperCustomEvent"
              },
              "description": "this is custom",
              "inheritedFrom": {
                "name": "SuperClass",
                "module": "./fixtures/-TEST/package/my-element.js"
              }
            }
          ],
          "mixins": [
            {
              "name": "LocalizeMixin",
              "package": "lion"
            },
            {
              "name": "Mixin",
              "module": "./fixtures/-TEST/package/my-element.js"
            }
          ],
          "superclass": {
            "name": "SuperClass",
            "module": "./fixtures/-TEST/package/my-element.js"
          },
          "attributes": [
            {
              "name": "prop-1",
              "fieldName": "prop1"
            },
            {
              "name": "prop2",
              "fieldName": "prop2"
            }
          ],
          "members": [
            {
              "kind": "field",
              "name": "prop1",
              "privacy": "public"
            },
            {
              "kind": "field",
              "name": "prop2",
              "privacy": "public"
            },
            {
              "kind": "field",
              "name": "prop3",
              "privacy": "public",
              "type": {
                "text": "boolean"
              },
              "default": "true"
            },
            {
              "kind": "field",
              "name": "foo",
              "type": {
                "text": "string"
              },
              "privacy": "private",
              "description": "description goes here",
              "default": "'bar'"
            },
            {
              "kind": "method",
              "name": "instanceMethod",
              "privacy": "public",
              "description": "Some description of the method here",
              "return": {
                "type": {
                  "text": ""
                }
              },
              "parameters": [
                {
                  "name": "e",
                  "type": {
                    "text": "Event"
                  }
                },
                {
                  "name": "a",
                  "type": {
                    "text": "string"
                  },
                  "description": "some description"
                }
              ]
            },
            {
              "kind": "field",
              "name": "mixinProp",
              "type": {
                "text": "number"
              },
              "privacy": "protected",
              "default": "1",
              "inheritedFrom": {
                "name": "Mixin",
                "module": "./fixtures/-TEST/package/my-element.js"
              }
            },
            {
              "kind": "method",
              "name": "superClassMethod",
              "privacy": "public",
              "inheritedFrom": {
                "name": "SuperClass",
                "module": "./fixtures/-TEST/package/my-element.js"
              }
            }
          ],
          "tagName": "my-element"
        },
        {
          "kind": "variable",
          "name": "variableExport",
          "description": "this is a var export",
          "type": {
            "text": "boolean"
          }
        },
        {
          "kind": "variable",
          "name": "stringVariableExport",
          "description": "this is a string var export",
          "type": {
            "text": "string"
          }
        },
        {
          "kind": "function",
          "name": "functionExport",
          "description": "This is a function export",
          "return": {
            "type": {
              "text": "boolean"
            }
          },
          "parameters": [
            {
              "name": "a",
              "type": {
                "text": "string"
              }
            },
            {
              "name": "b",
              "type": {
                "text": "boolean"
              }
            }
          ]
        },
        {
          "kind": "mixin",
          "name": "MyMixin4",
          "parameters": [
            {
              "name": "klass",
              "type": {
                "text": "*"
              },
              "description": "This is the description"
            },
            {
              "name": "foo",
              "type": {
                "text": "string"
              },
              "description": "Description goes here"
            }
          ]
        },
        {
          "kind": "mixin",
          "name": "Mixin",
          "parameters": [
            {
              "name": "klass",
              "type": {
                "text": "*"
              },
              "description": "This is the description"
            }
          ],
          "members": [
            {
              "kind": "field",
              "name": "mixinProp",
              "type": {
                "text": "number"
              },
              "privacy": "protected",
              "default": "1"
            }
          ]
        }
      ],
      "exports": [
        {
          "kind": "js",
          "name": "SuperClass",
          "declaration": {
            "name": "SuperClass",
            "module": "./fixtures/-TEST/package/my-element.js"
          }
        },
        {
          "kind": "custom-element-definition",
          "name": "my-element",
          "declaration": {
            "name": "MyElement",
            "module": "./fixtures/-TEST/package/my-element.js"
          }
        },
        {
          "kind": "js",
          "name": "variableExport",
          "declaration": {
            "name": "variableExport",
            "module": "./fixtures/-TEST/package/my-element.js"
          }
        },
        {
          "kind": "js",
          "name": "stringVariableExport",
          "declaration": {
            "name": "stringVariableExport",
            "module": "./fixtures/-TEST/package/my-element.js"
          }
        },
        {
          "kind": "js",
          "name": "functionExport",
          "declaration": {
            "name": "functionExport",
            "module": "./fixtures/-TEST/package/my-element.js"
          }
        }
      ]
    }
  ]
}
```

</details>

<details><summary>Result</summary>

  ## `./fixtures/-TEST/package/my-element.js`:

  ### class: `SuperClass`

  #### Superclass

  | Name       | Module | Package     |
  | ---------- | ------ | ----------- |
  | LitElement |        | lit-element |

  #### Methods

  | Name             | Privacy | Description | Parameters | Return | Inherited From |
  | ---------------- | ------- | ----------- | ---------- | ------ | -------------- |
  | superClassMethod | public  |             |            |        |                |

  #### Events

  | Name         | Type               | Description    | Inherited From |
  | ------------ | ------------------ | -------------- | -------------- |
  | custom-event | `SuperCustomEvent` | this is custom |                |

  <hr/>

  ### class: `MyElement`, `my-element`

  #### Superclass

  | Name       | Module                                 | Package |
  | ---------- | -------------------------------------- | ------- |
  | SuperClass | ./fixtures/-TEST/package/my-element.js |         |

  #### Mixins

  | Name          | Module                                 | Package |
  | ------------- | -------------------------------------- | ------- |
  | LocalizeMixin |                                        | lion    |
  | Mixin         | ./fixtures/-TEST/package/my-element.js |         |

  #### Fields

  | Name  | Privacy | Type      | Default | Description | Inherited From |
  | ----- | ------- | --------- | ------- | ----------- | -------------- |
  | prop1 | public  |           |         |             |                |
  | prop2 | public  |           |         |             |                |
  | prop3 | public  | `boolean` | `true`  |             |                |

  #### Methods

  | Name             | Privacy | Description                         | Parameters            | Return | Inherited From |
  | ---------------- | ------- | ----------------------------------- | --------------------- | ------ | -------------- |
  | instanceMethod   | public  | Some description of the method here | `e: Event, a: string` |        |                |
  | superClassMethod | public  |                                     |                       |        | SuperClass     |

  #### Events

  | Name         | Type               | Description    | Inherited From |
  | ------------ | ------------------ | -------------- | -------------- |
  | my-event     | `Event`            |                |                |
  | custom-event | `SuperCustomEvent` | this is custom | SuperClass     |

  #### Attributes

  | Name   | Field | Inherited From |
  | ------ | ----- | -------------- |
  | prop-1 | prop1 |                |
  | prop2  | prop2 |                |

  #### CSS Properties

  | Name               | Description               |
  | ------------------ | ------------------------- |
  | --background-color | Controls the color of bar |

  #### Slots

  | Name      | Description                    |
  | --------- | ------------------------------ |
  | container | You can put some elements here |

  <details><summary>Private API</summary>

  #### Fields

  | Name      | Privacy   | Type     | Default | Description           | Inherited From |
  | --------- | --------- | -------- | ------- | --------------------- | -------------- |
  | foo       | private   | `string` | `'bar'` | description goes here |                |
  | mixinProp | protected | `number` | `1`     |                       | Mixin          |

  </details>

  <hr/>

  ### mixin: `MyMixin4`

  #### Parameters

  | Name  | Type     | Default | Description             |
  | ----- | -------- | ------- | ----------------------- |
  | klass | `*`      |         | This is the description |
  | foo   | `string` |         | Description goes here   |

  <hr/>

  ### mixin: `Mixin`

  #### Parameters

  | Name  | Type | Default | Description             |
  | ----- | ---- | ------- | ----------------------- |
  | klass | `*`  |         | This is the description |

  <details><summary>Private API</summary>

  #### Fields

  | Name      | Privacy   | Type     | Default | Description | Inherited From |
  | --------- | --------- | -------- | ------- | ----------- | -------------- |
  | mixinProp | protected | `number` | `1`     |             |                |

  </details>

  <hr/>

  ### Variables

  | Name                 | Description                 | Type      |
  | -------------------- | --------------------------- | --------- |
  | variableExport       | this is a var export        | `boolean` |
  | stringVariableExport | this is a string var export | `string`  |

  <hr/>

  ### Functions

  | Name           | Description               | Parameters              | Return    |
  | -------------- | ------------------------- | ----------------------- | --------- |
  | functionExport | This is a function export | `a: string, b: boolean` | `boolean` |

  <hr/>

  ### Exports

  | Kind                      | Name                 | Declaration          | Module                                 | Package |
  | ------------------------- | -------------------- | -------------------- | -------------------------------------- | ------- |
  | js                        | SuperClass           | SuperClass           | ./fixtures/-TEST/package/my-element.js |         |
  | custom-element-definition | my-element           | MyElement            | ./fixtures/-TEST/package/my-element.js |         |
  | js                        | variableExport       | variableExport       | ./fixtures/-TEST/package/my-element.js |         |
  | js                        | stringVariableExport | stringVariableExport | ./fixtures/-TEST/package/my-element.js |         |
  | js                        | functionExport       | functionExport       | ./fixtures/-TEST/package/my-element.js |         |

</details>
