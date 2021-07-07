// combinators
export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));
export const identity = x => x;

// predicates
export const isPrivate = x => x.privacy === 'private';
export const isProtected = x => x.privacy === 'protected';
export const kindIs = test => ({ kind }) => kind === test;

// logic
export const not = p => x => !p(x);

// helpers
export const repeat = (length, x) => Array.from({ length }, () => x);
export const capital = x => typeof x !== 'string' ? x : x.trim().replace(/^\w/, c => c.toUpperCase());
