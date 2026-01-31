// Pino Logger - Structured Logging for AI-Readable Debugging
import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // Redact sensitive fields
  redact: [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'accessToken',
    'refreshToken',
  ],

  // Pretty print in development
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Structured format for production (JSON)
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}), // Remove pid and hostname
  },

  // Include timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Create a child logger with context
 *
 * @example
 * const log = createLogger('ReptileService')
 * log.info({ reptileId }, 'Created reptile')
 */
export function createLogger(context: string) {
  return logger.child({ context })
}

export default logger
