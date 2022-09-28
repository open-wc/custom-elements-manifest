import { controller, attr } from '@github/catalyst'

@controller
export class HelloWorldElement extends HTMLElement {
  @attr fooBar = 'hello'

  bar;
}