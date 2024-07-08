## Release 0.10.3
- Better support symbols used as propertys, e.g. `get [foo]() { return 1 }`

## Release 0.10.2
- Mark fields and methods starting with `#` as `private`

## Release 0.10.1
- Escape newlines and whitespaces from object output

## Release 0.10.0
- Added support for new `cssState` addition to the schema

## Release 0.9.9
- Support `@attribute` jsdoc better

## Release 0.9.8
- Skip `...super.properties` in lit's `static properties`

## Release 0.9.7
- Added `scheduleUpdate` to lit's method denylist

## Release 0.9.6
- Added `createRenderRoot` to lit's method denylist

## Release 0.9.5
- When using `litPlugin`, it now removes overriden lit specific lifecycle methods to be aligned with the behavior of overriding lit specific lifecycle methods in classes

## Release 0.9.4
- Updated the internally used TS version to `~5.4.2`. This is a breaking change for plugin authors, because the AST that typescript exposes has changed; specifically for decorators; `node.decorators` no longer exists, but decorators can now be found in `node.modifiers`. There may be other AST changes as well.

## Release 0.9.3
- Fix missing type for `initialize` hook

## Release 0.9.2
- Apply inheritance for `slots`, `cssParts` and `cssProperties`

## Release 0.9.1
- Correctly remove `resolveInitializer`s from attributes when using `litPlugin`

## Release 0.9.0
- Adds support for `initialize` hook for plugins. This also fixes a initialization issue when previously using TS's typechecker in combination with `overrideModuleCreation`

## Release 0.8.4
- Support `globalThis.customElements.define`

## Release 0.8.3
- Added support for `@default` jsdoc

## Release 0.8.2
- Fixed a bug where an `@internal` field was being accessed, causing the analyzer to error

## Release 0.8.1
- Fixed bug that crashes analyzer when using `{@link foo}` in a JSDoc comment

## Release 0.8.0
- Add support for `readonly` which has just been standardized in the schema

## Release 0.7.0
- Collect side-effectul imports during `collectPhase`, e.g.: `import 'foo';`

## Release 0.6.9
- Add support for `@part` jsdoc

## Release 0.6.8
- Detect types from lits static properties

## Release 0.6.7
- Fix `@internal` bug on decorated Lit properties

## Release 0.6.6
- Fix incorrect release

## Release 0.6.5
- Fix attr decorator for Catalyst
- Add catalyst-major-2

## Release 0.6.4
- Reexport TS for programmatic usage/module generation

## Release 0.6.3
- Filter out internal manifests

## Release 0.6.2
- Add --quiet cli parameter

## Release 0.6.1
- Re-add `#!/usr/bin/env node` to bin file

## Release 0.6.0
- Allow inclusion of third party `custom-elements.json`s from `node_modules`
- If a package has an export map, add the `./customElements` key in the export map
  - This feature can be disabled with the `--packagejson` flag, but make sure to include the path to the `custom-elements.json` in your `package.json` so that tools can find it.
  
## Release 0.5.7
- Only remove unexported declarations _after_ applying inheritance. Usecase as described in [#145](https://github.com/open-wc/custom-elements-manifest/issues/145).
- Log analyzer version number to default CLI message. Via [#144](https://github.com/open-wc/custom-elements-manifest/pull/144)

## Release 0.5.6
- Added support for `@ignore` and `@internal` jsdoc for events

## Release 0.5.5
- Pick up `@property` decorator in mixins as well

## Release 0.5.4
- Fix bug in mixin discovery

## Release 0.5.3
- Ignore default value for class fields that are arrow functions

## Release 0.5.2
- Events dont have privacy

## Release 0.5.1
- Fix parsing bug in functions with an expressionless return

## Release 0.5.0
- Allow passing config paths in CLI/config file

## Release 0.4.17
- Fix bug wrt to `.bind` calls in class constructors
- Fix some bugs in resolving of variable assignments of class properties
  - when assigned in constructor
  - improve handling for imports from `.ts` files
- Fixed resolving type from PrefixUnaryExpressions

## Release 0.4.16
- Added support for comma separated properties (handles minified code)

## Release 0.4.15
- Improve check on `customElements.define` calls
- handle optional properties in TS, e.g. `foo?: string` becomes type `string | undefined`
- Avoid adding fields that are methods as `.bind` calls in class constructors

## Release 0.4.14
- Fix comment-parser dependency

## Release 0.4.13
- Add support for class expressions in `customElements.define` calls, e.g.: `customElements.define('m-e', class extends HTMLElement{})`
- Fixed bug in lit-plugin to avoid duplicate attributes

## Release 0.4.12
- Handle `@ignore` and `@internal` jsdoc

## Release 0.4.11
- Merge together getter/setter pairs when possible
- Fix inheritance default/type bug
- Improved error logging

## Release 0.4.10
- Recognize `PrefixUnaryExpression` as being `number` when handling type inferrence

## Release 0.4.9
- Fixed bug to correctly apply default values on overridden inherited fields
- Added support for `reflect` and `attribute` on class members, according to new addition to schema https://github.com/webcomponents/custom-elements-manifest/pull/75

## Release 0.4.8
- Add support for non-primitive default values
- Resolve values/types of variables when being assigned to class fields
## Release 0.4.7
- Fixed misconception about classes that are default exported, a class that is a default export should still have the class's name in the declaration, and the export should be named `'default'` but have a reference to its declaration, which is the name of the class

## Release 0.4.6
- Removed logs from `getClassMemberDoc`

## Release 0.4.5
- Added check to see if `outdir` exists, if not, create it
- Fixed bug wrt globs
