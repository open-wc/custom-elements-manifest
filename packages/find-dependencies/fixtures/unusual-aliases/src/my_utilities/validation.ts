/**
 * Validation utility with snake_case alias
 */
export function validateInput(input: string): boolean {
  return input.length > 0 && input.trim() !== ''
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '')
}

export const VALIDATION_RULES = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 255
} as const