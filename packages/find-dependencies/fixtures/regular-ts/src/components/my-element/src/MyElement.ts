import { BaseComponent } from '../../base/BaseComponent.js'
import { validation } from '../../../utils/validation.js'

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}

export class MyElement extends BaseComponent {
  private value: string = ''

  constructor() {
    super({
      name: 'my-element',
      version: '1.0.0',
      enabled: true
    })
  }

  setValue(newValue: string): void {
    if (validation(newValue)) {
      this.value = newValue
    }
  }

  getValue(): string {
    return this.value
  }
}
