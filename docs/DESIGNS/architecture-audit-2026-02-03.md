# Architecture Audit Report: Snakey Application

**Audit Date:** 2026-02-03
**Auditor:** Architecture Agent
**Status:** Complete

---

## Executive Summary

The Snakey application demonstrates a **well-structured layered architecture** with clear separation of concerns in most areas. The codebase follows modern Next.js patterns with a service-repository pattern for backend operations. However, there are a few notable architectural deviations that should be addressed for consistency.

**Overall Grade: B+**

---

## Architecture Diagram

```
+------------------------------------------------------------------+
|                        CLIENT LAYER                               |
|   +------------------+  +------------------+  +------------------+ |
|   |    Components    |  |      Hooks       |  |   Providers      | |
|   | (UI Rendering)   |  | (State + Query)  |  |  (Context)       | |
|   +--------+---------+  +--------+---------+  +------------------+ |
|            |                     |                                 |
|            v                     v                                 |
|   +------------------+  +------------------+                       |
|   |   shadcn/ui      |  |  TanStack Query  |                       |
|   +------------------+  +--------+---------+                       |
|                                  |                                 |
+----------------------------------+--------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                        API CLIENT LAYER                           |
|   +--------------------------------------------------------------+|
|   |                src/lib/api/*.api.ts                          ||
|   |  (Fetch wrappers, error handling, type-safe responses)       ||
|   +--------------------------------------------------------------+|
+------------------------------------------------------------------+
                                   |
                                   | HTTP
                                   v
+------------------------------------------------------------------+
|                        API ROUTES LAYER                           |
|   +--------------------------------------------------------------+|
|   |              src/app/api/**/route.ts                         ||
|   |  (Request parsing, auth check, response formatting)          ||
|   +--------------------------------------------------------------+|
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                        SERVICE LAYER                              |
|   +--------------------------------------------------------------+|
|   |               src/services/*.service.ts                      ||
|   |  (Business logic, validation, ownership verification)        ||
|   +--------------------------------------------------------------+|
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                       REPOSITORY LAYER                            |
|   +--------------------------------------------------------------+|
|   |             src/repositories/*.repository.ts                 ||
|   |  (Database queries only, no business logic)                  ||
|   +--------------------------------------------------------------+|
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                        DATABASE LAYER                             |
|   +--------------------------------------------------------------+|
|   |              src/lib/db/client.ts (Prisma)                   ||
|   +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

---

## 1. Layer Separation Analysis

### 1.1 Proper Layer Flow

The majority of the codebase follows the correct layer flow:

```
API Routes -> Services -> Repositories -> Database
```

**Positive Examples:**

| File | Pattern | Status |
|------|---------|--------|
| `src/app/api/reptiles/route.ts` | Route -> ReptileService | CORRECT |
| `src/services/reptile.service.ts` | Service -> ReptileRepository | CORRECT |
| `src/services/feeding.service.ts` | Service -> FeedingRepository | CORRECT |
| `src/services/shed.service.ts` | Service -> ShedRepository | CORRECT |
| `src/services/photo.service.ts` | Service -> PhotoRepository | CORRECT |
| `src/services/breeding.service.ts` | Service -> PairingRepository/ClutchRepository/HatchlingRepository | CORRECT |

### 1.2 Layer Violations Found

**VIOLATION #1: DashboardService bypasses Repository layer**

| File | Line(s) | Issue |
|------|---------|-------|
| `src/services/dashboard.service.ts` | 66-88 | Direct `prisma.reptile.count()`, `prisma.weight.count()`, `prisma.environmentLog.count()` calls |
| `src/services/dashboard.service.ts` | 112-133 | Direct `prisma.$queryRawUnsafe()` call |
| `src/services/dashboard.service.ts` | 147-159 | Direct `prisma.reptile.findMany()` with nested feedings |
| `src/services/dashboard.service.ts` | 216-244 | Direct `prisma.feeding.findMany()`, `prisma.shed.findMany()`, `prisma.weight.findMany()` |
| `src/services/dashboard.service.ts` | 306-315 | Direct `prisma.environmentLog.findMany()` |

**Severity:** Medium
**Impact:** Inconsistent database access patterns, harder to unit test, potential for query duplication.

**VIOLATION #2: ReportsService bypasses Repository layer**

| File | Line(s) | Issue |
|------|---------|-------|
| `src/services/reports.service.ts` | 130-141 | Direct `prisma.weight.findMany()`, `prisma.weight.count()` |
| `src/services/reports.service.ts` | 172-183 | Direct `prisma.feeding.findMany()`, `prisma.feeding.count()` |
| `src/services/reports.service.ts` | 257-268 | Direct `prisma.shed.findMany()`, `prisma.shed.count()` |
| `src/services/reports.service.ts` | 330-338 | Direct `prisma.environmentLog.findMany()` |
| `src/services/reports.service.ts` | 392-418 | Multiple direct prisma calls |

**Severity:** Medium
**Impact:** Same as above.

**VIOLATION #3: SyncService bypasses Repository layer for pull operations**

| File | Line(s) | Issue |
|------|---------|-------|
| `src/services/sync.service.ts` | 158-194 | Direct `prisma.reptile.findMany()`, `prisma.feeding.findMany()`, etc. in `getChangesSince()` |

**Severity:** Low (acceptable for sync-specific optimizations)
**Impact:** Acceptable trade-off for performance-critical sync operations.

---

## 2. Module Boundaries Analysis

### 2.1 Domain Isolation

The codebase is well-organized into clear domain modules:

| Domain | Services | Repositories | Components | Status |
|--------|----------|--------------|------------|--------|
| Reptiles | `reptile.service.ts` | `reptile.repository.ts` | `src/components/reptiles/` | ISOLATED |
| Feedings | `feeding.service.ts` | `feeding.repository.ts` | `src/components/tracker/` | ISOLATED |
| Sheds | `shed.service.ts` | `shed.repository.ts` | `src/components/tracker/` | ISOLATED |
| Weights | `weight.service.ts` | `weight.repository.ts` | `src/components/tracker/` | ISOLATED |
| Environment | `environment.service.ts` | `environment.repository.ts` | `src/components/tracker/` | ISOLATED |
| Photos | `photo.service.ts` | `photo.repository.ts` | `src/components/reptiles/` | ISOLATED |
| Breeding | `breeding.service.ts` | `breeding.repository.ts` | `src/components/breeding/` | ISOLATED |
| Vet | `vet.service.ts` | `vet.repository.ts` | `src/components/forms/` | ISOLATED |
| Dashboard | `dashboard.service.ts` | N/A | `src/components/dashboard/` | AGGREGATOR |
| Reports | `reports.service.ts` | N/A | `src/components/reports/` | AGGREGATOR |
| Sync | `sync.service.ts` | N/A | N/A | AGGREGATOR |

### 2.2 Cross-Module Dependencies

**Acceptable Cross-Module Dependencies:**

1. `base.service.ts` -> `ReptileRepository` (ownership verification helper)
2. `sync.service.ts` -> All domain services (aggregation pattern)
3. `breeding.service.ts` -> `ReptileRepository` (parent relationship)

**No Problematic Cross-Module Dependencies Found.**

---

## 3. Dependency Direction Analysis

### 3.1 Dependency Flow Verification

| Layer | Expected Dependencies | Actual | Status |
|-------|----------------------|--------|--------|
| Components | Hooks, UI lib | Hooks, shadcn/ui | CORRECT |
| Hooks | API Client, Types | API Client, Types from Services* | MINOR ISSUE |
| API Routes | Services, Auth, Response Utils | Services, Auth, Response Utils | CORRECT |
| Services | Repositories, Validation, Errors | Repositories (mostly), Validation, Errors | MOSTLY CORRECT |
| Repositories | Prisma Client, Types | Prisma Client, Types | CORRECT |

*Note: Components/Hooks import types from Services (see section 3.2)

### 3.2 Type Import Pattern (Minor Issue)

Components and hooks import **types** from service layer:

```typescript
// src/hooks/use-dashboard.ts
import type { DashboardStats, Activity } from '@/services/dashboard.service'

