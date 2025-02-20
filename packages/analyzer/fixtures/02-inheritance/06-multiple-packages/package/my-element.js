import { MyClass } from '@ext-scoped/same-path/MyClass.js';

export class MyElement extends MyClass {
  constructor() {
    super();

    this.extClassProp = 'otherValueThanProp';
  }
}

