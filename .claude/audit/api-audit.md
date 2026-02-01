# API Audit Report

**Date:** 2026-02-01
**Auditor:** API Auditor (dev-api)
**Scope:** All 36 API endpoints in `src/app/api/`

## Executive Summary

The Snakey API demonstrates strong consistency in error handling patterns, authentication, and response structures. The API follows REST conventions well with proper resource nesting and HTTP method usage. The main areas for improvement are response format inconsistency in list endpoints (missing `{ data: ... }` wrapper) and inconsistent DELETE response payloads across endpoints.

## API Inventory

| # | Method | Path | Purpose | File Location |
|---|--------|------|---------|---------------|
| 1 | GET | /api/reptiles | List user's reptiles | reptiles/route.ts |
| 2 | POST | /api/reptiles | Create reptile | reptiles/route.ts |
| 3 | GET | /api/reptiles/[id] | Get single reptile | reptiles/[id]/route.ts |
| 4 | PUT | /api/reptiles/[id] | Update reptile | reptiles/[id]/route.ts |
| 5 | DELETE | /api/reptiles/[id] | Soft-delete reptile | reptiles/[id]/route.ts |
| 6 | POST | /api/reptiles/[id]/restore | Restore soft-deleted reptile | reptiles/[id]/restore/route.ts |
| 7 | GET | /api/reptiles/[id]/feedings | List feedings for reptile | reptiles/[id]/feedings/route.ts |
| 8 | POST | /api/reptiles/[id]/feedings | Create feeding | reptiles/[id]/feedings/route.ts |
| 9 | GET | /api/reptiles/[id]/sheds | List sheds for reptile | reptiles/[id]/sheds/route.ts |
| 10 | POST | /api/reptiles/[id]/sheds | Create shed | reptiles/[id]/sheds/route.ts |
| 11 | GET | /api/reptiles/[id]/weights | List weights for reptile | reptiles/[id]/weights/route.ts |
| 12 | POST | /api/reptiles/[id]/weights | Create weight | reptiles/[id]/weights/route.ts |
| 13 | GET | /api/reptiles/[id]/environment | List environment logs | reptiles/[id]/environment/route.ts |
| 14 | POST | /api/reptiles/[id]/environment | Create environment log | reptiles/[id]/environment/route.ts |
| 15 | GET | /api/reptiles/[id]/photos | List photos for reptile | reptiles/[id]/photos/route.ts |
| 16 | POST | /api/reptiles/[id]/photos | Create photo | reptiles/[id]/photos/route.ts |
| 17 | GET | /api/reptiles/[id]/vet-visits | List vet visits | reptiles/[id]/vet-visits/route.ts |
| 18 | POST | /api/reptiles/[id]/vet-visits | Create vet visit | reptiles/[id]/vet-visits/route.ts |
| 19 | GET | /api/reptiles/[id]/medications | List medications | reptiles/[id]/medications/route.ts |
| 20 | POST | /api/reptiles/[id]/medications | Create medication | reptiles/[id]/medications/route.ts |
| 21 | GET | /api/feedings/[id] | Get single feeding | feedings/[id]/route.ts |
| 22 | PUT | /api/feedings/[id] | Update feeding | feedings/[id]/route.ts |
| 23 | DELETE | /api/feedings/[id] | Delete feeding | feedings/[id]/route.ts |
| 24 | GET | /api/sheds/[id] | Get single shed | sheds/[id]/route.ts |
| 25 | PUT | /api/sheds/[id] | Update shed | sheds/[id]/route.ts |
| 26 | DELETE | /api/sheds/[id] | Delete shed | sheds/[id]/route.ts |
| 27 | GET | /api/weights/[id] | Get single weight | weights/[id]/route.ts |
| 28 | PUT | /api/weights/[id] | Update weight | weights/[id]/route.ts |
| 29 | DELETE | /api/weights/[id] | Delete weight | weights/[id]/route.ts |
| 30 | GET | /api/environment/[id] | Get single environment log | environment/[id]/route.ts |
| 31 | PUT | /api/environment/[id] | Update environment log | environment/[id]/route.ts |
| 32 | DELETE | /api/environment/[id] | Delete environment log | environment/[id]/route.ts |
| 33 | GET | /api/photos/[id] | Get single photo | photos/[id]/route.ts |
| 34 | PUT | /api/photos/[id] | Update photo | photos/[id]/route.ts |
| 35 | DELETE | /api/photos/[id] | Delete photo | photos/[id]/route.ts |
| 36 | POST | /api/photos/upload-url | Get signed upload URL | photos/upload-url/route.ts |
| 37 | GET | /api/vet-visits/[id] | Get single vet visit | vet-visits/[id]/route.ts |
| 38 | PUT | /api/vet-visits/[id] | Update vet visit | vet-visits/[id]/route.ts |
| 39 | DELETE | /api/vet-visits/[id] | Delete vet visit | vet-visits/[id]/route.ts |
| 40 | GET | /api/medications/[id] | Get single medication | medications/[id]/route.ts |
| 41 | PUT | /api/medications/[id] | Update medication | medications/[id]/route.ts |
| 42 | DELETE | /api/medications/[id] | Delete medication | medications/[id]/route.ts |
| 43 | GET | /api/pairings | List user's pairings | pairings/route.ts |
| 44 | POST | /api/pairings | Create pairing | pairings/route.ts |
| 45 | GET | /api/pairings/[id] | Get single pairing | pairings/[id]/route.ts |
| 46 | PUT | /api/pairings/[id] | Update pairing | pairings/[id]/route.ts |
| 47 | DELETE | /api/pairings/[id] | Delete pairing | pairings/[id]/route.ts |
| 48 | GET | /api/pairings/[id]/clutches | List clutches for pairing | pairings/[id]/clutches/route.ts |
| 49 | POST | /api/pairings/[id]/clutches | Create clutch | pairings/[id]/clutches/route.ts |
| 50 | GET | /api/clutches/[id] | Get single clutch | clutches/[id]/route.ts |
| 51 | PUT | /api/clutches/[id] | Update clutch | clutches/[id]/route.ts |
| 52 | DELETE | /api/clutches/[id] | Delete clutch | clutches/[id]/route.ts |
| 53 | GET | /api/clutches/[id]/hatchlings | List hatchlings for clutch | clutches/[id]/hatchlings/route.ts |
| 54 | POST | /api/clutches/[id]/hatchlings | Create hatchling | clutches/[id]/hatchlings/route.ts |
| 55 | GET | /api/hatchlings/[id] | Get single hatchling | hatchlings/[id]/route.ts |
| 56 | PUT | /api/hatchlings/[id] | Update hatchling | hatchlings/[id]/route.ts |
| 57 | DELETE | /api/hatchlings/[id] | Delete hatchling | hatchlings/[id]/route.ts |
| 58 | POST | /api/sync/[table] | Sync single operation | sync/[table]/route.ts |
| 59 | POST | /api/sync/batch | Sync batch operations | sync/batch/route.ts |
| 60 | GET | /api/sync/pull | Pull changes since timestamp | sync/pull/route.ts |
| 61 | GET | /api/dashboard/stats | Get collection stats | dashboard/stats/route.ts |
| 62 | GET | /api/dashboard/activity | Get recent activity | dashboard/activity/route.ts |
| 63 | GET | /api/dashboard/feedings | Get upcoming feedings | dashboard/feedings/route.ts |
| 64 | GET | /api/dashboard/alerts | Get environment alerts | dashboard/alerts/route.ts |
| 65 | GET | /api/reports/growth | Get growth data | reports/growth/route.ts |
| 66 | GET | /api/reports/feedings | Get feeding statistics | reports/feedings/route.ts |
| 67 | GET | /api/reports/sheds | Get shed statistics | reports/sheds/route.ts |
| 68 | GET | /api/reports/environment | Get environment statistics | reports/environment/route.ts |
| 69 | GET | /api/reports/summary | Get summary metrics | reports/summary/route.ts |

