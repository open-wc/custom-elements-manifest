// Test relative and absolute path imports with TypeScript path mapping
import { MyElement } from '../../my-element/index.js'
import { API_URL } from '../../../shared/config.js'
import type { EventHandlers } from '../../../shared/types.js'

export class SecondElement extends HTMLElement {
  private handlers: EventHandlers = {}
  private readonly myElement: MyElement

  constructor() {
    super()
    console.log('API URL:', API_URL)
    this.myElement = new MyElement()
  }

  setHandlers(handlers: EventHandlers): void {
    this.handlers = handlers
  }

  getHandlers(): EventHandlers {
    return this.handlers
  }

  getMyElement(): MyElement {
    return this.myElement
  }
}
