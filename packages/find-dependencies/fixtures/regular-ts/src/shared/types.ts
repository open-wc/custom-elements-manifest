export interface EventHandlers {
  onClick?: (event: Event) => void
  onFocus?: (event: FocusEvent) => void
  onInput?: (event: InputEvent) => void
}

export type ComponentState = 'idle' | 'loading' | 'success' | 'error'