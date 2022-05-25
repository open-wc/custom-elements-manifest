export function Mixin(superClass) {
  return class extends superClass {
    foo = 'I should not be included';
  }
}