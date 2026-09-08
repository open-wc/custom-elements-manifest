const CUSTOM_EVENT_NAME = 'custom-name';

/**
 * @event {Event} custom-name - Declared with JSDoc, because the name is held in a constant.
 */
class MyElement extends HTMLElement {
  foo() {
    /**
     * The event name is an identifier rather than a literal, so it cannot be resolved here
     * and no event is inferred from this call.
     */
    this.dispatchEvent(new Event(CUSTOM_EVENT_NAME));
  }

  bar() {
    this.dispatchEvent(new Event('literal-name'));
  }
}

customElements.define('my-element', MyElement);
