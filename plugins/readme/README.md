# cem-plugin-readme

Generates a `README.md` file for a custom element package

## Options

| Option        | Type    | Description | Default |
| ------------- | ------- | ------------------------------------------------------ | ----------------------- |
| from          | string  | absolute path to package root                          | 2 dirs above the plugin |
| to            | string  | relative path from package root                        | `'README.md'`           |
| quiet         | boolean | suppress logs                                          | `false`                 |
| header        | string  | path to header file                                    | `undefined`             |
| footer        | string  | path to footer file                                    | `undefined`             |
| headingOffset | integer | number of levels to offset generated markdown headings | `1`                     |

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
