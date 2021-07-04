export class A extends HTMLElement {
  constructor() {
    super();
    this.foo = 'hello'
  }
}

export class B extends A {
  constructor() {
    super();
    this.foo = 'bye'
  }
}
