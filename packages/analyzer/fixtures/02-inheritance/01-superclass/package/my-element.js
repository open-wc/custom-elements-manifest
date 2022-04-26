import { BatchingElement } from './BatchingElement.js';

export class MyElement extends BatchingElement {
  classField;
  static observedAttributes = [...super.observedAttributes, 'class-attr'];
  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
  constructor() {
    super();
    this.overriddenField = 'bye';
  }
}
