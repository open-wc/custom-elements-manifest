import { controller, attr } from '@github/catalyst'

@controller
class HelloWorldElement extends HTMLElement {
  @attr fooBar = 'hello'

  bar;
}