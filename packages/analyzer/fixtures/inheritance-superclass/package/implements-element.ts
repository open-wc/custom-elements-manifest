import { ReactiveController, ReactiveControllerHost } from '@lit/reactive-element';

import { BatchingElement } from './BatchingElement';

export class ImplementsElement extends BatchingElement implements ReactiveControllerHost {
  classField;

  static get observedAttributes() {
    return [...super.observedAttributes, 'class-attr']
  };

  private controllers = new Set<ReactiveController>();

  addController(controller: ReactiveController): void {
    this.controllers.add(controller);
  }

  removeController(controller: ReactiveController): void {
    this.controllers.add(controller);
  }

  async requestUpdate(): Promise<boolean> {
    return Promise.resolve(true);
  }

  get updateComplete(): Promise<boolean> {
    return this.requestUpdate();
  }

  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}
