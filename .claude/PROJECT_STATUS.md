# Project Status: Snakey

> **Last Updated**: 2026-02-01
>
> Read this file first when starting a new session.

## Current Sprint

**Sprint Goal**: Quality improvements and production readiness

### Active Tasks

| Task | Status | Assigned To | Notes |
|------|--------|-------------|-------|
| Project scaffolding | Complete | Initializer | Framework ready |
| Database schema | Complete | - | Prisma schema pushed |
| Supabase setup | Complete | - | Auth + Database configured |
| Auth implementation | Complete | - | Supabase Auth integrated |
| Reptile CRUD | Complete | - | Full CRUD with API routes |
| Quality improvements | Complete | - | See completed items below |

### Completed This Sprint

- [x] Project directory structure created
- [x] Orchestrator framework deployed
- [x] Tech stack documented with gotchas
- [x] Prisma schema defined
- [x] Offline DB schema defined (Dexie)
- [x] Error boundaries for graceful error handling
- [x] Accessibility improvements (WCAG compliance)
- [x] Comprehensive test coverage for repositories and API routes
- [x] Chart code splitting for performance
- [x] Standardized API response format
- [x] Dashboard query optimization (N+1 fixes)
- [x] Reports pagination (max 1000 records)
- [x] Color contrast fixes for accessibility
- [x] Null query parameter handling fix

## Quick Actions

**To continue development:**
1. Run `npm install && npx prisma generate`
2. Run `npm run dev`

**To run tests:**
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Priorities

1. **P1 - High**: Feeding log feature
2. **P1 - High**: Shed tracking feature
3. **P2 - Medium**: Weight tracking with trends
4. **P2 - Medium**: Photo upload and gallery
5. **P3 - Low**: Breeding/clutch management

## Known Issues

See `.claude/BLOCKERS.md` for active blockers.

## Tech Debt

See `.claude/TECH_DEBT.md` for tracked items.

## Upcoming

- Feeding log feature (CRUD + UI)
- Shed tracking feature (CRUD + UI)
- Offline sync implementation
- Photo upload and gallery
- PWA installation and testing
