# Rollback Runbook

## When to Rollback

- Critical bug in production
- Data corruption
- Security vulnerability
- Major feature broken

## Quick Rollback (Vercel)

1. **Go to Vercel Dashboard**
   - Navigate to project
   - Go to "Deployments" tab

2. **Find Previous Deployment**
   - Locate last known good deployment
   - Click the three dots menu

3. **Promote to Production**
   - Click "Promote to Production"
   - Confirm the rollback

4. **Verify**
   - Check production URL
   - Test affected features

## Git Rollback

If you need to rollback the code:

```bash
# Find the commit to rollback to
git log --oneline -10

# Revert the problematic commit
git revert <commit-hash>
git push

# Or reset to a previous commit (destructive)
git reset --hard <commit-hash>
git push --force  # Use with caution
```

## Database Rollback

If database migration caused issues:

1. **Check migration status**
   ```bash
   npx prisma migrate status
   ```

2. **Rollback migration** (if possible)
   - Prisma doesn't have built-in rollback
   - Create a new migration that reverts changes
   - Or restore from backup

3. **Restore from backup**
   - Go to Supabase dashboard
   - Navigate to Database > Backups
   - Restore to point before issue

## Post-Rollback

1. Notify team of rollback
2. Investigate root cause
3. Fix issue in development
4. Test thoroughly before re-deploying
5. Document incident

## Contacts

- **On-call**: (project owner)
- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
