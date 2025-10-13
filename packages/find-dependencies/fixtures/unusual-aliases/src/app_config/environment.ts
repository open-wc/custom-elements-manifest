/**
 * Environment configuration
 */
export const ENV_CONFIG = {
  production: {
    apiUrl: 'https://prod-api.example.com',
    logLevel: 'error'
  },
  development: {
    apiUrl: 'http://localhost:3000',
    logLevel: 'debug'
  },
  test: {
    apiUrl: 'http://test-api.example.com',
    logLevel: 'warn'
  }
} as const

export type Environment = keyof typeof ENV_CONFIG

export function getCurrentEnv(): Environment {
  return (process.env.NODE_ENV as Environment) || 'development'
}