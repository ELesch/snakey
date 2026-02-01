# Learnings: Snakey

> Accumulated insights from development. This file is updated by the `/capture` skill.

## Tech Gotchas

*Captured during development - see also `.claude/tech/stack.md` for version-specific gotchas.*

### Prisma + Vercel Deployment

**Problem:** Vercel builds fail with Prisma because the client isn't generated automatically.

**Solution:** Always include `prisma generate` in the build script:
```json
"build": "prisma generate && next build"
```

This ensures the Prisma client is generated before Next.js compiles, which is required since Prisma uses a custom output path (`src/generated/prisma`).

### Zod Date Validation on Serverless

**Problem:** Using `.max(new Date())` in Zod schemas causes validation failures on Vercel. The date is evaluated once at module load time and cached, so after the serverless function has been running, "today" dates appear to be "in the future".

**Solution:** Use `.refine()` with a function instead of `.max()` for date comparisons:
```typescript
// BAD - evaluated once at module load
z.coerce.date().max(new Date(), 'Date cannot be in the future')

// GOOD - evaluated each time validation runs
z.coerce.date().refine(
  (date) => date <= new Date(),
  'Date cannot be in the future'
)
```

**Why tests don't catch this:** Unit tests run in a fresh process where the module just loaded, so `new Date()` is always current. The bug only manifests when modules are cached across requests in serverless environments.

### Zod + searchParams.get() Returns Null

**Problem:** `searchParams.get('param')` returns `null` when the param isn't in the URL. Passing `null` to `z.coerce.number()` converts it to `0`, which fails `.positive()` validation.

**Solution:** Filter out null/empty values before passing to Zod:
```typescript
// BAD - null breaks Zod coercion
const result = Schema.safeParse({
  page: searchParams.get('page'), // null → 0 → fails .positive()
})

// GOOD - filter nulls so defaults apply
const rawParams: Record<string, string> = {}
for (const [key, value] of searchParams.entries()) {
  if (value) rawParams[key] = value
}
const result = Schema.safeParse(rawParams)
```

**Why tests don't catch this:** Unit tests mock requests with explicit values. Integration tests that make actual HTTP requests with missing query params would catch this.

---

## Patterns That Work

*Successful patterns discovered during development.*

---

## Anti-Patterns to Avoid

*Things we tried that didn't work well.*

---

## Performance Insights

*Performance-related discoveries.*

---

## Testing Insights

*What we learned about testing this codebase.*

---

*This file is automatically updated by the `/capture` skill. Use category `practice` to add entries here.*
