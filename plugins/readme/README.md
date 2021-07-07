# cem-plugin-readme

Generates a `README.md` file for a custom element package

## Options

| Option        | Type    | Description | Default |
| ------------- | ------- | ------------------------------------------------------ | ----------------------- |
| from          | string  | absolute path to package root                          | 2 dirs above the plugin |
| to            | string  | relative path from package root                        | `'README.md'`           |
| headingOffset | integer | number of levels to offset generated markdown headings | `1`                     |
| header        | string  | relative path to header file                           | `undefined`             |
| footer        | string  | relative path to footer file                           | `undefined`             |

## Example

`custom-elements-manifest.config.js`

```js
import { readmePlugin } from 'cem-plugin-readme';

export default {
  plugins: [
    readmePlugin({
      header: 'README.head.md',
      footer: 'README.foot.md',
    }),
  ]
}
```
