// Use TypeScript path mapping import
import type { ComponentConfig } from '../../types/config.js'

export class BaseComponent {
  protected config: ComponentConfig

  constructor(config: ComponentConfig) {
    this.config = config
  }

  public getName(): string {
    return this.config.name
  }

  public isEnabled(): boolean {
    return this.config.enabled
  }
}
