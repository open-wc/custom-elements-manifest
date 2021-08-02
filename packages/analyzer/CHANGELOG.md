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