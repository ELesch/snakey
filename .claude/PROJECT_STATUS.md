# Project Status: Snakey

> **Last Updated**: 2026-01-31
>
> Read this file first when starting a new session.

## Current Sprint

**Sprint Goal**: Initial project scaffolding and core feature development

### Active Tasks

| Task | Status | Assigned To | Notes |
|------|--------|-------------|-------|
| Project scaffolding | Complete | Initializer | Framework ready |
| Database schema | Pending | - | Prisma schema created, needs push |
| Supabase setup | Pending | - | See ONBOARDING.md |
| Auth implementation | Pending | - | Supabase Auth |
| Reptile CRUD | Pending | - | Core feature |

### Completed This Sprint

- [x] Project directory structure created
- [x] Orchestrator framework deployed
- [x] Tech stack documented with gotchas
- [x] Prisma schema defined
- [x] Offline DB schema defined (Dexie)

## Quick Actions

**To continue development:**
1. Set up Supabase project (see ONBOARDING.md)
2. Copy credentials to `.env.local`
3. Run `npm install && npx prisma generate && npx prisma db push`
4. Run `npm run dev`

## Priorities

1. **P0 - Blocking**: Database setup (Supabase project creation)
2. **P1 - High**: Authentication flow
3. **P1 - High**: Reptile profile CRUD
4. **P2 - Medium**: Feeding log feature
5. **P2 - Medium**: Shed tracking feature

## Known Issues

See `.claude/BLOCKERS.md` for active blockers.

## Tech Debt

See `.claude/TECH_DEBT.md` for tracked items.

## Upcoming

- Offline sync implementation
- Photo upload and gallery
- Data visualization charts
- PWA installation
