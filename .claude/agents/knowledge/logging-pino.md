# Pino Logging - Shared Knowledge

> This is shared knowledge referenced by multiple agents.
> AI confidence is **High** - Pino's API is stable across versions.

## AI Training Context

| Aspect | Status |
|--------|--------|
| **AI Trained On** | 8.x |
| **Gap Level** | Minor |
| **Confidence** | High |
| **Context7** | Not indexed |

**Stable API:** Pino's API has been stable across versions. Patterns from 8.x work in 9.x.

---

## Logger Setup

```typescript
// src/lib/logger.ts
import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // Redact sensitive fields
  redact: {
    paths: ['password', 'token', 'apiKey', 'secret', 'authorization', 'cookie'],
    censor: '[REDACTED]',
  },

  // Pretty print in development
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
})

// Create child loggers with context
export const createLogger = (context: string) =>
  logger.child({ context })

// Export types for external use
export type Logger = typeof logger
```

---

## Usage Patterns

```typescript
import { logger, createLogger } from '@/lib/logger'

// Direct logging
logger.info('Server started')
logger.error({ err: error }, 'Request failed')

// Child logger with context
const userLogger = createLogger('UserService')
userLogger.info({ userId }, 'User created')

// With additional data
logger.info({ orderId, total }, 'Order processed')

// Error logging with stack trace
try {
  await processOrder()
} catch (err) {
  logger.error({ err }, 'Order processing failed')
}
```

---

## Do/Don't Table

| Do | Don't |
|----|-------|
| Use structured objects for log data | Log unstructured strings |
| Create child loggers with context | Pass context in every log call |
| Redact sensitive fields (password, token) | Log credentials or PII |
| Use appropriate log levels | Use `console.log` |
| Include request/correlation IDs | Log without traceability |
| Log errors with `{ err }` pattern | Log `error.message` only |
| Use `pino-pretty` in development only | Deploy with pino-pretty |

---

## Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `fatal` | System cannot continue | Database connection lost |
| `error` | Operation failed, needs attention | Payment processing failed |
| `warn` | Unexpected but handled | Rate limit approaching |
| `info` | Business events | User created, order placed |
| `debug` | Development details | Query executed, cache hit |
| `trace` | Very verbose debugging | Function entry/exit |

```typescript
logger.fatal('Database connection failed - shutting down')
logger.error({ err, orderId }, 'Payment processing failed')
logger.warn({ remaining: 5 }, 'Rate limit threshold approaching')
logger.info({ userId }, 'User account created')
logger.debug({ query, params }, 'Database query executed')
logger.trace({ fn: 'processOrder' }, 'Entering function')
```

---

## Structured Log Fields

```typescript
// Standard fields for consistency
interface LogContext {
  // Request context
  requestId?: string
  userId?: string
  sessionId?: string

  // Operation context
  action?: string
  resource?: string
  resourceId?: string

  // Performance
  duration?: number

  // Error context
  err?: Error

  // Business data (non-sensitive)
  orderId?: string
  productId?: string
}
```

---

## Common Patterns by Layer

### Controller/Route Handler

```typescript
export async function POST(req: Request) {
  const log = createLogger('UserController')
  const requestId = crypto.randomUUID()

  log.info({ requestId }, 'Creating user')

  try {
    const user = await createUser(body)
    log.info({ requestId, userId: user.id }, 'User created')
    return Response.json(user)
  } catch (err) {
    log.error({ requestId, err }, 'Failed to create user')
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Service Layer

```typescript
const log = createLogger('UserService')

export async function createUser(data: CreateUserInput) {
  log.debug({ email: data.email }, 'Creating user')

  const user = await prisma.user.create({ data })

  log.info({ userId: user.id }, 'User created successfully')
  return user
}
```

### Repository Layer

```typescript
const log = createLogger('UserRepository')

export async function findById(id: string) {
  log.debug({ id }, 'Finding user by ID')

  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) {
    log.debug({ id }, 'User not found')
  }

  return user
}
```

---

## Dependencies

```bash
npm install pino
npm install -D pino-pretty  # Development only
```

---

## Environment Configuration

```bash
# .env.local
LOG_LEVEL=debug  # development: debug, production: info
```

---

## Integration with Sentry

```typescript
// src/lib/logger.ts (with Sentry)
import pino from 'pino'
import * as Sentry from '@sentry/nextjs'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  hooks: {
    logMethod(args, method) {
      // Send errors to Sentry
      if (method === 'error' || method === 'fatal') {
        const [obj] = args
        if (obj?.err) {
          Sentry.captureException(obj.err)
        }
      }
      return method.apply(this, args)
    },
  },
})
```

---

## Next.js Specific

```typescript
// For API routes
export const runtime = 'nodejs' // Pino requires Node.js runtime

// For Server Components (limited logging)
// Use structured data that can be serialized
logger.info({ action: 'render', page: '/users' }, 'Page rendered')
```

---

## Performance Notes

- Pino is one of the fastest Node.js loggers
- In production, log to stdout (let infrastructure handle aggregation)
- Use synchronous logging for simplicity
- Async logging (pino.destination) for extreme performance needs
