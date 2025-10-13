/**
 * Event type definitions
 */
export interface CustomEvent<T = unknown> {
  type: string
  detail: T
  timestamp: number
}

export interface WidgetEvent extends CustomEvent {
  targetId: string
  bubbles: boolean
}

export type EventCallback<T = unknown> = (event: CustomEvent<T>) => void

export interface EventEmitter {
  on<T>(event: string, callback: EventCallback<T>): void
  off<T>(event: string, callback: EventCallback<T>): void
  emit<T>(event: string, detail: T): void
}