# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Code Quality

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Build succeeds locally

### Environment

- [ ] Environment variables documented
- [ ] Secrets not in codebase
- [ ] Production env vars configured in Vercel
- [ ] Database URL points to production

### Database

- [ ] Migrations applied
- [ ] Schema matches production
- [ ] Seed data (if applicable)
- [ ] Backup taken

### Security

- [ ] Security checklist completed
- [ ] `npm audit` clean
- [ ] No hardcoded credentials

## Deployment

### Process

- [ ] Feature branch merged to main
- [ ] Vercel preview build successful
- [ ] Preview tested

### Verification

- [ ] Production URL accessible
- [ ] Authentication working
- [ ] Core features functional
- [ ] No console errors
- [ ] Mobile responsive

## Post-Deployment

### Monitoring

- [ ] Error tracking active (Sentry)
- [ ] Logs accessible
- [ ] Analytics working

### Documentation

- [ ] CHANGELOG updated
- [ ] Version bumped (if applicable)
- [ ] Release notes (if applicable)

---

**Deployed By**: _______________
**Date**: _______________
**Version**: _______________
