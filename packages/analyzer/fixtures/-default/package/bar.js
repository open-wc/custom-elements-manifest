
import { LitElement } from 'lit';

/**
 * Some information here.
 */
class MyCustomEvent extends CustomEvent {
  constructor(eventInit) {
    super('my-custom-event', eventInit);
  }
}

export class MyElement extends LitElement {
  myMethod() {
      // FAILS HERE because no `type` argument is being passed to `MyCustomEvent`.
      this.dispatchEvent(new MyCustomEvent());
  }
}
