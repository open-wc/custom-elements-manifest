# Unusual Aliases Test Case

This fixture demonstrates TypeScript path mapping with non-standard alias patterns, proving that the `find-dependencies` package supports a wide variety of alias naming conventions.

## Tested Alias Patterns

### 1. Snake Case (`snake_case/*`)
```typescript
import { validateInput } from 'snake_case/validation.js'
```
Maps to: `src/my_utilities/*`

### 2. Numeric Aliases (`lib2024/*`)
```typescript
import { BaseWidget } from 'lib2024/BaseWidget.js'
```
Maps to: `src/ui_components/*`

### 3. CamelCase (`myAppConfig/*`)
```typescript
import { APP_SETTINGS } from 'myAppConfig/settings.js'
```
Maps to: `src/app_config/*`

### 4. Domain-style with Dots (`domain.types/*`)
```typescript
import type { ComponentConfig } from 'domain.types/config.js'
```
Maps to: `src/core_types/*`

### 5. Cryptic Single Letters (`u/*`, `c/*`)
```typescript
import { formatDate } from 'u/formatter.js'
import { SmartButton } from 'c/SmartButton.js'
```
Maps to: `src/my_utilities/*` and `src/ui_components/*` respectively

## File Structure

```
unusual-aliases/
├── tsconfig.json           # Defines all unusual alias patterns
└── src/
    ├── index.ts           # Main file using all alias types
    ├── my_utilities/      # Target for snake_case/* and u/*
    │   ├── validation.ts
    │   └── formatter.ts
    ├── ui_components/     # Target for lib2024/* and c/*
    │   ├── BaseWidget.ts
    │   └── SmartButton.ts
    ├── app_config/        # Target for myAppConfig/*
    │   ├── settings.ts
    │   └── environment.ts
    └── core_types/        # Target for domain.types/*
        ├── config.ts
        └── events.ts
```

## Test Coverage

The test verifies that all 8 files are properly resolved through their respective alias patterns:

- ✅ Snake case aliases (`snake_case/*`)
- ✅ Numeric aliases (`lib2024/*`) 
- ✅ CamelCase aliases (`myAppConfig/*`)
- ✅ Domain-style aliases (`domain.types/*`)
- ✅ Cryptic single-letter aliases (`u/*`, `c/*`)

This ensures real-world compatibility with various naming conventions used in different TypeScript projects.