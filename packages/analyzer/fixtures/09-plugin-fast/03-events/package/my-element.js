import { FASTElement, customElement } from '@microsoft/fast-element';

@customElement('event-emitter')
export class EventEmitter extends FASTElement {
  emitValue() {
    this.$emit('value-changed', { value: 'next' });
  }

  emitDynamic(name) {
    this.$emit(name);
  }
}
