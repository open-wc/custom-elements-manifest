import { MyMixin } from '@mono/sibling-pkg';
import { MyClass } from 'ext-pkg-without-export-map';

export class MyElement extends MyMixin(MyClass) {
  constructor() {
    super();

    this.extClassProp = 'otherValueThanProp';
  }
}
