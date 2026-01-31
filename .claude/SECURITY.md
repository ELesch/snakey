# Security: Snakey

> Security overview and tracking for the project.

## Security Level

**Level**: Internal (Confidential for user data)
**Data Types**: User accounts, pet care records, photos
**Compliance**: None (personal project)

## Authentication

**Type**: Supabase Auth (Email/Password)
**Session**: JWT tokens with httpOnly cookies
**MFA**: Not required (optional enhancement)

## Authorization

**Model**: User-scoped data
- All data filtered by userId
- RLS policies on Supabase tables
- Server Actions validate session

## Credentials Security

| Status | Item |
|--------|------|
| Configured | `.gitignore` blocks `.env` files |
| Configured | Claude hooks block credential commits |
| Configured | `.env.example` documents required vars |
| Pending | Supabase RLS policies |

### Environment Variables

| Variable | Purpose | Where Stored |
|----------|---------|--------------|
| DATABASE_URL | Prisma connection (pooled) | `.env.local`, Vercel |
| DIRECT_URL | Prisma migrations | `.env.local`, Vercel |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | `.env.local`, Vercel |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public Supabase key | `.env.local`, Vercel |
| SUPABASE_SERVICE_ROLE_KEY | Admin Supabase key | `.env.local`, Vercel |
| NEXTAUTH_SECRET | Session encryption | `.env.local`, Vercel |

### Secrets Rotation

| Secret Type | Last Rotated | Next Due |
|-------------|--------------|----------|
| Supabase API keys | - | On setup |
| NEXTAUTH_SECRET | - | On setup |

## Security Checklist Status

See `.claude/checklists/security-review.md` for the full checklist.

| Category | Status |
|----------|--------|
| Authentication | Pending setup |
| Authorization | Pending RLS policies |
| Input Validation | Pending (Zod schemas) |
| Data Protection | Pending |
| Dependencies | Pending npm audit |

## Contact

**Security Contact**: (project owner)

---

*Last reviewed: 2026-01-31*
