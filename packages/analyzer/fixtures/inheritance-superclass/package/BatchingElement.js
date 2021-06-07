export class BatchingElement extends HTMLElement {
  superClassField;
  static observedAttributes = [...super.observedAttributes, 'superClass-attr'];
  superClassMethod() {
    this.dispatchEvent(new Event('superClass-event'))
  }
}
