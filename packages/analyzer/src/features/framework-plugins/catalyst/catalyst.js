import { attrDecoratorPlugin } from '../decorators/attr.js';
import { controllerPlugin } from './controller.js';

export const catalystPlugin = () => [
  attrDecoratorPlugin(),
  controllerPlugin()
]
