# API Quality Audit Report

**Date**: 2026-02-03
**Auditor**: dev-api (API Design Agent)
**Scope**: All API routes in `src/app/api/**/route.ts`

---

## Executive Summary

The Snakey API demonstrates **strong adherence** to REST conventions and consistent patterns. The codebase shows mature API design with centralized error handling, response envelopes, and comprehensive Zod validation schemas. A few medium-priority inconsistencies and improvement opportunities were identified.

**Overall Score: B+ (Good)**

| Category | Score | Notes |
|----------|-------|-------|
| REST Conventions | A | Proper HTTP methods, resource naming, status codes |
| Response Consistency | B+ | Good envelope usage with minor inconsistencies |
| Error Handling | A | Comprehensive centralized error handler |
| Validation | A- | Strong Zod schemas with minor gaps |
| Documentation | B | Consistent patterns but no OpenAPI spec |
| Pagination | B+ | Well-designed but inconsistent meta fields |

---

## Critical Issues

**None identified.**

The API has no critical contract violations that would break client integrations.

---

## High Priority Issues

### H1. Inconsistent List Response Envelope Usage

**Severity**: High
**Impact**: Clients must handle two different response formats for list endpoints

**Files Affected**:
- `src/app/api/reptiles/route.ts` (line 43)
- `src/app/api/reptiles/[id]/feedings/route.ts` (line 49)
- `src/app/api/reptiles/[id]/sheds/route.ts` (line 49)
- `src/app/api/reptiles/[id]/weights/route.ts` (line 49)
- `src/app/api/reptiles/[id]/vet-visits/route.ts` (line 49)
- `src/app/api/pairings/route.ts` (line 44)

**Current Behavior**:
```typescript
// These routes use raw NextResponse.json():
return NextResponse.json(result)  // Returns { data: [...], meta: {...} }

// While dashboard/activity uses listResponse():
return listResponse(activity)  // Returns { data: [...], meta: { count: N } }
```

**Issue**: The routes return `NextResponse.json(result)` directly instead of using `listResponse()` or `successResponse()`. While the service already returns paginated format, this bypasses the response envelope helpers and creates inconsistency.

**Recommendation**: Standardize all list endpoints to use consistent response helpers:
```typescript
// Option 1: Use successResponse with meta
return successResponse(result.data, result.meta)

// Option 2: Keep service format but ensure all use same pattern
return NextResponse.json(result)  // If service already wraps correctly
```

---

### H2. DELETE Responses Lack Consistent Structure

**Severity**: High
**Impact**: Clients cannot rely on consistent delete response format

**Files Affected**:
- `src/app/api/weights/[id]/route.ts` (line 67)
- `src/app/api/feedings/[id]/route.ts` (line 67)
- `src/app/api/sheds/[id]/route.ts` (line 67)

**Variation Examples**:
```typescript
// src/app/api/weights/[id]/route.ts - Custom format
return successResponse({ id: result.id, deleted: true })

// src/app/api/feedings/[id]/route.ts - Service format passthrough
return successResponse(result)  // Returns { id, deletedAt? } depending on service

// src/app/api/reptiles/[id]/route.ts - Soft delete returns { id, deletedAt }
return successResponse(result)
```

**Recommendation**: Standardize all DELETE responses:
```typescript
// For soft deletes (reptiles):
{ data: { id: string, deletedAt: string } }

// For hard deletes (child resources):
{ data: { id: string, deleted: true } }
```

This matches the documented `DeleteResponse` type in `src/lib/api/types.ts`.

---

## Medium Priority Issues

### M1. Pagination Meta Field Naming Inconsistency

**Severity**: Medium
**Impact**: API consumers may be confused by different meta field names

**Files Affected**:
- `src/lib/api/response.ts` (ListMeta interface)
- `src/lib/api/types.ts` (PaginationMeta interface)

**Current State**:
```typescript
// src/lib/api/response.ts - ListMeta
interface ListMeta {
  count: number      // Items in current response
  page?: number
  pageSize?: number  // Uses "pageSize"
  total?: number
}

// src/lib/api/types.ts - PaginationMeta (client types)
interface PaginationMeta {
  page: number
  limit: number      // Uses "limit" instead of "pageSize"
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
```

**Recommendation**: Align field names. Prefer `limit` over `pageSize` as it matches query parameter naming. Update `ListMeta` or ensure services return consistent format.

---

### M2. Missing Query Parameter Validation Schema for Dashboard Endpoints

**Severity**: Medium
**Impact**: Dashboard limit parameter has ad-hoc validation instead of schema

**File**: `src/app/api/dashboard/activity/route.ts` (lines 20-24)

