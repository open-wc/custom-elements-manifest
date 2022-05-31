import { MyMixin } from '@mono/sibling-pkg';
import { MyClass } from 'ext-pkg-without-export-map';
import { internalVar } from './internalFile.js';

export class MyElement extends MyMixin(MyClass) {
  constructor() {
    super();

    this.extClassProp = 'otherValueThanProp-' + internalVar;
  }
}
