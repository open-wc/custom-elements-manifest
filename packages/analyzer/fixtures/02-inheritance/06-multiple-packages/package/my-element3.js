import { OtherElement } from '@other-package/same-path/OtherElement.js';

export class MyElement3 extends OtherElement {
  constructor() {
    super();

    this.extClassProp = 'otherValueThanProp';

  }
}
