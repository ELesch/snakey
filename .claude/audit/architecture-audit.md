# Architecture Audit Report

**Date:** 2026-02-01
**Auditor:** Architecture Auditor (Claude Opus 4.5)
**Scope:** Full codebase architecture review - Snakey PWA

## Executive Summary

The Snakey PWA demonstrates a well-structured architecture with clear layer separation between API routes, services, and repositories. The codebase follows consistent patterns across domain entities and properly implements an offline-first architecture. However, there are two services (DashboardService, ReportsService) that bypass the repository pattern and access Prisma directly, which is an architectural inconsistency that should be addressed.

## Critical Issues

No critical architecture violations found. The codebase maintains proper layer separation in most areas.

## High Priority Issues

### H1. DashboardService bypasses repository pattern

**Location:** `src/services/dashboard.service.ts:71-94, 108-119, 156-168, 227-256, 317-326`

**Issue:** The DashboardService directly imports and uses the Prisma client (`prisma`) for all database operations instead of going through repository classes. This violates the established repository pattern used by all other services.

**Example:**
```typescript
// dashboard.service.ts:71-72
prisma.reptile.count({
  where: { userId, deletedAt: null },
})
```

**Impact:**
- Inconsistent architecture makes the codebase harder to maintain
- Cannot easily mock database calls for unit testing
- Changes to database schema require changes in multiple layers

**Recommendation:** Create a `DashboardRepository` that encapsulates these aggregation queries, or use the existing ReptileRepository, FeedingRepository, etc. with aggregate methods.

---

### H2. ReportsService bypasses repository pattern

**Location:** `src/services/reports.service.ts:106-114, 137-145, 213-221, 281-289, 343-370`

**Issue:** The ReportsService directly imports and uses Prisma for complex aggregation queries rather than using repositories.

**Example:**
```typescript
// reports.service.ts:106-107
const weights = await prisma.weight.findMany({
  where,
  include: { reptile: { ... } },
```

**Impact:** Same as H1 - architectural inconsistency.

**Recommendation:** Either create report-specific repository methods or create a dedicated `ReportsRepository` for analytics queries.

---

### H3. SyncService bypasses repository pattern for pull operations

**Location:** `src/services/sync.service.ts:156-194`

**Issue:** The `getChangesSince` method in SyncService directly accesses Prisma for bulk data retrieval, while other sync operations correctly delegate to domain services.

**Example:**
```typescript
// sync.service.ts:158-163
prisma.reptile.findMany({
  where: {
    userId,
    updatedAt: { gte: since },
  },
})
```

**Recommendation:** Add `findUpdatedSince(since: Date)` methods to repositories for consistency.

## Medium Priority Issues

### M1. ShedRepository uses hard delete despite soft-delete convention

**Location:** `src/repositories/shed.repository.ts:82-87`

**Issue:** The `softDelete` method actually performs a hard delete using `prisma.shed.delete()`. The comment acknowledges this but doesn't follow the established soft-delete pattern used elsewhere.

```typescript
async softDelete(id: string): Promise<Shed> {
  // Note: Shed model doesn't have deletedAt field in schema
  // Using actual delete - but could add deletedAt to model if needed
  return prisma.shed.delete({
    where: { id },
  })
}
```

**Impact:** Inconsistent data retention policy - sheds are permanently deleted while reptiles and photos are soft-deleted.

**Recommendation:** Either add `deletedAt` field to Shed model or rename the method to `delete()` to avoid confusion.

---

### M2. Service constructors create new repository instances

**Location:** All service files (e.g., `src/services/feeding.service.ts:24-26`)

**Issue:** Each service creates new repository instances in its constructor rather than using dependency injection or the exported singleton instances.

```typescript
constructor() {
  this.feedingRepository = new FeedingRepository()
  this.reptileRepository = new ReptileRepository()
}
```

**Impact:**
- Multiple instances of the same repository class exist
- Harder to mock for testing
- Cannot share cached state between instances

**Recommendation:** Use the exported singleton instances (`feedingRepository`, `reptileRepository`) or implement proper dependency injection.

---

### M3. Inconsistent error class exports

**Location:** Multiple service files

**Issue:** Error classes are re-exported from service files "for backwards compatibility" but this creates coupling between services and error handling.

```typescript
// Appears in multiple services
export { NotFoundError, ForbiddenError, ValidationError }
```

**Impact:** Consumers may import errors from inconsistent locations.

**Recommendation:** Import errors directly from `@/lib/errors` consistently.

---

### M4. Hook files directly access IndexedDB

**Location:** `src/hooks/use-reptiles.ts:59-65, 89-90, 189, 245`

**Issue:** Hooks directly access `offlineDb` (Dexie) for CRUD operations rather than going through a dedicated offline data layer.

