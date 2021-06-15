export const ModuleMixin = klass => class extends klass {
  moduleMixinField;
  static observedAttributes = [...super.observedAttributes, 'moduleMixin-attr'];
  /** @ignore */
  hidden = 'hidden';
  moduleMixinMethod() {
    this.dispatchEvent(new Event('moduleMixin-event'))
  }
}
