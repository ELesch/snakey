# Blockers: Snakey

> Active blockers preventing progress. Update this file when blockers are identified or resolved.

## Active Blockers

### BLOCK-001: Supabase Project Not Created

**Status**: Open
**Created**: 2026-01-31
**Assigned**: User
**Blocks**: All database operations, authentication

**Description**:
A Supabase project must be created and credentials configured before the database can be used.

**Resolution Steps**:
1. Go to https://supabase.com/dashboard
2. Create new project
3. Get connection strings from Project Settings -> Database
4. Get API keys from Project Settings -> API
5. Add to `.env.local`
6. Run `npx prisma db push`

**See**: ONBOARDING.md for detailed instructions

---

## Resolved Blockers

*No resolved blockers yet.*

---

## Template

When adding a new blocker:

```markdown
### BLOCK-XXX: Title

**Status**: Open
**Created**: YYYY-MM-DD
**Assigned**: Name or Team
**Blocks**: What is blocked

**Description**:
What is the problem?

**Resolution Steps**:
1. Step one
2. Step two

**Notes**:
Any additional context
```
