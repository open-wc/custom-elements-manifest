import { LitElement, property, customElement } from 'lit';

@customElement('my-element')
class MyElement extends InputMixin(LitElement) {
  @property({})
  firstName = 'John';
}

export function InputMixin(superClass) {
  class InputMixinImplementation extends superClass {
    @property({ type: Boolean }) disabled = false
  }

  return InputMixinImplementation;
}
