/**
 * @default 'only works on properties'
 */
export class DefaultValues extends HTMLElement {
  /** @default 'default from jsdoc' */
  defaultViaJsDoc;

  /** @default 'default from jsdoc' */
  defaultWhereCodeTakesPrecedence = 'default from code';

  withoutDefault;
}

customElements.define('default-values', DefaultValues);
