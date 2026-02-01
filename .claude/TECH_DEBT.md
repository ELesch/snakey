# Tech Debt: Snakey

> Tracked technical debt items. Prioritize and address during refactoring cycles.
> Last updated: 2026-02-01 (from comprehensive audit)

## Active Debt

### DEBT-001: Missing Error Boundaries

**Priority**: P0 (Critical)
**Created**: 2026-02-01
**Area**: Frontend

**Description**:
No React error boundaries exist. Uncaught errors cause blank white screens.

**Impact**:
- App crashes are not gracefully handled
- Users see blank screens on errors
- No error recovery possible without page refresh

**Proposed Solution**:
Create error boundary files:
- `src/app/global-error.tsx`
- `src/app/(app)/error.tsx`
- `src/app/(auth)/error.tsx`

**Effort Estimate**: S

---

### DEBT-002: Accessibility WCAG A Failures

**Priority**: P0 (Critical)
**Created**: 2026-02-01
**Area**: Frontend

**Description**:
4 WCAG Level A failures blocking users with disabilities.

**Impact**:
- Keyboard users cannot bypass navigation
- Screen readers cannot hear form errors
- Some users cannot effectively use the app

**Proposed Solution**:
1. Add skip navigation link to layout
2. Add aria-describedby to form error messages
3. Add id attributes to SelectTrigger components
4. Add aria-hidden to decorative icons

**Effort Estimate**: M

---

### DEBT-003: Inconsistent API Response Format

**Priority**: P0 (Critical)
**Created**: 2026-02-01
**Area**: Backend

**Description**:
List endpoints return raw `result` while single-item endpoints return `{ data: result }`.

**Impact**:
- Inconsistent client-side response handling
- Potential for runtime errors
- Developer confusion

**Proposed Solution**:
Standardize all list endpoints to return `{ data: result }` format.

**Effort Estimate**: M

---

### DEBT-004: Low Test Coverage

**Priority**: P1 (High)
**Created**: 2026-02-01
**Area**: Testing

**Description**:
Only 15-20% overall test coverage. Critical gaps in repositories, API routes, components, and hooks.

**Impact**:
- Regressions likely during development
- Refactoring is risky
- Bug fixes may introduce new bugs

**Proposed Solution**:
1. Add repository tests
2. Add API route tests
3. Add component tests
4. Add hook tests
5. Set up coverage reporting

**Effort Estimate**: XL

---

### DEBT-005: Missing Rate Limiting

**Priority**: P1 (High)
**Created**: 2026-02-01
**Area**: Security

**Description**:
No rate limiting on authentication endpoints.

**Impact**:
- Brute force attacks possible
- Credential stuffing vulnerability
- Potential account takeover

**Proposed Solution**:
Implement rate limiting using upstash/ratelimit or similar.

**Effort Estimate**: S

---

### DEBT-006: Duplicate Validation Directories

**Priority**: P1 (High)
**Created**: 2026-02-01
**Area**: Backend

**Description**:
Two validation directories exist: `src/validations/` (active) and `src/lib/validations/` (legacy).

**Impact**:
- Confusion about which to use
- Potential for conflicting schemas
- Maintenance overhead

**Proposed Solution**:
Delete `src/lib/validations/` after verifying no imports reference it.

**Effort Estimate**: XS

---

### DEBT-007: API Error Handling Duplication

**Priority**: P1 (High)
**Created**: 2026-02-01
**Area**: Backend

**Description**:
Identical 20+ line error handling blocks repeated across all 36 API routes (~400 lines of duplication).

**Impact**:
- DRY violation
- Error handling inconsistencies
- Maintenance burden

**Proposed Solution**:
Extract shared error handling utility function or wrapper.

**Effort Estimate**: M

---

### DEBT-008: Dashboard Performance

**Priority**: P1 (High)
**Created**: 2026-02-01
**Area**: Performance

**Description**:
Dashboard loads all reptiles to calculate feeding schedules instead of using DB aggregation.

**Impact**:
- Slow dashboard load for users with many reptiles
- Unnecessary data transfer
- Memory pressure

**Proposed Solution**:
Use Prisma aggregation queries to compute feeding stats server-side.

**Effort Estimate**: M

---

### DEBT-009: Services Bypassing Repository

**Priority**: P2 (Medium)
**Created**: 2026-02-01
**Area**: Architecture

**Description**:
DashboardService and ReportsService make direct Prisma calls instead of using repositories.

**Impact**:
- Breaks layer abstraction
- Makes caching/testing harder
- Inconsistent data access patterns

**Proposed Solution**:
Create appropriate repository methods for dashboard and reports queries.

**Effort Estimate**: M

---

### DEBT-010: No Toast/Notification System

**Priority**: P2 (Medium)
**Created**: 2026-02-01
**Area**: Frontend

**Description**:
Mutation errors are caught but not displayed to users. No global notification system.

**Impact**:
- Users unaware when operations fail
- Poor UX on error conditions
- Silent failures

**Proposed Solution**:
Install sonner or react-hot-toast and wrap mutations with toast feedback.

**Effort Estimate**: S

---

### DEBT-011: Unbounded Report Queries

**Priority**: P2 (Medium)
**Created**: 2026-02-01
**Area**: Performance

**Description**:
Reports service has no pagination on queries.

**Impact**:
- Performance degradation with large datasets
- Potential timeouts
- Memory issues

**Proposed Solution**:
Add pagination parameters to report endpoints.

**Effort Estimate**: M

---

### DEBT-012: Recharts Not Dynamically Imported

**Priority**: P2 (Medium)
**Created**: 2026-02-01
**Area**: Performance

**Description**:
Recharts (~150KB) included in main bundle.

**Impact**:
- Larger initial bundle size
- Slower first load
- Affects users who don't view charts

**Proposed Solution**:
Use `next/dynamic` to lazy-load chart components.

**Effort Estimate**: S

---

### DEBT-013: Missing API Documentation

**Priority**: P2 (Medium)
**Created**: 2026-02-01
**Area**: Documentation

**Description**:
Only 1 of 12 API endpoint groups documented. Service methods lack JSDoc.

**Impact**:
- Developer onboarding slower
- API usage errors
- Harder to maintain

**Proposed Solution**:
1. Document all API endpoints using existing template
2. Add JSDoc to service methods

**Effort Estimate**: L

---

### DEBT-014: Dev Dependency Vulnerabilities

**Priority**: P3 (Low)
**Created**: 2026-02-01
**Area**: Security

**Description**:
9 moderate severity vulnerabilities in dev dependencies.

**Impact**:
- Audit warnings
- Potential CI/CD issues
- Not a production risk (dev only)

**Proposed Solution**:
Run `npm audit fix` to address fixable vulnerabilities.

**Effort Estimate**: XS

---

### DEBT-015: TODO Comments in History Components

**Priority**: P3 (Low)
**Created**: 2026-02-01
**Area**: Frontend

**Description**:
12 TODO comments indicating placeholder implementations.

**Impact**:
- Incomplete features
- Technical debt accumulation

**Proposed Solution**:
Address or track as backlog items with proper issues.

**Effort Estimate**: M

---

## Resolved Debt

*No resolved debt yet.*

---

## Debt Summary

| Priority | Count | Effort |
|----------|-------|--------|
| P0 (Critical) | 3 | S + M + M |
| P1 (High) | 5 | XL + S + XS + M + M |
| P2 (Medium) | 5 | M + S + M + S + L |
| P3 (Low) | 2 | XS + M |

**Total Items**: 15
**Recommended First Sprint**: DEBT-001, DEBT-002, DEBT-003 (Critical items)
