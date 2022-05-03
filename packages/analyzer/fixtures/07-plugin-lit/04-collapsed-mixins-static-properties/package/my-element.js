import { LitElement } from 'lit';

class MyElement extends MixinB(MyField) {
  static properties = {
    lastName: { type: String },
  };

  constructor() {
    super();
    this.lastName = 'Doe';
  }
}
customElements.define('my-element', MyElement);

function MixinB(superClass) {
  class MixinBImplementation extends superClass {
    static properties = {
      mixB: { type: Boolean },
    };

    constructor() {
      super();
      this.mixB = false;
    }
  }

  return MixinBImplementation;
}

class MyField extends MixinA(LitElement) {
  static properties = {
    firstName: { type: String },
  };

  constructor() {
    super();
    this.firstName = 'John';
  }
}

function MixinA(superClass) {
  class MixinAImplementation extends superClass {
    static properties = {
      mixA: { type: Boolean },
    };

    constructor() {
      super();
      this.mixA = false;
    }
  }

  return MixinAImplementation;
}
