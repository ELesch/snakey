# Snakey - Technology Stack

> **Last Validated**: 2026-01-31
>
> This file contains current versions and patterns for the project's tech stack.
> Run `/tech-revalidate` after upgrading dependencies or when patterns change.

## AI Version Awareness

> **AI Training Cutoff**: May 2025
>
> Code patterns from AI assistance may reflect older versions. Consult the
> "Version Gotchas" section when working with technologies marked Medium/Low confidence.

| Technology | Current | AI Trained On | Gap | Confidence | Context7 |
|------------|---------|---------------|-----|------------|----------|
| Next.js | 15.1.x | 14.x | Moderate | Medium | Yes |
| React | 19.x | 18.x | Moderate | Medium | Yes |
| TypeScript | 5.7.x | 5.3 | Minor | High | Yes |
| Prisma | 7.x | 7.x | Minor | Medium | Yes |
| Tailwind CSS | 4.x | 3.x | **Major** | Low | Yes |
| Supabase | 2.90.x | 2.x | Minor | High | Yes |
| Serwist | 9.x | N/A | **Major** | Low | No |
| Dexie | 4.x | 4.x | Minor | High | No |
| Recharts | 3.6.x | 2.x | Moderate | High | No |
| Tremor | 3.18.x | 3.x | Minor | Medium | No |
| Zod | 4.x | 3.x | Minor | High | Yes |
| TanStack Query | 5.x | 5.x | Minor | High | Yes |
| Pino | 9.x | 8.x | Minor | High | No |

**Gap Levels**: Minor | Moderate | **Major**
**Confidence**: High (code works) | Medium (review gotchas) | **Low (verify all code)** | Unknown

### Confidence Level Meaning

| Level | What It Means | Developer Action |
|-------|---------------|------------------|
| **High** | AI has sufficient training data, patterns are stable | Use AI code with normal review |
| **Medium** | Some patterns may be outdated or incomplete | Review gotchas, test edge cases |
| **Low** | Limited training data or major changes | Verify ALL AI code against docs |
| **Unknown** | Cannot determine AI knowledge state | Research before using |

### When to Revalidate

Run `/tech-revalidate` when:
- AI training cutoff may have changed (Claude update)
- You upgraded major dependencies
- Starting work after a long break
- You notice AI suggesting outdated patterns

### Context7 Live Documentation

Libraries marked with Yes in the Context7 column have live documentation available. When working with these libraries:

1. Say "use context7 for [library]" in your prompts
2. Context7 fetches current, version-specific documentation
3. AI responses use up-to-date APIs instead of training data

**Check library availability:** https://context7.com

## Developer Prerequisites

These tools must be installed before working on this project.

| Tool | Version | Install | Verify |
|------|---------|---------|--------|
| Node.js | 20.x LTS | `winget install OpenJS.NodeJS.LTS` | `node --version` |
| npm | 10.x+ | Comes with Node.js | `npm --version` |
| Git | 2.x+ | `winget install Git.Git` | `git --version` |
| GitHub CLI | 2.x+ | `winget install GitHub.cli` | `gh --version` |

### Installation Notes

**Windows:**
```bash
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
```

**macOS:**
```bash
brew install node@20
brew install git
brew install gh
```

## Current Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 15.1.x | App Router, async request APIs |
| TypeScript | 5.7.x | Strict mode enabled |
| React | 19.x | use() hook, Actions available |
| Prisma | 7.x | defineConfig pattern, PrismaPg adapter |
| Tailwind CSS | 4.x | CSS-first config with @theme |
| shadcn/ui | latest | React 19 + Tailwind v4 compatible |
| Zod | 4.x | Runtime validation |
| Supabase | 2.90.x | Auth + Database + Storage |
| Serwist | 9.x | PWA service worker |
| Dexie | 4.x | IndexedDB wrapper |
| Recharts | 3.6.x | Data visualization |
| Tremor | 3.18.x | Dashboard components |
| Pino | 9.x | Structured logging |

## Version Gotchas

> Reference this section when AI-generated code uses outdated patterns.
> Only technologies with Moderate/Major gaps are listed.

### Next.js 15.x (AI trained on 14.x)

| Do | Don't |
|----|-------|
| Await `cookies()`, `headers()`, `params()` | Use synchronous access to request APIs |
| Configure caching explicitly with `cache: 'force-cache'` | Assume routes are cached by default |
| Use Turbopack (default in v15+) | Rely on webpack-only plugins without --webpack flag |
| Use React 19 features (use, Actions) | Expect React 18 patterns to work identically |

### React 19 (AI trained on 18.x)

