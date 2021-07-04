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