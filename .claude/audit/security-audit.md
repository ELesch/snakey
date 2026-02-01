# Security Audit Report

**Date:** 2026-02-01
**Auditor:** Security Auditor (dev-security)
**Scope:** Full security review - Authentication, Authorization, Input Validation, Data Protection
**Codebase:** Snakey PWA (21 commits, early development)

## Executive Summary

The Snakey codebase demonstrates a **solid security foundation** with consistent authentication checks across all 36 API endpoints, proper use of Zod for input validation, and comprehensive Content Security Policy headers. However, there are several areas requiring attention before production deployment, including moderate dependency vulnerabilities, missing rate limiting, and the pending Supabase RLS migration (BLOCK-001).

**Overall Security Posture:** Good for early development stage, with medium-priority items to address before production.

---

## Critical Vulnerabilities

**None identified.** No critical security vulnerabilities were found in the codebase.

---

## High Priority Issues

### H-1: Missing Rate Limiting on Authentication Endpoints

**Location:** `src/lib/supabase/actions.ts:32-59` (signIn), `src/lib/supabase/actions.ts:64-94` (signUp)

**Issue:** Authentication endpoints lack rate limiting, making them vulnerable to brute-force attacks and credential stuffing.

**Risk:** An attacker could attempt unlimited login attempts to guess user passwords.

**Recommendation:**
- Implement rate limiting using middleware or a service like Upstash Redis
- Supabase has built-in rate limiting, but application-level protection adds defense in depth
- Consider implementing progressive delays (1s, 2s, 4s) after failed attempts

### H-2: No CSRF Protection for Server Actions

**Location:** `src/lib/supabase/actions.ts` (all server actions)

**Issue:** Server Actions using FormData lack explicit CSRF token validation. While Next.js 15 Server Actions have some built-in protection, explicit CSRF tokens provide additional security.

**Risk:** Potential cross-site request forgery attacks on authentication actions.

**Recommendation:**
- Consider adding explicit CSRF tokens for sensitive actions
- Next.js Server Actions have implicit protection via origin checking, but verify this is enabled

### H-3: Dependency Vulnerabilities (9 Moderate)

**Location:** `package.json` dependencies

**Issue:** npm audit reveals 9 moderate severity vulnerabilities:
- `lodash` (4.17.21): Prototype pollution in `_.unset` and `_.omit` (CVE via chevrotain)
- `hono` (<4.11.7): Multiple XSS and cache deception issues (via @prisma/dev)
- `next` (15.0-15.6.0-canary.60): Unbounded memory consumption via PPR Resume Endpoint

**Risk:** While these are indirect dependencies (dev tooling), the Next.js vulnerability could affect production.

**Recommendation:**
```bash
# Update Next.js to fix the vulnerability
npm update next

# For Prisma-related vulnerabilities, monitor for Prisma 6.x stable release
# Current fix requires major version downgrade which may not be suitable
```

---

## Medium Priority Issues

### M-1: Password Requirements Not Enforced in Backend

**Location:** `src/lib/supabase/actions.ts:19-22`

**Issue:** SignUpSchema only requires minimum 8 characters. No requirements for complexity (uppercase, lowercase, numbers, symbols).

```typescript
const SignUpSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
```

**Risk:** Users may create weak passwords vulnerable to dictionary attacks.

**Recommendation:** Enhance password validation:
```typescript
password: z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
```

### M-2: Supabase Service Role Key in .env.example

**Location:** `.env.example:24`

**Issue:** While `.env.example` correctly shows placeholders, the presence of `SUPABASE_SERVICE_ROLE_KEY` documentation could lead to misuse. This key should only be used in secure server-side contexts.

**Current status:** The key is documented but actual code review shows no usage of service role key in the codebase (uses anon key appropriately).

**Recommendation:** Add warning comment in `.env.example`:
```bash
# DANGER: Service role key bypasses RLS. Never expose in client code.
# Only use for admin scripts or server-side migrations.
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### M-3: CSP Allows unsafe-inline and unsafe-eval

**Location:** `next.config.ts:31-32`

**Issue:** Content Security Policy includes `'unsafe-inline'` for scripts and styles, and `'unsafe-eval'` for scripts.

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
"style-src 'self' 'unsafe-inline'", // Tailwind and shadcn/ui use inline styles
```

**Risk:** Reduces XSS protection effectiveness. Inline script injection remains possible.

**Recommendation:**
- In production, remove `'unsafe-eval'` and use nonces for inline scripts
- Use build-time CSS extraction to reduce need for `'unsafe-inline'` in styles
- Next.js 15 supports nonce-based CSP: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

### M-4: Missing Row Level Security (RLS) - Noted as BLOCK-001

**Location:** `prisma/schema.prisma` (entire schema)

**Issue:** Database relies entirely on application-level authorization. If a SQL injection bypass occurred (unlikely with Prisma) or a service had a bug, data could be accessed cross-user.

**Risk:** Defense-in-depth is reduced without database-level access controls.

**Recommendation:** Complete the Supabase migration (BLOCK-001) and enable RLS policies:
```sql
-- Example RLS policy for reptiles table
ALTER TABLE snakey.reptile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own reptiles" ON snakey.reptile
  FOR ALL
  USING (user_id = auth.uid());
```

### M-5: Photo Storage Path Not Validated for Path Traversal

**Location:** `src/services/photo.service.ts:280-281`

**Issue:** While the storage path is constructed server-side, the filename extension is extracted from user input:

```typescript
const ext = filename.split('.').pop() || 'jpg'
const storagePath = `${userId}/originals/${fileId}.${ext}`
```

**Risk:** Low risk due to UUID for filename, but malformed extensions could potentially cause issues.

