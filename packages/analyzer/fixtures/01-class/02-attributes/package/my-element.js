/**
 * @attr {boolean} attr1
 * @attribute {boolean} attr2
 */
class MyEl extends HTMLElement {
  /**
   * @attr
   * @reflect
   */
  myField;

  static observedAttributes = ['a-a', 'b-b'];
  static get observedAttributes() {
    return ['c-c', 'd-d'];
  }
}
customElements.define('my-el', MyEl);

export class Foo extends HTMLElement { 
  /**
   * this is the field description
   * @type {string}
   * @attr my-attr this is the attr description
   */
  foo = '';

  member;

  constructor() {
    super();
    /** @type {string} this is the description */
    this.member = '';
  }

  static observedAttributes = ['my-attr']
}