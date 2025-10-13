import { formatDate } from './helper.js'

export function validation(input: string): boolean {
  if (!input || input.trim().length === 0) {
    return false
  }
  
  // Use relative import to test dependency resolution
  formatDate(new Date())
  
  return input.length > 3
}