/**
 *
 * @attribute {boolean} foo - the foo attribute
 * @cssProp
 *
 * @constructor
 */
export const FooMixin = klass => class extends klass {
  /**
   * @private
   */
  __foo;

  get foo() {
    return this.__foo;
  }

  set foo(v) {
    this.__foo = v;
  }
}