**Note:** The original count of 36 "route files" maps to 69 endpoints due to multiple HTTP methods per file.

---

## Critical Issues

### CRIT-1: Inconsistent Response Format for List Endpoints

**Severity:** Critical - breaks client expectations
**Affected Files:**
- `src/app/api/reptiles/route.ts:54`
- `src/app/api/reptiles/[id]/feedings/route.ts:59`
- `src/app/api/reptiles/[id]/sheds/route.ts:59`
- `src/app/api/reptiles/[id]/weights/route.ts:59`
- `src/app/api/reptiles/[id]/environment/route.ts:58`
- `src/app/api/reptiles/[id]/photos/route.ts:59`
- `src/app/api/reptiles/[id]/vet-visits/route.ts:59`
- `src/app/api/reptiles/[id]/medications/route.ts:59`
- `src/app/api/pairings/route.ts:54`
- `src/app/api/pairings/[id]/clutches/route.ts:59`
- `src/app/api/clutches/[id]/hatchlings/route.ts:59`

**Description:** List endpoints return `result` directly without wrapping in `{ data: ... }`:

```typescript
// Current (inconsistent):
return NextResponse.json(result)

// POST/GET single returns (consistent):
return NextResponse.json({ data: reptile })
```

**Impact:** Clients must handle two different response shapes for list vs. single-item responses. This breaks the standard API contract pattern.

