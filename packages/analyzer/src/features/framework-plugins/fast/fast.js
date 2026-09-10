import { attrDecoratorPlugin } from '../decorators/attr.js';
import { customElementDecoratorPlugin } from '../decorators/custom-element-decorator.js';
import { fastDefinePlugin } from './fast-define.js';

export const fastPlugin = () => [
  attrDecoratorPlugin(),
  customElementDecoratorPlugin(),
  fastDefinePlugin()
]
