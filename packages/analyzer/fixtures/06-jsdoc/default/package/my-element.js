/**
 * @default 'only works on properties'
 */
export class DefaultValues extends HTMLElement {
  /** @default 'default from jsdoc' */
  defaultViaJsDoc;

  /** @default 'default from jsdoc' */
  defaultWhereCodeTakesPrecedence = 'default from code';

  withoutDefault;

  constructor () {
    super()

    /**
     * Should work with "@attribute" and no name
     * @attribute
     */
    this.foo = "bar"

    /**
     * Should work with "@attribute" and a name
     * @attribute my-foo
     */
    this.myFoo = "bar"

    /**
     * Should work with "@attr" and no name
     * @attr
     */
    this.bar = "bar"

    /**
     * Should work with "@attr" and a name
     * @attr my-bar
     */
    this.myBar = "bar"
  }
}

customElements.define('default-values', DefaultValues);
