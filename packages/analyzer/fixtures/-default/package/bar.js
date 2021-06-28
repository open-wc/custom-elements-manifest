
import { LitElement } from 'lit-element';

export class MyElement extends LitElement {
  @property({ type: Boolean }) a: boolean = false;
  @property({ type: Boolean }) b: string = '';
}
