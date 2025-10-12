import type { MyElementElement } from './types.js';


declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}

class MyElement {

}
