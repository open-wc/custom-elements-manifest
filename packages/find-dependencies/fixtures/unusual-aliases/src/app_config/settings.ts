/**
 * Application configuration with myAppConfig alias
 */
export const APP_SETTINGS = {
  version: '2.1.0',
  apiUrl: 'https://api.example.com',
  debug: false,
  features: {
    darkMode: true,
    analytics: true
  }
} as const

export function getApiEndpoint(path: string): string {
  return `${APP_SETTINGS.apiUrl}/${path.replace(/^\//, '')}`
}

export type ApiResponse<T = unknown> = {
  data: T
  status: number
  message?: string
}