
import { MyClass } from 'ext-pkg-without-export-map';


export class MyElement2 extends MyClass {
  constructor() {
    super();

    this.extClassProp = 'otherValueThanProp';
  }
}
