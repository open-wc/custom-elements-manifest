import { MyMixin } from '@ext-scoped/with-export-map';
import { MyClass } from 'ext-pkg-without-export-map';
import { MyClassWithMyMixin } from 'ext-pkg-without-export-map';

export class MyElement extends MyMixin(MyClass) {
  constructor() {
    super();

    this.extClassProp = 'otherValueThanProp';
  }
}

export class MyElement2 extends MyClassWithMyMixin {
  constructor() {
    super();

    this.extMixinProp = 'otherValueThanProp';
  }
}
