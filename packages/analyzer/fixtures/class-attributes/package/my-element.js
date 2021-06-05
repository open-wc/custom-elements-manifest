/**
 * @attr {boolean} attr1
 * @attribute {boolean} attr2
 */
class MyEl extends HTMLElement {
  /**
   * @attr
   */
  myField;

  static observedAttributes = ['a-a', 'b-b'];
  static get observedAttributes() {
    return ['c-c', 'd-d'];
  }
}
customElements.define('my-el', MyEl);