**Recommendation:** Validate extension against allowed list:
```typescript
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
if (!allowedExtensions.includes(ext)) {
  throw new ValidationError('Invalid file extension')
}
```

### M-6: Sync Payload Validated as z.unknown()

**Location:** `src/app/api/sync/[table]/route.ts:14`

**Issue:** The sync operation payload is typed as `z.unknown()`, deferring validation to the service layer.

```typescript
const SyncOperationSchema = z.object({
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  recordId: z.string().min(1),
  payload: z.unknown(),  // Not validated at API layer
  clientTimestamp: z.number().optional(),
})
```

**Risk:** Inconsistent validation if service layer validation is bypassed or has bugs.

**Recommendation:** Consider validating payload structure based on table name, or ensure service layer validation is comprehensive and tested.

---

## Low Priority Issues

### L-1: Logger Redaction List May Be Incomplete

**Location:** `src/lib/logger.ts:10-19`

**Issue:** Redaction list covers common sensitive fields but may miss application-specific ones:

```typescript
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
```

**Recommendation:** Add additional fields:
- `email` (PII)
- `userId` (consider for GDPR compliance)
- `ssn`, `creditCard` (if ever applicable)

### L-2: NEXTAUTH_SECRET in .env.example

**Location:** `.env.example:30`

**Issue:** NEXTAUTH_SECRET is documented but the application uses Supabase Auth, not NextAuth. This could cause confusion.

**Recommendation:** Either remove if unused, or add clarifying comment about its purpose (JWT signing for Supabase sessions).

### L-3: No Explicit Session Timeout Configuration

**Location:** `src/lib/supabase/middleware.ts`

**Issue:** Session expiration relies on Supabase defaults. No explicit timeout policy documented.

**Recommendation:** Document session policy and consider implementing:
- Idle timeout (e.g., 30 minutes of inactivity)
- Absolute timeout (e.g., 24 hours maximum session)

### L-4: No Security Headers for API Routes

**Location:** `next.config.ts:44-74` (headers applied to all routes)

**Issue:** Security headers are applied globally which is good, but API responses could benefit from additional headers like `X-Request-Id` for tracing.

**Recommendation:** Consider adding request ID headers for security incident investigation.

---

## Security Checklist Status

| Check | Status | Notes |
|-------|--------|-------|
| Authentication enforced on all protected routes | PASS | All 36 API endpoints check `getUserId()` |
| Input validation on all endpoints | PASS | Zod schemas used consistently |
| User-scoped data access | PASS | All services verify `userId` ownership |
| No hardcoded secrets | PASS | Credentials properly in `.env` |
| Proper error handling (no info leaks) | PASS | Generic "Internal server error" for 500s |
| HTTPS enforced | PARTIAL | CSP includes `upgrade-insecure-requests` |
| CORS configured correctly | N/A | No explicit CORS config (Next.js defaults) |
| Rate limiting | FAIL | Not implemented |
| CSRF protection | PARTIAL | Server Actions have implicit protection |
| Database RLS | PENDING | BLOCK-001 - Supabase migration needed |

---

## Positive Security Findings

The following security practices are well-implemented:

1. **Consistent Auth Checks:** Every API route follows the same pattern:
   ```typescript
   const userId = await getUserId()
   if (!userId) {
     return NextResponse.json({ error: { code: 'UNAUTHORIZED' }}, { status: 401 })
   }
   ```

2. **Ownership Validation:** All services verify user ownership before data access:
   - `reptileService.getById()` - checks `reptile.userId !== userId`
   - `feedingService.getById()` - checks via reptile ownership
   - `pairingService.getById()` - checks `pairing.userId !== userId`

3. **Input Validation:** Comprehensive Zod schemas with:
   - Length limits (e.g., name max 100 chars, notes max 2000 chars)
   - Type coercion with validation
   - Business rule validation (dates not in future)

4. **Open Redirect Prevention:** Auth callback validates redirect paths:
   ```typescript
   function isValidRedirectPath(path: string): boolean {
     if (!path.startsWith('/')) return false
     if (path.startsWith('//') || path.startsWith('/\\')) return false
     if (/%2f/i.test(path) || /%5c/i.test(path)) return false
     return true
   }
   ```

5. **Security Headers:** Comprehensive headers in `next.config.ts`:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Content-Security-Policy` (with `frame-ancestors 'none'`)
   - `Permissions-Policy` restricting camera/microphone/geolocation

6. **Soft Deletes:** User data uses `deletedAt` pattern, preventing accidental data loss

7. **Logger Redaction:** Sensitive fields automatically redacted from logs

8. **Photo Upload Validation:** Content-type whitelist for allowed image types

---

## Recommendations Priority

### Before Production Deployment (Must Fix)

1. **Implement rate limiting** on authentication endpoints
2. **Update Next.js** to patch memory consumption vulnerability
3. **Complete Supabase RLS migration** (BLOCK-001)

### Before Public Launch (Should Fix)

4. Enhance password complexity requirements
5. Tighten CSP by removing `unsafe-eval` in production
6. Add explicit CSRF tokens for high-risk actions
7. Validate photo filename extensions

### Ongoing Improvements (Nice to Have)

8. Expand logger redaction list
9. Document session timeout policy
10. Add request ID headers for API responses
11. Regular dependency audits (monthly)

---

## Dependency Audit Summary

```
Total Dependencies: 918
Vulnerabilities Found: 9 (all moderate)

Affected Packages:
- next: 1 moderate (memory consumption)
- prisma dev dependencies: 8 moderate (lodash, hono via chevrotain)

Fix Available:
- next: Upgrade to 16.1.6+ (breaking change)
- prisma: Upgrade to 6.19.2 (breaking change - downgrade from 7.x)
```

---

*Report generated by dev-security agent. This is a read-only audit - no code modifications made.*
