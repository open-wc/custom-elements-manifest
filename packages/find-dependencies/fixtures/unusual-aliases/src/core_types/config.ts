/**
 * Type definitions with domain.types alias
 */
export interface ComponentConfig {
  tagName?: string
  label?: string
  timestamp?: boolean
  className?: string
}

export interface ButtonConfig extends ComponentConfig {
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export interface WidgetState {
  isVisible: boolean
  isLoading: boolean
  error?: string
}

export type EventHandler<T = Event> = (event: T) => void

export type WidgetType = 'button' | 'input' | 'select' | 'textarea'