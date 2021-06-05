import { ModuleMixin } from './ModuleMixin.js';

export const NestedMixin = klass => class extends klass {
  nestedMixinField;
  static observedAttributes = [...super.observedAttributes, 'nestedMixin-attr'];
  nestedMixinMethod() {
    this.dispatchEvent(new Event('nestedMixin-event'))
  }
}

export const MyMixin = klass => class extends NestedMixin(klass) {
  mixinField;
  static observedAttributes = [...super.observedAttributes, 'mixin-attr'];
  mixinMethod() {
    this.dispatchEvent(new Event('mixin-event'))
  }
}

export class MyElement extends ModuleMixin(MyMixin(HTMLElement)) {
  classField;
  static observedAttributes = ['class-attr'];
  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}