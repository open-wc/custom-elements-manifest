export function AMixin(superclass) {
  return class A<T, U> extends superclass {
    t = new C<T, U>();
  }
}