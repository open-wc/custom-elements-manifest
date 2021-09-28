export function InputMixin<T extends Constructor<LitElement>>(superClass: T): Constructor<InputMixinInterface> & T {
  class InputElement extends superClass implements InputMixinInterface {
    /**
     * this description never gets picked up by the analyzer. 
     * so we lose some info about default values and the fact it is both property and attribute
     */
    @property({ type: Boolean }) disabled = false
  }

  return InputElement as unknown as Constructor<InputMixinInterface> & T
}
