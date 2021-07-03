import { buu } from './buu.js';

/** @type {String} - and desc */
const bazVal = 'adfs';
const fuuVal = 'fuuValue'

export class MyEl extends HTMLElement {
  foo = {a: "a", b: 'b', c: `c`};
  bar = [new SomeClass()]
  baz = bazVal;
  fuu;
  buu = buu;

  asd = true ? 'yes' : 'no';

  constructor() {
    super();
    this.fuu = fuuVal;
  }
}

// customElements.define('my-el', MyEl);
