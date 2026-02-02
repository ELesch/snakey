# Next.js 15 Knowledge

> Shared knowledge for Next.js 15 patterns. Referenced by multiple role agents.

## AI Training Context

| Aspect | Status |
|--------|--------|
| **AI Trained On** | 14.x |
| **Gap Level** | Major |
| **Confidence** | Medium |
| **Context7** | Available |

**Training Gap Analysis:**
- AI has strong 14.x patterns
- 15.x changes: async request APIs, Turbopack default, React 19 integration
- Server Actions patterns evolved
- Caching behavior changed significantly

---

## Critical Patterns (MUST FOLLOW)

### Async Request APIs (BREAKING CHANGE)

In Next.js 15, `cookies()`, `headers()`, `params`, and `searchParams` are now **async**.

```typescript
// Next.js 15 - Correct
import { cookies, headers } from 'next/headers'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ query: string }>
}) {
  const { slug } = await params
  const { query } = await searchParams
  const cookieStore = await cookies()
  const headersList = await headers()

  return <div>{slug}</div>
}

// Next.js 14 - OUTDATED, DO NOT USE
export default function Page({ params }: { params: { slug: string } }) {
  // params.slug - This no longer works in Next.js 15!
}
```

### Server Components (Default)

All components are Server Components by default. Only add `'use client'` when needed.

```typescript
// Server Component (default) - runs on server, can access DB directly
export default async function UserList() {
  const users = await prisma.user.findMany() // Direct DB access OK
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}

// Client Component - only for interactivity
'use client'
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Server Actions for Mutations

Use Server Actions instead of API routes for form handling:

```typescript
// actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string

  await prisma.user.create({ data: { name } })

  revalidatePath('/users')
}

// In component
import { createUser } from './actions'

export default function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Caching Changes (15.x)

Caching is **opt-in** by default in Next.js 15:

```typescript
// No caching (default in 15.x)
const data = await fetch('https://api.example.com/data')

// Opt-in to caching
const cachedData = await fetch('https://api.example.com/data', {
  cache: 'force-cache', // or next: { revalidate: 3600 }
})

// Dynamic rendering
const dynamicData = await fetch('https://api.example.com/data', {
  cache: 'no-store', // Explicit dynamic
})
```

### Route Segment Config

```typescript
// page.tsx or layout.tsx
export const dynamic = 'force-dynamic' // or 'force-static'
export const revalidate = 3600 // ISR in seconds
export const runtime = 'edge' // or 'nodejs'
```

---

## Do/Don't Table

| Do | Don't |
|----|-------|
| Use `await params` in dynamic routes | Access `params.slug` directly |
| Use `await cookies()` and `await headers()` | Call `cookies()` synchronously |
| Use Server Actions for form mutations | Create API routes for form handling |
| Keep components as Server Components by default | Add `'use client'` to data-fetching components |
| Use `revalidatePath()` or `revalidateTag()` for cache invalidation | Rely on automatic revalidation |
| Use `next/image` Image component | Use `<img>` tags directly |
| Use `next/link` for navigation | Use `<a>` tags for internal links |
| Add explicit `cache: 'force-cache'` when caching is needed | Assume fetch is cached by default |

---

## Common Errors and Fixes

### Error: `cookies()` returns a Promise

**Problem:** `cookies()` is async in Next.js 15
**Fix:** Add `await` - `const cookieStore = await cookies()`

### Error: Property 'slug' does not exist on type Promise

**Problem:** `params` is now a Promise
**Fix:** `const { slug } = await params`

### Error: Server Component cannot use useState

**Problem:** Using React hooks in Server Component
**Fix:** Add `'use client'` directive at top of file

### Error: Missing revalidation

**Problem:** Data not updating after mutation
**Fix:** Call `revalidatePath()` or `revalidateTag()` in Server Action

---

## Context7 Usage

When you need current documentation, use:

```
use context7 for nextjs app router
use context7 for nextjs server actions
use context7 for nextjs caching
```

Context7 is especially useful for:
- Route handlers and middleware patterns
- Parallel and intercepting routes
- Streaming and Suspense patterns
- Metadata API usage

---

## File Structure Patterns

```
app/
├── layout.tsx              # Root layout (Server Component)
├── page.tsx                # Home page
├── loading.tsx             # Loading UI
├── error.tsx               # Error boundary ('use client')
├── not-found.tsx           # 404 page
├── (auth)/                 # Route group (no URL segment)
│   ├── login/page.tsx
│   └── register/page.tsx
├── users/
│   ├── page.tsx            # /users
│   ├── [id]/               # Dynamic segment
│   │   ├── page.tsx        # /users/:id
│   │   └── loading.tsx
│   └── actions.ts          # Server Actions
└── api/                    # API routes (use sparingly)
    └── webhook/route.ts    # Only for external webhooks
```

---

## Integration Notes

### With Prisma 7

- Server Components can call Prisma directly
- Server Actions handle mutations
- No API layer needed for most CRUD operations

### With React 19

- `use()` hook available for promises and context
- Actions API works with Server Actions
- Concurrent features fully supported

---

## Verification Tasks

Before completing your work, verify:

- [ ] All `params` and `searchParams` in pages/layouts are awaited
- [ ] All `cookies()` and `headers()` calls are awaited
- [ ] Server Actions work without corresponding API routes
- [ ] Data fetching happens in Server Components
- [ ] `'use client'` only used for interactive components
- [ ] Caching behavior matches expectations (opt-in, not default)
- [ ] `onLoadingComplete` not used on Image (deprecated)
- [ ] Dynamic routes use correct async types