**Current**:
```typescript
const limit = parseInt(searchParams.get('limit') ?? '10', 10)
// ... Math.min(limit, 50)
```

**Recommendation**: Create a validation schema:
```typescript
// src/validations/dashboard.ts
export const DashboardActivityQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
})
```

---

### M3. Sync Endpoint Error Response Inconsistency

**Severity**: Medium
**Impact**: Sync conflict returns mixed response format

**File**: `src/app/api/sync/[table]/route.ts` (lines 79-87)

**Current**:
```typescript
// Conflict response mixes data and message at top level
return NextResponse.json(
  {
    data: result,
    message: 'Conflict detected - server record is newer',
  },
  { status: 409 }
)
```

**Issue**: Other error responses use `{ error: { code, message } }` envelope. Conflicts should either use error envelope or be documented as intentional exception.

**Recommendation**: Use consistent error envelope:
```typescript
return errorResponse(
  'SYNC_CONFLICT',
  'Conflict detected - server record is newer',
  409,
  { serverRecord: result.serverRecord, clientTimestamp: result.clientTimestamp }
)
```

---

### M4. POST /restore Should Use PUT Verb

**Severity**: Medium
**Impact**: Non-standard REST semantics

**File**: `src/app/api/reptiles/[id]/restore/route.ts`

**Current**: `POST /api/reptiles/{id}/restore`

**Analysis**: The restore operation modifies an existing resource (clears `deletedAt`). REST semantics suggest:
- `PUT /api/reptiles/{id}` with `{ deletedAt: null }` (update pattern)
- `PATCH /api/reptiles/{id}/restore` (partial modification)
- Or keep POST if treating restore as an action/command

**Recommendation**: Document this as an intentional command pattern, or consider:
```
PUT /api/reptiles/{id}/restore   # If restore is considered update
PATCH /api/reptiles/{id}         # With { deletedAt: null }
```

---

### M5. Missing PATCH Support for Partial Updates

**Severity**: Medium
**Impact**: Clients must send all fields for updates even for partial changes

**Files Affected**: All `[id]/route.ts` files use `PUT` for updates

**Current**: All updates use `PUT` method, but update schemas allow partial fields (optional properties).

**Analysis**: Semantically:
- `PUT` should replace entire resource (all fields required)
- `PATCH` should modify specific fields (partial update)

The current implementation accepts partial updates via PUT, which works but is not strictly RESTful.

**Recommendation**: Either:
1. Add `PATCH` handlers alongside `PUT` (preferred for strict REST)
2. Document that `PUT` accepts partial updates (pragmatic approach)

---

## Low Priority Issues

### L1. Inconsistent Log Context Naming

**Severity**: Low
**Impact**: Minor debugging inconvenience

**Examples**:
```typescript
// Some use suffixed API:
withErrorHandler(..., 'ReptileAPI')
withErrorHandler(..., 'FeedingAPI')

// Dashboard is more specific:
withErrorHandler(..., 'DashboardStatsAPI')
withErrorHandler(..., 'DashboardActivityAPI')
```

**Recommendation**: Establish naming convention:
- `{Resource}API` for simple resources
- `{Resource}{Action}API` for specific actions

---

### L2. No Rate Limiting Headers

**Severity**: Low
**Impact**: Clients cannot implement proactive rate limiting

**Recommendation**: Consider adding standard rate limiting headers:
```typescript
headers: {
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '95',
  'X-RateLimit-Reset': '1612345678',
}
```

---

### L3. Missing OPTIONS Handlers

**Severity**: Low
**Impact**: CORS preflight may not work in some configurations

**Recommendation**: Next.js handles OPTIONS automatically, but explicit handlers allow custom CORS configuration. Low priority unless CORS issues arise.

---

### L4. Query Schema for Sync Pull Missing

**Severity**: Low
**Impact**: Ad-hoc timestamp parsing instead of schema validation

**File**: `src/app/api/sync/pull/route.ts` (lines 29-49)

**Recommendation**: Create schema:
```typescript
const SyncPullQuerySchema = z.object({
  since: z.union([
    z.coerce.number().int().positive(),
    z.string().datetime(),
  ]).optional().transform(v => v ? new Date(v) : new Date(0)),
})
```

---

### L5. No Request ID / Correlation ID

**Severity**: Low
**Impact**: Harder to trace requests through logs

**Recommendation**: Add request ID middleware:
```typescript
const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
// Include in log context and response headers
```

---

## Compliant Patterns (Best Practices)

### C1. Centralized Error Handler

**Files**: `src/lib/api/error-handler.ts`

**Excellence**: The `withErrorHandler` pattern provides:
- Consistent error mapping from domain errors to HTTP responses
- Centralized logging with context
- Development vs production error message handling
- Type-safe function overloads

