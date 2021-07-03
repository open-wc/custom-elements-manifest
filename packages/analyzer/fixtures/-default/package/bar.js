export default class MyElement extends HTMLElement {

  /** 
   * @attr my-foo
   * @reflect
   */
  foo = 'asd'

}

customElements.define('my-el', MyElement);