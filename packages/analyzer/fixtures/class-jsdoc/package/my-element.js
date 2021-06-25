// typedef should be ignored
/**
 * @typedef {Object} MenuItem
 * @property {string} icon
 * @property {string} id
 * @property {string} label
 */

/**
 * @attr {boolean} disabled - disables the element
 * @attribute {string} foo - description for foo
 *
 * @csspart bar - Styles the color of bar
 *
 * @slot - This is the default slot
 * @slot container - You can put some elements here
 *
 * @cssprop --text-color - Controls the color of foo
 * @cssproperty [--background-color=red] - Controls the color of bar
 *
 * @prop {boolean} prop1 - some description
 * @property {number} prop2 - some description
 *
 * @fires custom-event - some description for custom-event
 * @fires {Event} typed-event - some description for typed-event
 * @event {CustomEvent} typed-custom-event - some description for typed-custom-event
 * 
 * @summary This is MyElement
 * 
 * @tag my-element
 * @tagname my-element
 */
export class MyElement extends HTMLElement {}