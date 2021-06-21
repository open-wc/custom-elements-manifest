
class MyEl extends HTMLElement {
  /** @ignore */
  priv;

  priv2;

  constructor() {
    super();

    /** @ignore */
    this.priv2 = 'hidden';
  }
}
customElements.define('my-el', MyEl);
