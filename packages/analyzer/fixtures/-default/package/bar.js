export default class MyEl extends HTMLElement {
  foo = {a: "a", b: 'b', c: `c`};
  bar = [new SomeClass()]
}

customElements.define('my-el', MyEl);
