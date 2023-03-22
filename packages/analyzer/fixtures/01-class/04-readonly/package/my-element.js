export class MyElement extends HTMLElement {
  /** @readonly */
  foo = 1;

  readonly bar = 2;

  get baz() {}
  set baz() {}

  get qux() {}
}