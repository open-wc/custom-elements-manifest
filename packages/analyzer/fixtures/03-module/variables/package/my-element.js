let var1, var2, var3A, var4 = true;

const dontIncludeMe = false; // should not be in declarations

export { var1, var2 };
export { var3A as var3B, var4 };
export let var5, var6;
export let var7 = var6 = var5;
export function function1() {}
export class Class1 {}

// type inference
export const typeinferrence = '';
export const asConst = 'const' as const;
export const asConstRef = {foo:'bar'} as const;
