/**
 * Button component with multiple unusual aliases
 */
import { validateInput } from 'snake_case/validation.js'
import { formatDate } from 'u/formatter.js'
import { BaseWidget } from 'c/BaseWidget.js'
import type { ButtonConfig } from '../core_types/config.js'

export class SmartButton extends BaseWidget {
  private onClick?: () => void

  constructor(config: ButtonConfig) {
    super(config)
    this.onClick = config.onClick
    this.setupEventListeners()
  }

  render(): void {
    const button = this.element as HTMLButtonElement
    button.textContent = this.config.label || 'Click me'
    button.className = 'smart-button'
    
    if (this.config.timestamp) {
      button.setAttribute('data-created', formatDate(new Date()))
    }
  }

  private setupEventListeners(): void {
    this.element.addEventListener('click', () => {
      if (this.config.label && validateInput(this.config.label)) {
        this.onClick?.()
      }
    })
  }
}