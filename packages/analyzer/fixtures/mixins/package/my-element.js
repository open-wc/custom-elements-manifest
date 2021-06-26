import { dedupeMixin } from '@open-wc/dedupe-mixin';
import { BarMixin } from './bar-mixin.js';

export const ArrowFunctionMixin = klass => class extends klass {
  foo;
  static observedAttributes = [...super.observedAttributes, 'my-attribute'];
  method() {
    this.dispatchEvent(new Event('change'))
  }
}

export function FunctionDeclarationMixin(klass) {
  return class extends klass {}
}

export function ReturnValMixin(klass) {
  class Foo extends klass {}
  return Foo;
}

export const ReturnValArrowMixin = klass => { 
  class Bar extends klass {}
  return Bar;
}

/**
 * @type {Element}
 * @param {string} klass
 */
const MixinImpl = klass => class extends BarMixin(klass) {}
export const ReexportedWrappedMixin = dedupeMixin(MixinImpl);