**Expected Pattern:**
```typescript
// All successful responses should use:
return NextResponse.json({ data: result })
```

---

## High Priority Issues

### HIGH-1: Inconsistent DELETE Response Payloads

**Severity:** High - inconsistent developer experience
**Affected Files:**
- `src/app/api/weights/[id]/route.ts:127` - Returns `{ data: { id: result.id, deleted: true } }`
- `src/app/api/feedings/[id]/route.ts:127` - Returns `{ data: result }`
- `src/app/api/sheds/[id]/route.ts:127` - Returns `{ data: result }`
- `src/app/api/environment/[id]/route.ts:127` - Returns `{ data: result }`
- All other DELETE endpoints - Returns `{ data: result }`

**Description:** The weights DELETE endpoint has a different response structure than all other DELETE endpoints. It explicitly constructs `{ id, deleted: true }` while others return whatever the service method returns.

**Recommended Fix:** Standardize all DELETE responses to either:
- Option A: `{ data: { id, deleted: true } }` (explicit confirmation)
- Option B: `{ data: { id } }` (minimal, consistent with soft-delete behavior)
- Option C: HTTP 204 No Content (standard REST, no body)

---

### HIGH-2: Missing Validation Schema in Environment List Endpoint Error Response

**Severity:** High - inconsistent error details
**Affected File:** `src/app/api/reptiles/[id]/environment/route.ts:45-53`

**Description:** The environment list endpoint does not include `details` in the validation error response, unlike all other list endpoints:

```typescript
// environment/route.ts (missing details):
return NextResponse.json({
  error: {
    code: 'INVALID_QUERY_PARAMS',
    message: issues[0]?.message || 'Invalid query parameters',
    // Missing: details: issues,
  },
}, { status: 400 })

// All other list endpoints include:
details: issues,
```

---

### HIGH-3: REST Convention Violation - POST for Restore Action

**Severity:** High - REST convention concern
**Affected File:** `src/app/api/reptiles/[id]/restore/route.ts`

**Description:** Using `POST /reptiles/[id]/restore` is a verb-based action endpoint, which deviates from resource-oriented REST design.

**Alternatives considered:**
1. `PATCH /reptiles/[id]` with body `{ deletedAt: null }` - More RESTful
2. `PUT /reptiles/[id]/status` with body `{ status: 'active' }` - Action as sub-resource
3. Keep as-is - Pragmatic for clarity, many APIs do this

**Recommendation:** Keep current approach but document it as an intentional RPC-style action endpoint. The clarity of `/restore` outweighs strict REST adherence for this use case.

---

## Medium Priority Issues

### MED-1: Inconsistent Error Code for Validation in Restore Endpoint

**Severity:** Medium - unexpected error code
**Affected File:** `src/app/api/reptiles/[id]/restore/route.ts:54-57`

**Description:** The restore endpoint uses `NOT_DELETED` error code for a validation error, which is not used anywhere else and may confuse clients expecting `VALIDATION_ERROR`:

```typescript
if (error instanceof ValidationError) {
  // Reptile is not deleted
  return NextResponse.json(
    { error: { code: 'NOT_DELETED', message: error.message } },
    { status: 400 }
  )
}
```

**Recommendation:** Either:
- Use standard `VALIDATION_ERROR` code with descriptive message
- Document `NOT_DELETED` as a supported error code in API documentation

---

### MED-2: Reports Endpoints Inconsistent Response Structure

