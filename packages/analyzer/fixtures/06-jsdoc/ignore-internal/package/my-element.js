/** @internal */
export const dontIncludeMe = false; // should not be in declarations

/** @ignore */
export const meNeither = false; // should not be in declarations

export const variable = 'var';

/** @ignore */
export class IgnoreMe extends HTMLElement { }

/** @deprecated */
export class IamDepricated extends HTMLElement { }

/** @deprecated the reason for the deprecation. */
export class IamDepricatedWithReason extends HTMLElement { }

customElements.define("ignore-me", IgnoreMe);

export class IncludeMe extends HTMLElement {
  included = 'hello world';

  /** @ignore */
  sneaky = 'deaky';


  constructor() {
    super();

    /** @ignore */
    this.ignoreThisAlso = 'hidden';
  }

  connectedCallback() {
    super.connectedCallback?.();

    /** @ignore */
    this.dispatchEvent(
        new CustomEvent('my-event', {
          detail: 'foo'
        })
    )

    /** @internal */
    this.dispatchEvent(
        new CustomEvent('my-other-event', {
          detail: 'bar'
        })
    )
  }

  /** @deprecated */
  imDeprecated() {

  }

  /** @deprecated the reason for the deprecation. */
  imDeprecatedWithReason() {
  
  }

  /** @internal */
  hideMe() {
    return '🙈'
  }
}

customElements.define("include-me", IncludeMe);

/** @ignore */
var ignoreMePlease = 'haha';

/** @internal */
var excludeMe, andMe = 'something private';

export {
  ignoreMePlease,
  excludeMe,
  andMe,
}
