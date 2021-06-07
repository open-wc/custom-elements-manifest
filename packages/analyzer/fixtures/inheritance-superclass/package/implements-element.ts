import { ReactiveControllerHost } from '@lit/reactive-element';

import { BatchingElement } from './BatchingElement';

export class ImplementsElement extends BatchingElement implements Pick<ReactiveControllerHost, 'requestUpdate'> {
  classField;

  static get observedAttributes() {
    return [...super.observedAttributes, 'class-attr']
  };

  async requestUpdate(): Promise<boolean> {
    return Promise.resolve(true);
  }

  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}
