export const ModuleMixin = klass => class extends klass {
  moduleMixinField;
  static observedAttributes = [...super.observedAttributes, 'moduleMixin-attr'];
  moduleMixinMethod() {
    this.dispatchEvent(new Event('moduleMixin-event'))
  }
}