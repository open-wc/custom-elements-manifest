export class MyEl extends LitElement {
  static get properties() {
    return {
      foo: {type: String}
    }
  }

  @property()
  bar;
}