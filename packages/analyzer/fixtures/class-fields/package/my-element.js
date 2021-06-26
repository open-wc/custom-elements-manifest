/**
 * @property {string} prop5
 */
class MyEl extends HTMLElement {
  prop1 = '';
  prop2;
  prop3;
  prop4;
  prop5;

  /** @type {boolean} */
  set setter() {}
  get setter() {}

  /**
   * This is also an attribute
   * @attr
   * @type {string}
   */
  alsoAttr;

  /** @public */
  prop6;

  /** @private */
  prop7;

  /** @protected */
  prop8;

  public prop9;
  private prop10;
  protected prop11;

  static prop11;
  static prop12;

  #prop13;
  
  constructor() {
    super();
    this.prop2 = 'default';
    /** @type {SomeType} */
    this.prop3 = 'default';
    /** @type {import('foo').Some.Type} */
    this.prop4 = 'default';
  }
}
customElements.define('my-el', MyEl);