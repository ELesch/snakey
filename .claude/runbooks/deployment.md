# Deployment Runbook

## Overview

Snakey is deployed to Vercel with automatic deployments from the main branch.

## Prerequisites

- Vercel account linked to repository
- Environment variables configured
- Database migrations applied

## Deployment Process

### Standard Deployment (via Git)

1. **Merge to main**
   ```bash
   git checkout main
   git pull
   git merge feature/your-feature
   git push
   ```

2. **Monitor Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Watch build progress
   - Check for build errors

3. **Verify Deployment**
   - Visit production URL
   - Test core features
   - Check error tracking

### Manual Deployment

If needed, deploy manually:

```bash
npx vercel --prod
```

## Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Build succeeds locally
- [ ] Database migrations applied
- [ ] Environment variables updated (if changed)

## Post-Deployment Verification

1. Check production URL loads
2. Test authentication flow
3. Verify database connectivity
4. Check offline functionality
5. Verify PWA installation

## Rollback

If issues are found, see `rollback.md`.
