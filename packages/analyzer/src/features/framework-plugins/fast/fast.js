import { attrDecoratorPlugin } from '../decorators/attr.js';
import { customElementDecoratorPlugin } from '../decorators/custom-element-decorator.js';
import { fastEventsPlugin } from './fast-events.js';

export const fastPlugin = () => [
  attrDecoratorPlugin(),
  customElementDecoratorPlugin(),
  fastEventsPlugin()
]
