import { LitElement } from 'lit-element';

export class MyComponent extends LitElement {

  static get properties () {
    return {
      /** 
       * @private 
       * @type {Boolean}
       */
      _privateProp: { type: String },
    };
  }

}