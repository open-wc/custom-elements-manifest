

/**
 * @attr my-attr description goes here
 */
export class MyElement extends HTMLElement {
  message = ''

  constructor() {
    super();
    /** @type {string} - some description */
    this.message = 'bar';
  }
}