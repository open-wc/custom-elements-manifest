export const MyMixin = (superClass) => class extends superClass {
  static get observedAttributes() {
    return ['ext-mixin-attr'];
  }

  constructor() {
    super();
    this.dispatchEvent(new Event('ext-mixin-event'));
    this.extMixinProp = 'prop';
  }
}
