import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

const commentParser = require.resolve('comment-parser');

export default [
  /** 
   * Main build
   */
  {
    input: 'src/create.js',
    output: {
      globals: {
        typescript: 'ts'
      },
      dir: 'browser',
      name: 'analyzer',
      format: 'iife'
    },
    plugins: [
      replace({
        'parse.parse': 'parse',
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
      nodeResolve({
        resolveOnly: ['comment-parser']
      }),
    ]
  },
  /**
   * Framework plugins
   */
  ...['catalyst', 'fast', 'lit', 'stencil'].map(name => {
    return {
      input: `src/features/framework-plugins/${name}/${name}.js`,
      output: {
        globals: {
          typescript: 'ts'
        },
        dir: 'browser',
        name: name,
        format: 'iife'
      },
    }
  })
];

