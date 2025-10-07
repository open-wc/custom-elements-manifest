import { Parent } from "./parent.js";

export class Child extends Parent {
  /**
   * @public
   */
  property1 = true;

  property2 = true;
}

customElements.define("child-el", Child);