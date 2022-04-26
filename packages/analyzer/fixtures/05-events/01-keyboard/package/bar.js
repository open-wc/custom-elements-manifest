
class MyElement extends HTMLElement {
  foo() {
    /**
     * @private
     */
    this.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'Tab'
      })
    );
  }
}

customElements.define('my-element', MyElement);
