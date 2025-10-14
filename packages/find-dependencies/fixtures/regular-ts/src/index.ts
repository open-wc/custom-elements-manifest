// Entry point with various import types
import { MyElement } from './components/my-element/index.js'
import { SecondElement } from './components/second-element/index.js'
import { utility } from './utils/helper.js'
import { sharedConstant } from './shared/constants.js'

// TypeScript path mapping imports
import { validation } from './utils/validation.js'
import { BaseComponent } from './components/base/BaseComponent.js'
import { API_URL } from './shared/config.js'

// Type-only imports (now should work with TypeScript parser!)
import type { ComponentConfig } from './types/config.js'

export { MyElement, SecondElement }
export { utility, sharedConstant, validation, BaseComponent, API_URL }
export type { ComponentConfig }
