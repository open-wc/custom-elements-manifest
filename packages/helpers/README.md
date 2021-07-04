# @custom-elements-manifest/helpers

Custom-elements.json is a file format that describes custom elements. This format will allow tooling and IDEs to give rich information about the custom elements in a given project.

This library aims to ship some helpers to ease working with the `custom-elements.json` format.

## Install

```bash
npm i -S @custom-elements-manifest/helpers
```

## Usage

```js
// Node
import { CustomElementsJson } from '@custom-elements-manifest/helpers';

const manifest = JSON.parse(fs.readFileSync('./custom-elements.json', 'utf-8'));
const customElementsJson = new CustomElementsJson(manifest);

// Browser
import { CustomElementsJson } from 'https://unpkg.com/@custom-elements-manifest?module';
import manifest from './custom-elements.json' assert { type: 'json' };

const customElementsJson = new CustomElementsJson(manifest);
```

## Methods

### `getByTagName`

Gets a declaration by tagName

```js
customElementsJson.getByTagName('my-element');
```

### `getByClassName`
Get a declaration by className

```js
customElementsJson.getByClassName('MyElement');
```

### `getByMixinName`
Gets a declaration by mixinName

```js
customElementsJson.getByMixinName('MyElement');
```
### `getCustomElements`
Gets all custom elements

```js
customElementsJson.getCustomElements();
```

### `getClasses`
Gets all classes. Note that this may include classes that are not custom elements

```js
customElementsJson.getClasses();
```

### `getFunctions`
Gets all functions

```js
customElementsJson.getFunctions();
```

### `getVariables`
Gets all variables

```js
customElementsJson.getVariables();
```

### `getDefinitions`
Gets all custom element definitions.

```js
customElementsJson.getDefinitions();
```

### `getMixins`
Gets all mixins

```js
customElementsJson.getMixins();
```

### `getInheritanceTree`

Gets an elements inheritance tree, including superclasses and mixins

```js
customElementsJson.getInheritanceTree('MyElement');
```

### `getModuleForClass`

Gets the module path for a given class

```js
customElementsJson.getModuleForClass('MyElement');
```

### `getModuleForMixin`

Gets the module path for a given mixin

```js
customElementsJson.getModuleForMixin('FooMixin');
```

## Helpers

### Package
- `hasModules`
- `hasExports`
- `hasDeclarations`
- `isJavascriptModule`

### Exports
- `isCustomElementExport`
- `isJavaScriptExport`

### Declarations
- `isClass`
- `isMixin`
- `isCustomElement`
- `isFunction`
- `isVariable`

### CustomElement
- `hasAttributes`
- `hasCssParts`
- `hasCssProperties`
- `hasEvents`
- `hasSlots`
- `hasMethods`
- `hasFields`
- `hasMixins`

### ClassMember
- `isField`
- `isMethod`