```typescript
await offlineDb.reptiles.add(offlineReptile)
await offlineDb.syncQueue.add({...})
```

**Impact:** Business logic for offline operations is scattered across hooks rather than centralized.

**Recommendation:** Create an offline repository layer (e.g., `OfflineReptileRepository`) that hooks can use, maintaining the same repository pattern as the server-side code.

## Low Priority Issues

### L1. Default feeding intervals hardcoded in DashboardService

**Location:** `src/services/dashboard.service.ts:48-55`

**Issue:** Species-specific feeding intervals are hardcoded in the service rather than using the species configuration system.

```typescript
const DEFAULT_FEEDING_INTERVALS: Record<string, number> = {
  'Ball Python': 10,
  'Corn Snake': 7,
  ...
}
```

**Recommendation:** Import from `src/lib/species/defaults.ts` for consistency with project conventions.

---

### L2. Prisma include options built in API route handler

**Location:** `src/app/api/reptiles/[id]/route.ts:186-240`

**Issue:** The `buildIncludeOptions` helper function in the API route file constructs Prisma-specific query options. This leaks Prisma implementation details into the controller layer.

**Recommendation:** Move this logic to the service or repository layer.

---

### L3. API client module exists but not universally used

**Location:** `src/lib/api/*.api.ts`

**Issue:** A clean API client layer exists (`reptile.api.ts`, etc.) but some components might fetch directly. The pattern is good but should be enforced project-wide.

**Recommendation:** Document that all client-side HTTP calls must go through the API client layer.

## Patterns Observed

### Good Patterns

1. **Clean Layer Separation (Most Areas)**
   - API routes handle HTTP concerns only
   - Services contain business logic and validation
   - Repositories encapsulate Prisma operations
   - Components use hooks for data access

2. **Consistent Service Structure**
   - All domain services follow the same pattern
   - Ownership verification before mutations
   - Zod validation in service layer
   - Structured logging with context

3. **Repository Pattern Implementation**
   - Clear interfaces with `FindManyOptions`, `FindByIdOptions`
   - Pagination support in `findMany` methods
   - Proper use of Prisma types
   - Singleton exports for reuse

4. **Offline-First Architecture**
   - Well-designed Dexie schema mirroring Prisma models
   - Sync queue with retry logic
   - Pull/push sync separation
   - Online status detection and automatic sync

5. **Hook Abstraction**
   - TanStack Query for server state
   - Dexie React Hooks for offline state
   - Clean merge of online/offline data
   - Optimistic updates with rollback

6. **Error Handling**
   - Custom error classes (NotFoundError, ForbiddenError, etc.)
   - Consistent error responses from API routes
   - Error boundaries in components

7. **Type Safety**
   - Generated Prisma types used throughout
   - Zod schemas for runtime validation
   - TypeScript strict mode enabled

### Anti-Patterns

1. **Direct Prisma Access in Services**
   - DashboardService and ReportsService bypass repositories
   - SyncService.getChangesSince bypasses repositories
   - Creates inconsistent testing and maintenance patterns

2. **Service-Level Repository Instantiation**
   - Services create new repository instances instead of using singletons
   - Prevents proper dependency injection

3. **Mixed Delete Strategies**
   - Reptiles and Photos use soft delete
   - Sheds use hard delete despite method name
   - Unclear data retention policy

4. **Controller-Level Prisma Knowledge**
   - API route builds Prisma include options
   - Should be encapsulated in service/repository

## Recommendations

### Immediate (Before Next Release)

1. **Create DashboardRepository and ReportsRepository** - Extract Prisma calls from these services to maintain consistent architecture
2. **Fix ShedRepository.softDelete** - Either implement soft delete or rename the method

### Short-Term (Next Sprint)

3. **Use repository singletons in services** - Refactor service constructors to use exported singleton instances
4. **Add findUpdatedSince to repositories** - For SyncService.getChangesSince consistency

### Long-Term (Technical Debt Backlog)

5. **Create offline repository layer** - Abstract IndexedDB operations in hooks to match server-side pattern
6. **Centralize error imports** - Remove re-exports from services, import from `@/lib/errors`
7. **Move include options to service layer** - Remove Prisma-specific logic from API routes
8. **Document architecture decisions** - Create ADR for repository pattern and offline strategy

## Architectural Health Score

| Area | Score | Notes |
|------|-------|-------|
| Layer Separation | 8/10 | Good except DashboardService/ReportsService |
| Repository Pattern | 7/10 | Consistent but some bypasses |
| Offline Architecture | 9/10 | Well-designed, could use repository abstraction |
| Error Handling | 9/10 | Consistent and comprehensive |
| Type Safety | 10/10 | Excellent use of Prisma types and Zod |
| **Overall** | **8.6/10** | Solid architecture with minor inconsistencies |

---

*Report generated by Architecture Auditor on 2026-02-01*
