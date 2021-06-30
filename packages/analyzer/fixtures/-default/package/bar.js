import { LitElement } from 'lit-element';

/**
 * My component
 *
 * @prop {String} one - one desc
 */
export class MyComponent extends LitElement {

  static get properties () {
    return {
      one: { type: String },
    };
  }

  constructor () {
    super();
    this.one = null;
  }
}

window.customElements.define('cc-addon-option', MyComponent);
