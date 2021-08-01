export class GenericSwitch extends HTMLElement {
  constructor() {
    super();
    this.__onClick = this.__onClick.bind(this);
  }

  __onClick(){}
}