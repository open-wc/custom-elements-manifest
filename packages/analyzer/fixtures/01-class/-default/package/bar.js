
import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js'

export class MyElement extends LitElement {
  /**
   * A property set internally that reflects up to an attribute that is only used for styling, so is marked as internal
   * 
   * @internal
   */
  @property({ type: Boolean, reflect: true })
  private flagged = false;
}
