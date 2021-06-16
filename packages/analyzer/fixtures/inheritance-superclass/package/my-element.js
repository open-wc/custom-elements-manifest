import { BatchingElement } from './BatchingElement.js';

class MyElement extends BatchingElement {
  classField;
  static observedAttributes = [...super.observedAttributes, 'class-attr'];
  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}

customElements.define('my-element', MyElement);
