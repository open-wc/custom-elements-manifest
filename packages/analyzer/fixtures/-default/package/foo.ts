// import { bar } from './bar';

// export class MyEl extends HTMLElement {
//   foo = bar;
// }

import { bar } from './bar';

export class MyEl extends HTMLElement {
  constructor() {
    super();
    this.foo = bar;
  }
}