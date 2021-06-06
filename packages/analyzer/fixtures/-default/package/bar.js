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