// src/components/dashboard/recent-activity.tsx
import type { ActivityType } from '@/services/dashboard.service'

// src/hooks/use-reports.ts
import type { ReportFilters, GrowthDataPoint } from '@/services/reports.service'
```

**Severity:** Low
**Analysis:** This is a common TypeScript pattern. Since these are `import type` statements, they only import type information and don't create runtime dependencies. The types correctly flow from service -> hooks -> components.

**Recommendation:** Consider extracting shared types to `src/types/` for cleaner separation.

### 3.3 Circular Dependencies Check

**No circular dependencies detected.**

Verified by checking:
- Services don't import from API routes
- Repositories don't import from services
- API routes don't import from components
- Components don't directly call services (use API client via hooks)

---

## 4. Error Hierarchy Analysis

### 4.1 Error Class Structure

**Location:** `src/lib/errors.ts`

```
Error (built-in)
    |
    +-- NotFoundError       (404, resource not found)
    +-- ForbiddenError      (403, access denied)
    +-- ValidationError     (400, input validation, with optional fieldErrors)
    +-- StorageError        (500, file/photo storage issues)
    +-- SyncValidationError (400, sync-specific validation)
    +-- SyncNotFoundError   (404, sync-specific not found)
    +-- SyncForbiddenError  (403, sync-specific access denied)
    +-- SyncConflictError   (409, sync conflict detection)
