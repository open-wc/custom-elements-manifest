import { attrDecoratorPlugin } from '../decorators/attr.js';
import { controllerPlugin } from './controller.js';
import { toKebabCase } from '../../../utils/index.js'

export const catalystPlugin2 = () => [
  attrDecoratorPlugin(attr => {
    attr.name = toKebabCase(attr.name);
    return attr;
  }),
  controllerPlugin()
]
