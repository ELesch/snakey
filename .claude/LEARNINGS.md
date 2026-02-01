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
