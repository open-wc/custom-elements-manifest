import {FooMixin} from "./foo-mixin.js";
import {SlotMixin} from "./slot-mixin.js";

export class MyElement extends FooMixin(SlotMixin(HTMLElement)) {
  static observedAttributes = ['class-attr'];

  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}