**Severity:** Medium - inconsistent response shape
**Affected Files:**
- `src/app/api/reports/growth/route.ts:39` - Returns `{ data: data.data }` (double-unwrapped)
- `src/app/api/reports/feedings/route.ts:39-42` - Returns `{ data: ..., summary: ... }` (no wrapper)
- `src/app/api/reports/sheds/route.ts:39-42` - Returns `{ data: ..., summary: ... }`
- `src/app/api/reports/environment/route.ts:39-42` - Returns `{ data: ..., summary: ... }`

**Description:** The growth report double-unwraps the data, while other reports return both `data` and `summary` at the top level instead of nesting inside a single `data` wrapper.

**Expected Pattern:**
```typescript
// Consistent structure:
return NextResponse.json({
  data: {
    items: result.data,
    summary: result.summary,
  }
})
```

---

### MED-3: Query Parameter Validation Not Applied to Dashboard Endpoints

**Severity:** Medium - potential for invalid input
**Affected Files:**
- `src/app/api/dashboard/activity/route.ts:25`
- `src/app/api/dashboard/feedings/route.ts:25`

**Description:** These endpoints use `parseInt` directly without Zod validation:

```typescript
const limit = parseInt(searchParams.get('limit') ?? '10', 10)
```

**Issues:**
- No validation of NaN result
- No type coercion validation
- Inconsistent with other endpoints using Zod schemas

**Recommendation:** Add simple Zod schemas for query parameters:
```typescript
const QuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
})
```

---

### MED-4: Sync Endpoint Table Validation Hardcoded

**Severity:** Medium - maintenance burden
**Affected Files:**
- `src/app/api/sync/[table]/route.ts:38-51`
- `src/app/api/sync/batch/route.ts:66-86`

**Description:** Valid table names are hardcoded in multiple places:

```typescript
const validTables = [
  'reptiles',
  'feedings',
  'sheds',
  'weights',
  'environmentLogs',
  'photos',
]
```

**Recommendation:** Extract to a shared constant or Zod enum:
```typescript
// src/validations/sync.ts
export const SYNCABLE_TABLES = ['reptiles', 'feedings', ...] as const
export const SyncableTableSchema = z.enum(SYNCABLE_TABLES)
```

---

### MED-5: Missing Environment Logs in Sync Table List

**Severity:** Medium - potential sync gap
**Affected Files:**
- `src/app/api/sync/[table]/route.ts:43`
- `src/app/api/sync/batch/route.ts:71`

**Description:** The sync endpoints list `environmentLogs` but the REST API uses `/environment/[id]`. Verify naming consistency between sync and REST endpoints.

---

## Patterns Observed

### Good Patterns

1. **Consistent Authentication Check**
   All 69 endpoints properly check authentication using `getUserId()` and return 401 with identical error structure:
   ```typescript
   { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }
   ```

2. **Consistent Error Structure**
   All error responses follow the pattern:
   ```typescript
   { error: { code: string, message: string, details?: any } }
   ```

3. **Proper HTTP Status Codes**
   - 200: Successful GET/PUT/DELETE
   - 201: Successful POST (create)
   - 400: Validation errors, invalid parameters
   - 401: Unauthorized
   - 403: Forbidden (ownership check failed)
   - 404: Not found
   - 409: Conflict (sync)
   - 500: Internal server error

4. **Service Layer Abstraction**
   All routes delegate business logic to service classes, maintaining thin controllers.

5. **Structured Logging**
   All endpoints use `createLogger()` with domain-specific context.

6. **Null Query Parameter Filtering**
   All list endpoints filter out null/empty query parameters to allow Zod defaults to apply - this is documented as a learned gotcha.

7. **Resource-Oriented URL Design**
   - Proper pluralization: `/reptiles`, `/feedings`, `/sheds`
   - Proper nesting: `/reptiles/[id]/feedings`, `/pairings/[id]/clutches`
   - ID-based access: `/feedings/[id]`, `/photos/[id]`

8. **Proper Use of PATCH vs PUT**
   The API consistently uses PUT for updates, which is appropriate since updates are typically full object replacements with optional fields.

9. **Comprehensive Zod Validation Schemas**
   - Separate Create/Update schemas for each resource
   - Query schemas with proper defaults
   - Consistent patterns across all validation files

10. **Next.js 15 Async Params Pattern**
    All dynamic route handlers properly await `params` as required by Next.js 15:
    ```typescript
    const { id } = await params
    ```

