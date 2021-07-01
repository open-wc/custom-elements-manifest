/** @type {'adfs'} - and desc */
const bazVal = 'adfs';

export default class MyEl extends HTMLElement {
  foo = {a: "a", b: 'b', c: `c`};
  bar = [new SomeClass()]
  baz = bazVal;
}

customElements.define('my-el', MyEl);
