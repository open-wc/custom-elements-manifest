import { LitElement, property, customElement } from 'lit-element';

/**
 * @attr my-attr
 * @prop {string} prop1 this is the description
 */
@customElement('my-element')
class MyElement extends LitElement {
  static get properties() {
    return {
      prop1: { type: String }, // has default "'foo'"
      prop2: { type: Boolean },
      attr: { type: String, attribute: 'my-attr' }, // attr output as 'my-attr'
      noAttr: { type: String, attribute: false }, // no attr output
      /** 
       * @private 
       * @type {Boolean}
       */
      _privateProp: { type: String },
      reflect: {type: Boolean, reflect: true},
      reflect2: {type: Boolean, reflect: true, attribute: 'reflect-2'},
    }
  }

  // also attr
  @property({})
  decoratedProperty = [];

  // attr output with name 'my-attr'
  @property({attribute: 'my-attr2'})
  decoratedPropertyAlsoAttr = [];

  // no attr output
  @property({attribute: false})
  decoratedPropertyNoAttr = [];

  @property({reflect: true})
  decoratedReflect;

  @property({reflect: true, attribute: 'decorated-reflect'})
  decoratedReflect2;

  constructor() {
    super();
    this.prop1 = 'foo';
  }
}