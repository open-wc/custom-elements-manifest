/**
 * Base UI component with lib2024 alias
 */
import type { ComponentConfig } from '../core_types/config.js'

export abstract class BaseWidget {
  protected config: ComponentConfig
  protected element: HTMLElement

  constructor(config: ComponentConfig) {
    this.config = config
    this.element = document.createElement(config.tagName || 'div')
  }

  abstract render(): void
  
  mount(parent: HTMLElement): void {
    parent.appendChild(this.element)
  }
}