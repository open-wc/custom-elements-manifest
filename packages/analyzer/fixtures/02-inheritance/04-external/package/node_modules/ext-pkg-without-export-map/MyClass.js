export class MyClass extends HTMLElement {
  static get observedAttributes() {
    return ['ext-class-attr'];
  }

  constructor() {
    super();
    this.dispatchEvent(new Event('ext-class-event'));

    this.extClassProp = 'prop';
  }
}
