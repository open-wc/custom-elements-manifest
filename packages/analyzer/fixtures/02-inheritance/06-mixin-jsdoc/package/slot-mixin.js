export function SlotMixin(superClass) {
  /**
   * @slot foo - the foo slot description
   *
   * @part header - the header container
   */
  class SlotElement extends superClass {
    renderSomeSlot() {
      return '';
    }
  }

  return SlotElement;
}
