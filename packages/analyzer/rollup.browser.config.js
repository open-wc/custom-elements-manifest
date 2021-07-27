import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

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
      resolve(),
      terser()
    ],
  }
]