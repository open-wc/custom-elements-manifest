
import { LitElement } from 'lit';

export class MyElement extends LitElement {

 /**
   * @param fruit - {@link test} - This is a test param
   */
 fire() {
  this.dispatchEvent(new Event('disabled-changed'));
}
}