### C2. Response Envelope Structure

**Files**: `src/lib/api/response.ts`

**Excellence**:
- Clear `SuccessEnvelope<T>` and `ErrorEnvelope` types
- Convenience functions: `successResponse`, `errorResponse`, `listResponse`
- Pre-built error helpers: `unauthorizedResponse`, `notFoundResponse`, etc.

### C3. Comprehensive Zod Validation Schemas

**Files**: `src/validations/*.ts`

**Excellence**:
- Create and Update schemas for each resource
- Query schemas with pagination defaults
- Custom refinements (date validation, cross-field validation)
- Proper coercion for dates and numbers from query strings
- Optional client ID support for offline-first

### C4. Proper HTTP Status Codes

**Observed Status Code Usage**:
| Status | Usage | Correct |
|--------|-------|---------|
| 200 | GET success, PUT success, DELETE success | Yes |
| 201 | POST create success | Yes |
| 400 | Validation errors | Yes |
| 401 | Missing authentication | Yes |
| 403 | Access denied | Yes |
| 404 | Resource not found | Yes |
| 409 | Sync conflicts | Yes |
| 500 | Internal server errors | Yes |

### C5. Resource Naming Conventions

**Excellence**:
- Plural nouns: `/reptiles`, `/feedings`, `/sheds`
- Hierarchical nesting: `/reptiles/{id}/feedings`
- Kebab-case for multi-word: `/vet-visits`
- Action endpoints clearly marked: `/restore`

### C6. Consistent Auth Pattern

**All routes follow**:
```typescript
const userId = await getUserId()
if (!userId) {
  return unauthorizedResponse()
}
```

### C7. TypeScript Type Safety

**Excellence**:
- Proper typing for route params with Next.js 15 async params
- Zod inference for request/response types
- Shared types in `src/lib/api/types.ts`

---

## API Endpoint Inventory

