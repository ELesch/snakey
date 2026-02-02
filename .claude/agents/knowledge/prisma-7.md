# Prisma 7 Knowledge

> Shared knowledge for Prisma 7 patterns. Referenced by multiple role agents.

## AI Training Context

| Aspect | Status |
|--------|--------|
| **AI Trained On** | 5.x |
| **Gap Level** | Major |
| **Confidence** | Medium |
| **Context7** | Available |

**Training Gap Analysis:**
- AI knows Prisma 5.x patterns well
- Prisma 7.x changes: `defineConfig`, adapter-based connections, new generator
- Schema URL handling moved to TypeScript config
- Client generation uses new provider

---

## Critical Patterns (MUST FOLLOW)

### Configuration File (prisma.config.ts)

Prisma 7 uses TypeScript configuration instead of environment variables in schema:

```typescript
// prisma.config.ts (project root)
import { config } from 'dotenv'
config({ path: '.env.local' })

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Schema location
  schema: 'prisma/schema.prisma',

  // Migrations directory
  migrations: {
    path: 'prisma/migrations',
  },

  // Datasource URL from environment
  datasource: {
    url: env('DIRECT_URL'),
  },
})
```

**Key points:**
- **Load dotenv first** - Before importing Prisma
- **Use `env()` helper** - From `prisma/config`
- **No URL in schema** - Configured here instead

### Schema File (prisma/schema.prisma)

```prisma
// Prisma 7 Schema - simpler, no URL here

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // No url = env(...) here - handled in prisma.config.ts
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Client Instantiation with Adapter

Prisma 7 requires adapter-based connections:

```typescript
// src/lib/db/client.ts
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Singleton pattern for development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Create PostgreSQL adapter
  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### Required Dependencies

```bash
# Core Prisma
npm install prisma @prisma/client

# Adapter (required for Prisma 7)
npm install @prisma/adapter-pg pg

# TypeScript types for pg
npm install -D @types/pg

# Environment loading
npm install dotenv
```

### TypeScript Configuration

Add path alias for generated client:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/generated/*": ["./src/generated/*"]
    }
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

---

## Do/Don't Table

| Do | Don't |
|----|-------|
| Use `prisma.config.ts` for datasource URL | Put `url = env(...)` in schema |
| Use `defineConfig()` from `prisma/config` | Use environment variables directly in schema |
| Use `PrismaPg` adapter for PostgreSQL | Instantiate PrismaClient without adapter |
| Set `provider = "prisma-client"` in generator | Use `provider = "prisma-client-js"` (old) |
| Output to custom path (e.g., `src/generated/prisma`) | Use default `node_modules/.prisma/client` |
| Load dotenv before Prisma imports | Expect Prisma to load `.env` automatically |
| Import from `@/generated/prisma/client` | Import from `@prisma/client` |
| Run `prisma generate` after schema changes | Expect auto-generation |

---

## Common Errors and Fixes

### Error: Cannot find module '@/generated/prisma/client'

**Problem:** Client not generated or wrong import path
**Fix:**
1. Run `npx prisma generate`
2. Check `output` path in schema generator
3. Verify `tsconfig.json` path alias

### Error: Environment variable not found: DIRECT_URL

**Problem:** Prisma can't access environment
**Fix:**
1. Ensure dotenv loads BEFORE Prisma imports in `prisma.config.ts`
2. Check `.env.local` exists with `DIRECT_URL`

### Error: Provider 'prisma-client-js' is not valid

**Problem:** Using old generator provider
**Fix:** Change to `provider = "prisma-client"`

### Error: PrismaClient is not a constructor

**Problem:** Wrong import or missing adapter
**Fix:**
1. Import from correct path (generated location)
2. Pass adapter to PrismaClient

### Error: Connection refused to database

**Problem:** Wrong connection string or network
**Fix:**
1. Verify `DATABASE_URL` format (pooled connection)
2. Check `DIRECT_URL` for migrations (direct connection)
3. URL-encode special characters in password

---

## Context7 Usage

When you need current documentation, use:

```
use context7 for prisma client generation
use context7 for prisma config
use context7 for prisma postgresql adapter
```

Context7 is especially useful for:
- New configuration patterns
- Adapter setup and options
- Migration commands
- Schema syntax

---

## Connection String Format

### Supabase PostgreSQL

```bash
# .env.local

# Pooled connection (for application queries, port 6543)
DATABASE_URL="postgresql://postgres.{project-ref}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for Prisma migrations, port 5432)
DIRECT_URL="postgresql://postgres.{project-ref}:{password}@db.{project-ref}.supabase.co:5432/postgres"
```

### Password Special Characters

URL-encode special characters:
- `@` -> `%40`
- `!` -> `%21`
- `#` -> `%23`
- `$` -> `%24`
- `%` -> `%25`

---

## Migration from Prisma 5

### Breaking Changes

1. **Generator provider**: `prisma-client-js` -> `prisma-client`
2. **Configuration**: schema env vars -> `prisma.config.ts`
3. **Client instantiation**: direct -> adapter-based
4. **dotenv**: manual load required

### Migration Steps

1. Create `prisma.config.ts` with `defineConfig`
2. Remove `url = env(...)` from schema datasource
3. Change generator to `provider = "prisma-client"`
4. Install `@prisma/adapter-pg` and `pg`
5. Update client instantiation with adapter
6. Update imports to generated path
7. Run `prisma generate`

---

## Verification Tasks

Before completing your work, verify:

- [ ] `prisma.config.ts` exists in project root
- [ ] Schema has `provider = "prisma-client"` in generator
- [ ] Schema has no `url` in datasource
- [ ] `.env.local` has both `DATABASE_URL` and `DIRECT_URL`
- [ ] `npx prisma generate` completes without errors
- [ ] `src/generated/prisma/` directory exists after generate
- [ ] Client instantiation uses `PrismaPg` adapter
- [ ] `tsconfig.json` has path alias for generated client
- [ ] Build succeeds with correct imports
