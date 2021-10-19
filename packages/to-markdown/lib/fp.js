// combinators
export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));
export const identity = x => x;

// logic
export const not = p => x => !p(x);
export const and = (p, q) => x => p(x) && q(x);
export const or = (p, q) => x => p(x) || q(x);

// accessors
export const length = x => x?.length ?? 0;
export const privacy = x => x?.privacy;
export const type = x => x?.type;
export const kind = x => x?.kind;

// predicates
export const isSame = test => x => x === test;
export const isStatic = x => x?.static ?? false;
export const isPrivate = compose(isSame('private'), privacy);
export const isProtected = compose(isSame('protected'), privacy);
export const isClass = compose(isSame('class'), privacy);
export const isMixin = compose(isSame('mixin'), privacy);
export const isLengthy = compose(x => !!x, length);
export const isClassLike = or(isClass, isMixin);
export const kindIs = test => compose(isSame(test), kind);

// helpers
export const repeat = (length, x) => Array.from({ length }, () => x);
export const capital = x => typeof x !== 'string' ? x : x.trim().replace(/^\w/, c => c.toUpperCase());
export const trace = tag => x => (console.log(tag, x), x);
export const isDefined = value => typeof value !== 'undefined' && value !== null;
