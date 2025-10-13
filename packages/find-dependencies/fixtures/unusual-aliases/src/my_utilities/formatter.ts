/**
 * String formatting utilities
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const FORMAT_OPTIONS = {
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm:ss'
} as const