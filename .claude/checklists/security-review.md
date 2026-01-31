# Security Review Checklist

Use this checklist before deploying or merging security-sensitive changes.

## Authentication

- [ ] Session tokens use httpOnly cookies
- [ ] Session expiration is configured
- [ ] Password requirements enforced
- [ ] Failed login rate limiting

## Authorization

- [ ] RLS policies enabled on all tables
- [ ] Server-side validation of user ownership
- [ ] No direct database access from client
- [ ] API routes validate session

## Input Validation

- [ ] All inputs validated with Zod
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React escaping)
- [ ] File upload validation (type, size)

## Credentials Security

- [ ] No secrets in code repository
- [ ] `.env` files in `.gitignore`
- [ ] `.env.example` has only placeholders
- [ ] No hardcoded API keys or tokens
- [ ] Environment variables validated at startup
- [ ] Secrets rotation documented
- [ ] Claude hooks configured for secret scanning
- [ ] `/commit` skill used for all commits

## Data Protection

- [ ] HTTPS enforced (Vercel default)
- [ ] Sensitive data not logged
- [ ] PII handling documented
- [ ] Photo storage uses signed URLs

## Security Headers

- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set

## Dependencies

- [ ] `npm audit` shows no high/critical
- [ ] No deprecated packages with known CVEs
- [ ] Lockfile committed

## Photo/File Upload

- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (if applicable)
- [ ] Storage access controls

---

**Reviewed By**: _______________
**Date**: _______________
**Status**: Pass / Fail / N/A