```

### 4.2 Error Handling Layers

| Layer | Error Source | Error Destination | Pattern |
|-------|-------------|-------------------|---------|
| Repositories | Prisma errors | Services | Propagate |
| Services | Business logic | API Routes (via throw) | Typed custom errors |
| API Routes | Services | HTTP Response | `withErrorHandler` wrapper |
| API Client | HTTP Response | UI Components | `ApiClientError` |

### 4.3 Error Handler Implementation

**Location:** `src/lib/api/error-handler.ts`

The centralized error handler properly maps custom errors to HTTP responses:

| Error Type | HTTP Code | Response Code |
|------------|-----------|---------------|
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `StorageError` | 500 | `STORAGE_ERROR` |
| `SyncValidationError` | 400 | `SYNC_VALIDATION_ERROR` |
| `SyncNotFoundError` | 404 | `SYNC_NOT_FOUND` |
| `SyncForbiddenError` | 403 | `SYNC_FORBIDDEN` |
| `SyncConflictError` | 409 | `SYNC_CONFLICT` |
| Unknown | 500 | `INTERNAL_ERROR` |

**Status:** WELL IMPLEMENTED

---

## 5. Index Exports Analysis

### 5.1 Index Files Found

| Location | Purpose | Status |
|----------|---------|--------|
| `src/lib/validations/index.ts` | Validation exports | EXISTS |
| `src/lib/offline/index.ts` | Offline utilities | EXISTS |
| `src/lib/utils/index.ts` | Utility functions | EXISTS |
| `src/lib/api/index.ts` | API utilities | EXISTS |
| `src/components/breeding/index.ts` | Breeding components | EXISTS |
| `src/components/landing/index.ts` | Landing page components | EXISTS |
| `src/components/reports/index.ts` | Reports components | EXISTS |
| `src/components/error/index.ts` | Error components | EXISTS |
| `src/components/shared/index.ts` | Shared components | EXISTS |
| `src/components/tracker/index.ts` | Tracker components | EXISTS |
| `src/components/forms/index.ts` | Form components | EXISTS |
| `src/hooks/index.ts` | Custom hooks | EXISTS |

### 5.2 Missing Index Files

| Location | Recommendation |
|----------|----------------|
| `src/services/index.ts` | SHOULD ADD - Would improve import clarity |
| `src/repositories/index.ts` | SHOULD ADD - Would improve import clarity |
| `src/components/dashboard/index.ts` | SHOULD ADD - For consistency |
| `src/components/reptiles/index.ts` | SHOULD ADD - For consistency |
| `src/components/layout/index.ts` | SHOULD ADD - For consistency |
| `src/components/ui/index.ts` | OPTIONAL - Often accessed directly |
| `src/types/index.ts` | SHOULD ADD - For consistency |

**Severity:** Low
**Impact:** Minor inconvenience in imports, no functional impact.

---

## 6. Strengths

### 6.1 Architectural Strengths

1. **Clear Service-Repository Pattern:** Most domain services correctly delegate database operations to repositories.

2. **Centralized Error Handling:** The `withErrorHandler` wrapper provides consistent error responses across all API routes.

3. **Ownership Verification:** The `base.service.ts` provides reusable ownership verification utilities (`verifyReptileOwnership`, `verifyRecordOwnership`).

4. **Type Safety:** Strong TypeScript usage throughout with Prisma-generated types.

5. **API Response Envelope:** Consistent `{ data, meta }` success and `{ error: { code, message } }` error response format.

6. **Soft Deletes:** Reptiles use soft delete pattern with `deletedAt` field.

7. **Validation Layer:** Zod schemas for input validation at service layer.

8. **Hooks Pattern:** Clean separation using TanStack Query hooks that call API client functions.

9. **PWA Architecture:** Offline-first patterns with Dexie for IndexedDB and sync queue.

10. **Singleton Services/Repositories:** Proper singleton pattern prevents multiple instantiation.

### 6.2 Code Quality Highlights

- Services are focused on business logic
- Repositories are pure database operations
- API routes are thin (auth + delegation + response)
- Components don't directly call services
- Consistent logging with Pino

---

## 7. Recommendations

### 7.1 Critical (Should Fix)

None.

### 7.2 High Priority

**H1: Introduce DashboardRepository and ReportsRepository**

Create repository layers for dashboard and reports to maintain consistency:

```typescript
// src/repositories/dashboard.repository.ts
export class DashboardRepository {
  async countReptiles(userId: string): Promise<number> { ... }
  async countFeedingsDue(userId: string): Promise<number> { ... }
  async getReptileFeedings(userId: string, options: {...}): Promise<...> { ... }
}

