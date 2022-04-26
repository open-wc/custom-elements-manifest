import { LitElement } from 'lit';

class MyElement extends InputMixin(LitElement) {
  static properties = {
    firstName: { type: String }
  }

  constructor() {
    super();
    this.firstName = 'John';
  }
}
customElements.define('my-element', MyElement);

export function InputMixin(superClass) {
  class InputMixinImplementation extends superClass {
    static properties = {
      disabled: { type: Boolean }
    }

    constructor() {
      super();
      this.disabled = false;
    }
  }

  return InputMixinImplementation;
}
