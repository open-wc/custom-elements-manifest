import { buu } from 'buu';
const bar = 'bar';
const foo = 'foo';

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

  set getter2(){}
  /** @type {string} */
  get getter2(){}

  static getter2;

  /**
   * This is also an attribute
   * @attr also-attr
   * @reflect
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

  // type inference
  bool = false;
  str = '';
  num = 1;
  arr = [{a: "a", b: 'b', c: `c`}, 1, "a", 'b', `c`];
  obj = {a: "a", b: 'b', c: `c`};
  asVariable = bar;
  asVariableAssignedInConstructor;
  asVariableThirdParty = buu;
  nu = null;
  asConst = 'const' as const;
  asConstRef = {foo:'bar'} as const;

  /** @type {Foo} */
  strOverwritten = '';

  #prop13;

  optional?: string;

  prefixUnary1 = +1;
  prefixUnary2 = -1;
  prefixUnary3 = !1;

  arrowfn = () => {
    console.log('dont output me')
  }

  #truePrivateField = 1;
  #truePrivateMethod() {}

  constructor() {
    super();
    this.prop2 = 'default';
    /** @type {SomeType} - prop3 description */
    this.prop3 = 'default';
    /** @type {import('foo').Some.Type} */
    this.prop4 = 'default';

    this.commaprop1 = 'default',
    this.commaprop2 = true,
    this.commaprop3 = 123;

    this.asVariableAssignedInConstructor = foo;
  }
}
customElements.define('my-el', MyEl);
