export function InputMixin(superClass) {
  class InputElement extends superClass {
    /**
     * this description never gets picked up by the analyzer. 
     * so we lose some info about default values and the fact it is both property and attribute
     */
    @property({ type: Boolean }) disabled = false
  }

  return InputElement;
}