### Anti-Patterns

1. **Inconsistent Response Wrapping**
   List endpoints return raw result; single-item endpoints wrap in `{ data: ... }`.

2. **Inconsistent DELETE Response Structure**
   Weights DELETE differs from all other DELETE endpoints.

3. **Inline Validation for Some Dashboard Endpoints**
   Dashboard activity/feedings use `parseInt` instead of Zod schemas.

4. **Hardcoded Configuration**
   Sync valid tables list duplicated in two files.

5. **RPC-style Action Endpoint**
   `/restore` is verb-based rather than resource-based (acceptable trade-off).

---

## Recommendations

### Priority 1 (Critical - Fix First)

1. **Standardize List Response Format**
   Update all 11 list endpoints to return `{ data: result }` instead of `result` directly.

   Files to update:
   - `reptiles/route.ts`
   - `reptiles/[id]/feedings/route.ts`
   - `reptiles/[id]/sheds/route.ts`
   - `reptiles/[id]/weights/route.ts`
   - `reptiles/[id]/environment/route.ts`
   - `reptiles/[id]/photos/route.ts`
   - `reptiles/[id]/vet-visits/route.ts`
   - `reptiles/[id]/medications/route.ts`
   - `pairings/route.ts`
   - `pairings/[id]/clutches/route.ts`
   - `clutches/[id]/hatchlings/route.ts`

### Priority 2 (High - Fix Soon)

2. **Standardize DELETE Responses**
   Pick one pattern and apply to all DELETE endpoints. Recommended: `{ data: { id, deletedAt? } }` for soft deletes, `{ data: { id } }` for hard deletes.

3. **Add Missing `details` to Environment List Error**
   Update `reptiles/[id]/environment/route.ts` to include validation details.

### Priority 3 (Medium - Fix When Convenient)

4. **Add Zod Validation to Dashboard Endpoints**
   Create simple query schemas for dashboard/activity and dashboard/feedings.

5. **Extract Sync Table Configuration**
   Move `SYNCABLE_TABLES` to a shared validation file.

6. **Standardize Reports Response Structure**
   Wrap all report responses consistently.

### Priority 4 (Low - Consider for Future)

7. **Document Error Codes**
   Create an error code reference document listing all possible codes:
   - `UNAUTHORIZED`
   - `FORBIDDEN`
   - `NOT_FOUND`
   - `VALIDATION_ERROR`
   - `INVALID_QUERY_PARAMS`
   - `INVALID_TABLE`
   - `INVALID_OPERATION`
   - `INVALID_REQUEST`
   - `INVALID_TIMESTAMP`
   - `NOT_DELETED`
   - `STORAGE_ERROR`
   - `SYNC_ERROR`
   - `INTERNAL_ERROR`

8. **Consider API Versioning**
   If breaking changes are planned (like fixing response formats), consider `/api/v2/` for new clients.

---

## Validation Schema Quality

The Zod validation schemas in `src/validations/` are well-structured:

| Schema File | Quality | Notes |
|-------------|---------|-------|
| reptile.ts | Excellent | Comprehensive, includes cross-field validation |
| feeding.ts | Good | Complete with query schema |
| shed.ts | Excellent | Includes date range validation |
| weight.ts | Good | Simple and effective |
| environment.ts | Good | Includes location enum |
| vet.ts | Excellent | Covers visits and medications |
| photo.ts | Good | Includes upload URL validation |
| breeding.ts | Excellent | Covers pairings, clutches, hatchlings |

**Validation Strengths:**
- Consistent use of `.trim()` on string fields
- Proper `.coerce` usage for dates and numbers
- Sensible max lengths on text fields
- Default values for optional fields
- Cross-field validation where appropriate (e.g., date ranges)

---

## Summary Metrics

| Metric | Count |
|--------|-------|
| Total Route Files | 36 |
| Total Endpoints | 69 |
| Critical Issues | 1 |
| High Priority Issues | 3 |
| Medium Priority Issues | 5 |
| Good Patterns Identified | 10 |
| Anti-Patterns Identified | 5 |

**Overall API Health: Good**

The API is well-designed with consistent patterns for authentication, error handling, and service delegation. The primary issue is response format inconsistency between list and single-item endpoints, which should be addressed before additional client development.
