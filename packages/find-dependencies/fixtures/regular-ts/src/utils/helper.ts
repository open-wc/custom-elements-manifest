export function utility(value: string): string {
  return `Processed: ${value}`
}

export function formatDate(date: Date): string {
  return date.toISOString()
}