// src/repositories/reports.repository.ts
export class ReportsRepository {
  async getWeightData(userId: string, filters: ReportFilters): Promise<...> { ... }
  async getFeedingData(userId: string, filters: ReportFilters): Promise<...> { ... }
  async getShedData(userId: string, filters: ReportFilters): Promise<...> { ... }
}
```

**Rationale:** Maintains consistency, improves testability, centralizes query logic.

### 7.3 Medium Priority

**M1: Extract shared types to `src/types/`**

Move types currently exported from services:

```typescript
// src/types/dashboard.ts
export interface DashboardStats { ... }
export interface UpcomingFeeding { ... }
export interface EnvironmentAlert { ... }
export type ActivityType = 'feeding' | 'shed' | 'weight' | 'environment' | 'photo'
export interface Activity { ... }

// src/types/reports.ts
export interface ReportFilters { ... }
export interface GrowthDataPoint { ... }
export interface FeedingDataPoint { ... }
// etc.
```

**M2: Add missing index.ts files**

Add index exports for:
- `src/services/index.ts`
- `src/repositories/index.ts`
- `src/components/dashboard/index.ts`
- `src/components/reptiles/index.ts`
- `src/types/index.ts`

### 7.4 Low Priority

**L1: Consider a read-only query service pattern**

For complex aggregation queries (dashboard, reports), consider a CQRS-lite pattern:

```
Commands (mutations) -> Services -> Repositories
Queries (reads) -> QueryServices -> Repositories
```

This acknowledges that read patterns often differ from write patterns.

---

## 8. File Reference Summary

### Services Reviewed
- `src/services/base.service.ts` (161 lines)
- `src/services/reptile.service.ts` (223 lines)
- `src/services/feeding.service.ts` (160 lines)
- `src/services/shed.service.ts` (157 lines)
- `src/services/photo.service.ts` (211 lines)
- `src/services/breeding.service.ts` (567 lines)
- `src/services/dashboard.service.ts` (361 lines) - Layer violation
- `src/services/reports.service.ts` (576 lines) - Layer violation
- `src/services/sync.service.ts` (561 lines) - Acceptable deviation

### Repositories Reviewed
- `src/repositories/reptile.repository.ts` (128 lines)
- `src/repositories/feeding.repository.ts` (147 lines)

### API Routes Reviewed
- `src/app/api/reptiles/route.ts` (61 lines)
- `src/app/api/reptiles/[id]/route.ts` (161 lines)
- `src/app/api/dashboard/stats/route.ts` (25 lines)
- `src/app/api/sync/pull/route.ts` (76 lines)

### Infrastructure Reviewed
- `src/lib/errors.ts` (86 lines)
- `src/lib/api/error-handler.ts` (131 lines)
- `src/lib/api/response.ts` (116 lines)
- `src/lib/api/utils.ts` (201 lines)
- `src/lib/db/client.ts` (44 lines)

---

## Conclusion

The Snakey application demonstrates solid architectural foundations with a clear layered approach. The main areas for improvement are:

1. **Layer consistency** - Dashboard and Reports services should use repository layer
2. **Type organization** - Shared types should be centralized in `src/types/`
3. **Index exports** - Add missing index files for cleaner imports

The codebase is well-suited for maintenance and extension. The ownership verification patterns, error handling, and validation are particularly well-implemented.

---

**Document Location:** `docs/DESIGNS/architecture-audit-2026-02-03.md`
