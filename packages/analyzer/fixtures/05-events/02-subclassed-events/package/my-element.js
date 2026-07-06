/**
 * Subclassed event that extends Event
 */
class MyCustomEvent extends Event {
  constructor(detail) {
    super('my-custom-event', { bubbles: true, composed: true });
    this.detail = detail;
  }
}

/**
 * Another subclassed event
 */
class AnotherEvent extends CustomEvent {
  constructor(data) {
    super('another-event', { detail: data });
  }
}

class MyElement extends HTMLElement {
  dispatchMyEvent() {
    this.dispatchEvent(new MyCustomEvent({ foo: 'bar' }));
  }

  dispatchAnotherEvent() {
    this.dispatchEvent(new AnotherEvent({ baz: 'qux' }));
  }
}

customElements.define('my-element', MyElement);
