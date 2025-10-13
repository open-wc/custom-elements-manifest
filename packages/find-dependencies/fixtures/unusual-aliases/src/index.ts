/**
 * Entry point demonstrating unusual TypeScript path aliases
 * 
 * This file tests various alias patterns:
 * - snake_case/* (snake_case notation)
 * - lib2024/* (numbers in alias)
 * - myAppConfig/* (camelCase)
 * - domain.types/* (dot notation)
 * - u/* (cryptic single letter)
 * - c/* (cryptic single letter for components)
 */

// Snake case alias
import { validateInput, sanitizeString, VALIDATION_RULES } from 'snake_case/validation.js'
import { formatDate, capitalize } from 'snake_case/formatter.js'

// Numeric alias
import { BaseWidget } from 'lib2024/BaseWidget.js'
import { SmartButton } from 'lib2024/SmartButton.js'

// CamelCase alias
import { APP_SETTINGS, getApiEndpoint } from 'myAppConfig/settings.js'
import { ENV_CONFIG, getCurrentEnv } from 'myAppConfig/environment.js'

// Domain-style alias with dots
import type { ComponentConfig, ButtonConfig, WidgetState } from 'domain.types/config.js'
import type { CustomEvent, EventEmitter } from 'domain.types/events.js'

// Cryptic single-letter aliases
import { validateInput as quickValidate } from 'u/validation.js'
import { SmartButton as QuickButton } from 'c/SmartButton.js'

export class UnusualAliasDemo {
  private widgets: BaseWidget[] = []
  private state: WidgetState = {
    isVisible: true,
    isLoading: false
  }

  constructor() {
    this.initializeApp()
  }

  private initializeApp(): void {
    console.log('App version:', APP_SETTINGS.version)
    console.log('Environment:', getCurrentEnv())
    console.log('API endpoint:', getApiEndpoint('users'))
    
    // Validate using snake_case alias
    const isValid = validateInput('test input')
    console.log('Input validation:', isValid)
    
    // Format using snake_case alias
    const formattedDate = formatDate(new Date())
    console.log('Formatted date:', formattedDate)
    
    // Sanitize using snake_case alias
    const cleanString = sanitizeString('<script>alert("test")</script>')
    console.log('Sanitized:', cleanString)
    
    // Create button using lib2024 alias
    const buttonConfig: ButtonConfig = {
      tagName: 'button',
      label: capitalize('click me'),
      onClick: () => this.handleButtonClick()
    }
    
    const button = new SmartButton(buttonConfig)
    this.widgets.push(button)
    
    // Quick validation using cryptic alias
    const quickCheck = quickValidate(buttonConfig.label || '')
    console.log('Quick validation:', quickCheck)
  }

  private handleButtonClick(): void {
    console.log('Button clicked!')
    this.state.isLoading = !this.state.isLoading
  }

  public getWidgets(): BaseWidget[] {
    return this.widgets
  }

  public getState(): WidgetState {
    return { ...this.state }
  }
}

// Export everything for testing
export {
  validateInput,
  sanitizeString,
  VALIDATION_RULES,
  formatDate,
  capitalize,
  BaseWidget,
  SmartButton,
  APP_SETTINGS,
  getApiEndpoint,
  ENV_CONFIG,
  getCurrentEnv
}

export type {
  ComponentConfig,
  ButtonConfig,
  WidgetState,
  CustomEvent,
  EventEmitter
}