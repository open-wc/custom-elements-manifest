import { ReactiveControllerHost } from '@lit/reactive-element';

import { BatchingElement } from './BatchingElement';

class ImplementsElement extends BatchingElement implements Pick<ReactiveControllerHost, 'implementsMethod'> {
  classField;

  static get observedAttributes() {
    return [...super.observedAttributes, 'class-attr']
  };

  async implementsMethod() {}

  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}

customElements.define('implements-element', ImplementsElement);