| Method | Endpoint | Purpose | Validation |
|--------|----------|---------|------------|
| GET | `/api/reptiles` | List reptiles | ReptileQuerySchema |
| POST | `/api/reptiles` | Create reptile | ReptileCreateSchema |
| GET | `/api/reptiles/{id}` | Get reptile | ReptileIncludeSchema |
| PUT | `/api/reptiles/{id}` | Update reptile | ReptileUpdateSchema |
| DELETE | `/api/reptiles/{id}` | Soft delete | - |
| POST | `/api/reptiles/{id}/restore` | Restore deleted | - |
| GET | `/api/reptiles/{id}/feedings` | List feedings | FeedingQuerySchema |
| POST | `/api/reptiles/{id}/feedings` | Create feeding | FeedingCreateSchema |
| GET | `/api/feedings/{id}` | Get feeding | - |
| PUT | `/api/feedings/{id}` | Update feeding | FeedingUpdateSchema |
| DELETE | `/api/feedings/{id}` | Delete feeding | - |
| GET | `/api/reptiles/{id}/sheds` | List sheds | ShedQuerySchema |
| POST | `/api/reptiles/{id}/sheds` | Create shed | ShedCreateSchema |
| GET | `/api/sheds/{id}` | Get shed | - |
| PUT | `/api/sheds/{id}` | Update shed | ShedUpdateSchema |
| DELETE | `/api/sheds/{id}` | Delete shed | - |
| GET | `/api/reptiles/{id}/weights` | List weights | WeightQuerySchema |
| POST | `/api/reptiles/{id}/weights` | Create weight | WeightCreateSchema |
| GET | `/api/weights/{id}` | Get weight | - |
| PUT | `/api/weights/{id}` | Update weight | WeightUpdateSchema |
| DELETE | `/api/weights/{id}` | Delete weight | - |
| GET | `/api/reptiles/{id}/environment` | List env logs | EnvironmentQuerySchema |
| POST | `/api/reptiles/{id}/environment` | Create env log | EnvironmentCreateSchema |
| GET | `/api/environment/{id}` | Get env log | - |
| PUT | `/api/environment/{id}` | Update env log | EnvironmentUpdateSchema |
| DELETE | `/api/environment/{id}` | Delete env log | - |
| GET | `/api/reptiles/{id}/photos` | List photos | PhotoQuerySchema |
| POST | `/api/reptiles/{id}/photos` | Create photo | PhotoCreateSchema |
| GET | `/api/photos/{id}` | Get photo | - |
| PUT | `/api/photos/{id}` | Update photo | PhotoUpdateSchema |
| DELETE | `/api/photos/{id}` | Delete photo | - |
| POST | `/api/photos/upload-url` | Get upload URL | UploadUrlRequestSchema |
| GET | `/api/reptiles/{id}/vet-visits` | List vet visits | VetQuerySchema |
| POST | `/api/reptiles/{id}/vet-visits` | Create visit | VetVisitCreateSchema |
| GET | `/api/vet-visits/{id}` | Get visit | - |
| PUT | `/api/vet-visits/{id}` | Update visit | VetVisitUpdateSchema |
| DELETE | `/api/vet-visits/{id}` | Delete visit | - |
| GET | `/api/reptiles/{id}/medications` | List medications | MedicationQuerySchema |
| POST | `/api/reptiles/{id}/medications` | Create medication | MedicationCreateSchema |
| GET | `/api/medications/{id}` | Get medication | - |
| PUT | `/api/medications/{id}` | Update medication | MedicationUpdateSchema |
| DELETE | `/api/medications/{id}` | Delete medication | - |
| GET | `/api/pairings` | List pairings | PairingQuerySchema |
| POST | `/api/pairings` | Create pairing | PairingCreateSchema |
| GET | `/api/pairings/{id}` | Get pairing | - |
| PUT | `/api/pairings/{id}` | Update pairing | PairingUpdateSchema |
| DELETE | `/api/pairings/{id}` | Delete pairing | - |
| GET | `/api/pairings/{id}/clutches` | List clutches | ClutchQuerySchema |
| POST | `/api/pairings/{id}/clutches` | Create clutch | ClutchCreateSchema |
| GET | `/api/clutches/{id}` | Get clutch | - |
| PUT | `/api/clutches/{id}` | Update clutch | ClutchUpdateSchema |
| DELETE | `/api/clutches/{id}` | Delete clutch | - |
| GET | `/api/clutches/{id}/hatchlings` | List hatchlings | HatchlingQuerySchema |
| POST | `/api/clutches/{id}/hatchlings` | Create hatchling | HatchlingCreateSchema |
| GET | `/api/hatchlings/{id}` | Get hatchling | - |
| PUT | `/api/hatchlings/{id}` | Update hatchling | HatchlingUpdateSchema |
| DELETE | `/api/hatchlings/{id}` | Delete hatchling | - |
| GET | `/api/dashboard/stats` | Collection stats | - |
| GET | `/api/dashboard/activity` | Recent activity | Ad-hoc limit |
| GET | `/api/dashboard/feedings` | Feeding overview | - |
| GET | `/api/dashboard/alerts` | Care alerts | - |
| GET | `/api/reports/summary` | Summary metrics | - |
| GET | `/api/reports/environment` | Env report | - |
| GET | `/api/reports/growth` | Growth report | - |
| GET | `/api/reports/feedings` | Feeding report | - |
| GET | `/api/reports/sheds` | Shed report | - |
| GET | `/api/sync/pull` | Pull changes | Ad-hoc since |
| POST | `/api/sync/{table}` | Push single op | SyncOperationSchema |
| POST | `/api/sync/batch` | Push batch ops | BatchSyncSchema |

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **Standardize list response handling** - Either use `successResponse()` consistently or document direct service passthrough pattern
2. **Standardize DELETE response format** - Use consistent `{ id, deletedAt }` or `{ id, deleted }` structure

### Short-Term Actions (Medium Priority)

3. **Align pagination meta field names** - Prefer `limit` over `pageSize`
4. **Add dashboard query validation schema** - Replace ad-hoc parsing
5. **Fix sync conflict response format** - Use error envelope or document exception
6. **Document restore endpoint semantics** - Clarify POST usage for command pattern

### Long-Term Improvements (Low Priority)

7. **Consider adding PATCH support** - For strict REST compliance
8. **Add rate limiting headers** - For client-side rate limit awareness
9. **Add request correlation IDs** - For distributed tracing
10. **Create OpenAPI specification** - For documentation and client generation

---

## Appendix: Validation Schema Coverage

| Resource | Create | Update | Query | Notes |
|----------|--------|--------|-------|-------|
| Reptile | Yes | Yes | Yes | Includes include schema |
| Feeding | Yes | Yes | Yes | Complete |
| Shed | Yes | Yes | Yes | Complete |
| Weight | Yes | Yes | Yes | Complete |
| Environment | Yes | Yes | Yes | Complete |
| Photo | Yes | Yes | Yes | Includes upload URL schema |
| VetVisit | Yes | Yes | Yes | Complete |
| Medication | Yes | Yes | Yes | Complete |
| Pairing | Yes | Yes | Yes | Complete |
| Clutch | Yes | Yes | Yes | Complete |
| Hatchling | Yes | Yes | Yes | Complete |
| Sync | - | - | - | Custom schemas |
| Dashboard | - | - | No | Missing query schemas |
| Reports | - | - | No | Missing query schemas |

---

*Report generated by dev-api agent*
