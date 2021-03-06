/** @internal */
export const dontIncludeMe = false; // should not be in declarations

/** @ignore */
export const meNeither = false; // should not be in declarations

export const variable = 'var';

/** @ignore */
export class IgnoreMe extends HTMLElement { }

customElements.define("ignore-me", IgnoreMe);

export class IncludeMe extends HTMLElement {
  included = 'hello world';

  /** @ignore */
  sneaky = 'deaky';

  ignoreThis2 = '';

  constructor() {
    super();

    /** @ignore */
    this.ignoreThisAlso = 'hidden';

    /** @ignore */
    this.ignoreThis2 = 'hidden';
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