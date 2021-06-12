import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
const commentParser = require.resolve('comment-parser');

const IGNORE = [
  'perf_hooks',
  'fs',
  'path',
  'os',
  'crypto',
  'buffer',
  'source-map-support',
  'inspector',
]

export default [
  {
    input: 'src/browser-entrypoint.js',
    output: {
      file: 'browser/index.js',
      format: 'esm',
    },
    plugins: [
      commonjs({
        ignore: (id) => IGNORE.includes(id),
      }),
      {
      load(id) {
        if (id === commentParser) {
          return `
  import { parse } from 'comment-parser/es6/index.js'
  export default parse;
          `;
          }
        }  
      },
      resolve(),
      terser()
    ],
  }
]