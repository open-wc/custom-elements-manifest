export class Parent extends HTMLElement {
  /**
   * @private
   */
  property1 = "";

  /**
   * @private
   */
  property2 = "";
}

customElements.define("parent-el", Parent);