| Do | Don't |
|----|-------|
| Use `use()` hook for reading promises in render | Use complex useEffect chains for data fetching |
| Use Actions for form handling | Rely solely on manual state management for forms |
| Let React Compiler optimize | Over-use useMemo/useCallback (may be unnecessary) |
| Use Suspense for loading states | Use manual isLoading patterns everywhere |

### Prisma 7.x (defineConfig pattern)

| Do | Don't |
|----|-------|
| Use `prisma.config.ts` with `defineConfig()` | Put DATABASE_URL in schema.prisma |
| Use `provider = "prisma-client"` in generator | Use `provider = "prisma-client-js"` |
| Output client to custom path (`src/generated/prisma`) | Expect client in `node_modules` |
| Use `PrismaPg` adapter in db client | Use `PrismaClient` without adapter |
| Load env in `prisma.config.ts` with dotenv | Use `dotenv-cli` for prisma commands |
| Import from `@/generated/prisma/client` | Import from `@prisma/client` |

### Tailwind CSS 4.x (AI trained on 3.x)

| Do | Don't |
|----|-------|
| Use `@import "tailwindcss"` | Use `@tailwind` directives |
| Configure theme in CSS with `@theme` | Create tailwind.config.js |
| Let automatic content detection work | Manually configure content paths |
| Use native CSS variables from theme | Expect JavaScript config to work |

### Serwist (PWA - Low Confidence)

| Do | Don't |
|----|-------|
| Follow Serwist docs exactly | Assume Workbox patterns work identically |
| Disable service worker in development | Debug caching issues in dev mode |
| Add webworker types to tsconfig | Expect TypeScript to work without config |
| Test in production builds | Rely on dev mode PWA testing |

### TanStack Query v5

| Do | Don't |
|----|-------|
| Use `isPending` | Use `isLoading` (deprecated name) |
| Use single config object | Use multiple overloads |
| Use useSuspenseQuery with Suspense | Mix old patterns with new |

## Installation Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start dev server
npm run dev

# Build for production
npm run build

# Initialize shadcn/ui components (as needed)
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add card
```

## Framework Patterns

### Next.js 15

**Async Request APIs (NEW in v15):**
```typescript
import { cookies, headers } from 'next/headers'

export async function getServerSideData() {
  const cookieStore = await cookies()  // Must await
  const headerList = await headers()   // Must await
  return { token: cookieStore.get('token') }
}
```

**Server Actions:**
```typescript
'use server'

import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
})

export async function createItem(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData))
  // Database operation
}
```

### Prisma 7

**Configuration (prisma.config.ts):**
```typescript
import { config } from 'dotenv'
config({ path: '.env.local' })

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DIRECT_URL') },
})
```

**Client Instantiation:**
```typescript
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
```

### Tailwind CSS 4

**CSS Configuration (app.css):**
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.7 0.15 200);
  --font-sans: "Inter", system-ui, sans-serif;
}
```

## Breaking Changes to Avoid

- `onLoadingComplete` removed from Next.js Image - use `onLoad`
- `isLoading` renamed to `isPending` in TanStack Query v5
- `@tailwind` directives don't work in Tailwind v4 - use `@import`
- `prisma-client-js` provider deprecated - use `prisma-client`

## Deprecated Patterns

- `getServerSideProps` / `getStaticProps` - use App Router patterns
- `pages/` directory - use `app/` directory
- Synchronous `cookies()` / `headers()` - must await in Next.js 15
- `tailwind.config.js` - configure in CSS with Tailwind v4

## Official Documentation

- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Supabase: https://supabase.com/docs
- Serwist: https://serwist.pages.dev
- Dexie: https://dexie.org
- Recharts: https://recharts.org
- Zod: https://zod.dev

## Project-Specific Technologies

### Offline-First Architecture

**Dexie (IndexedDB):**
```typescript
import Dexie from 'dexie'

export class SnakeyDB extends Dexie {
  reptiles!: Dexie.Table<Reptile, string>
  feedings!: Dexie.Table<Feeding, string>
  // ... other tables

  constructor() {
    super('snakey')
    this.version(1).stores({
      reptiles: 'id, userId, species',
      feedings: 'id, reptileId, date',
    })
  }
}
```

**Sync Queue Pattern:**
```typescript
interface SyncQueueItem {
  id: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  recordId: string
  payload: unknown
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
  retryCount: number
}
```

### PWA Service Worker (Serwist)

**Caching Strategies:**
- App shell (HTML, JS, CSS): StaleWhileRevalidate
- API responses: NetworkFirst (5 min TTL)
- Photos: CacheFirst (7 days)
- Fonts/icons: CacheFirst (30 days)

### Species Configuration System

Built-in species defaults with user customization support.
See `src/lib/species/defaults.ts` for default parameters.
