# API Design: Reptile CRUD Operations

> **Status**: Draft
> **Author**: API Design Agent
> **Created**: 2026-01-31
> **Last Updated**: 2026-01-31

## Overview

This document defines the RESTful API contract for reptile management in the Snakey application. The API provides full CRUD operations for reptile profiles, supporting the offline-first architecture with optimistic updates and soft deletes.

## Goals

1. Provide complete reptile lifecycle management (create, read, update, soft delete)
2. Support pagination, filtering, and sorting for list operations
3. Enable efficient data loading with optional relation inclusion
4. Maintain consistency with offline-first sync patterns
5. Follow REST best practices and consistent error handling

## Authentication

All endpoints require authentication via Supabase Auth. The user ID is extracted from the JWT token in the `Authorization` header.

```
Authorization: Bearer <supabase_jwt_token>
```

Unauthenticated requests receive a `401 Unauthorized` response.

---

## Endpoints

### GET /api/reptiles

List all reptiles owned by the authenticated user.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max: 100) |
| `sort` | string | `createdAt` | Sort field: `name`, `species`, `createdAt`, `updatedAt`, `acquisitionDate` |
| `order` | string | `desc` | Sort order: `asc`, `desc` |
| `species` | string | - | Filter by species (exact match) |
| `sex` | string | - | Filter by sex: `MALE`, `FEMALE`, `UNKNOWN` |
| `search` | string | - | Search in name and morph fields |
| `includeDeleted` | boolean | false | Include soft-deleted reptiles |

#### Request Example

```http
GET /api/reptiles?page=1&limit=10&species=ball_python&sort=name&order=asc
Authorization: Bearer <token>
```

#### Response (200 OK)

```typescript
{
  data: Reptile[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

#### Response Example

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "userId": "user_abc123",
      "name": "Luna",
      "species": "ball_python",
      "morph": "Banana Pied",
      "sex": "FEMALE",
      "birthDate": "2022-06-15T00:00:00.000Z",
      "acquisitionDate": "2022-09-01T00:00:00.000Z",
      "currentWeight": 1250.5,
      "notes": "Great eater, very docile",
      "isPublic": false,
      "shareId": null,
      "createdAt": "2022-09-01T12:00:00.000Z",
      "updatedAt": "2024-01-15T08:30:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_QUERY_PARAMS` | Invalid query parameter values |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 500 | `INTERNAL_ERROR` | Server error |

---

### GET /api/reptiles/[id]

Retrieve a single reptile by ID with optional related data.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Reptile CUID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include` | string | - | Comma-separated relations to include: `feedings`, `sheds`, `weights`, `photos`, `vetVisits`, `medications`, `stats` |
| `feedingsLimit` | integer | 10 | Limit for included feedings (most recent) |
| `shedsLimit` | integer | 10 | Limit for included sheds (most recent) |
| `weightsLimit` | integer | 30 | Limit for included weights (most recent) |
| `photosLimit` | integer | 20 | Limit for included photos (most recent) |

#### Request Example

```http
GET /api/reptiles/clx1234567890?include=feedings,weights,stats&feedingsLimit=5
Authorization: Bearer <token>
```

#### Response (200 OK)

```typescript
{
  data: Reptile & {
    feedings?: Feeding[]
    sheds?: Shed[]
    weights?: Weight[]
    photos?: Photo[]
    vetVisits?: VetVisit[]
    medications?: Medication[]
    stats?: ReptileStats
  }
}
```

#### ReptileStats Object

When `include=stats` is specified:

```typescript
{
  stats: {
    totalFeedings: number
    acceptedFeedings: number
    refusedFeedings: number
    feedingAcceptanceRate: number      // percentage (0-100)
    lastFeedingDate: string | null
    daysSinceLastFeeding: number | null
    totalSheds: number
    lastShedDate: string | null
    daysSinceLastShed: number | null
    averageShedInterval: number | null // days
    currentWeight: number | null
    weightChange30d: number | null     // percentage
    weightChange90d: number | null     // percentage
    photoCount: number
    vetVisitCount: number
    activeMedications: number
  }
}
```

#### Response Example

```json
{
  "data": {
    "id": "clx1234567890",
    "userId": "user_abc123",
    "name": "Luna",
    "species": "ball_python",
    "morph": "Banana Pied",
    "sex": "FEMALE",
    "birthDate": "2022-06-15T00:00:00.000Z",
    "acquisitionDate": "2022-09-01T00:00:00.000Z",
    "currentWeight": 1250.5,
    "notes": "Great eater, very docile",
    "isPublic": false,
    "shareId": null,
    "createdAt": "2022-09-01T12:00:00.000Z",
    "updatedAt": "2024-01-15T08:30:00.000Z",
    "deletedAt": null,
    "feedings": [
      {
        "id": "clf9876543210",
        "reptileId": "clx1234567890",
        "date": "2024-01-10T18:00:00.000Z",
        "preyType": "rat",
        "preySize": "small",
        "preySource": "FROZEN_THAWED",
        "accepted": true,
        "refused": false,
        "regurgitated": false,
        "notes": null,
        "createdAt": "2024-01-10T18:30:00.000Z",
        "updatedAt": "2024-01-10T18:30:00.000Z"
      }
    ],
    "stats": {
      "totalFeedings": 48,
      "acceptedFeedings": 45,
      "refusedFeedings": 3,
      "feedingAcceptanceRate": 93.75,
      "lastFeedingDate": "2024-01-10T18:00:00.000Z",
      "daysSinceLastFeeding": 5,
      "totalSheds": 12,
      "lastShedDate": "2024-01-02T00:00:00.000Z",
      "daysSinceLastShed": 13,
      "averageShedInterval": 42,
      "currentWeight": 1250.5,
      "weightChange30d": 2.3,
      "weightChange90d": 8.7,
      "photoCount": 15,
      "vetVisitCount": 2,
      "activeMedications": 0
    }
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_QUERY_PARAMS` | Invalid include or limit values |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Reptile belongs to another user |
| 404 | `NOT_FOUND` | Reptile not found |
| 500 | `INTERNAL_ERROR` | Server error |

---

### POST /api/reptiles

Create a new reptile profile.

#### Request Body

```typescript
{
  name: string              // required, 1-100 chars
  species: string           // required
  morph?: string            // optional, max 200 chars
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN'  // default: UNKNOWN
  birthDate?: string        // ISO 8601 date
  acquisitionDate: string   // required, ISO 8601 date
  currentWeight?: number    // decimal, grams
  notes?: string            // optional, max 2000 chars
  isPublic?: boolean        // default: false
}
```

#### Request Example

```http
POST /api/reptiles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Apollo",
  "species": "corn_snake",
  "morph": "Anerythristic",
  "sex": "MALE",
  "birthDate": "2023-07-20",
  "acquisitionDate": "2023-10-15",
  "currentWeight": 85.5,
  "notes": "Purchased from local breeder expo"
}
```

#### Response (201 Created)

```typescript
{
  data: Reptile
}
```

#### Response Example

```json
{
  "data": {
    "id": "clx9876543210",
    "userId": "user_abc123",
    "name": "Apollo",
    "species": "corn_snake",
    "morph": "Anerythristic",
    "sex": "MALE",
    "birthDate": "2023-07-20T00:00:00.000Z",
    "acquisitionDate": "2023-10-15T00:00:00.000Z",
    "currentWeight": 85.5,
    "notes": "Purchased from local breeder expo",
    "isPublic": false,
    "shareId": null,
    "createdAt": "2024-01-15T14:00:00.000Z",
    "updatedAt": "2024-01-15T14:00:00.000Z",
    "deletedAt": null
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 409 | `DUPLICATE_ID` | Client-provided ID already exists (for offline sync) |
| 500 | `INTERNAL_ERROR` | Server error |

#### Validation Rules

| Field | Rules |
|-------|-------|
| `name` | Required, 1-100 characters, trimmed |
| `species` | Required, non-empty |
| `morph` | Optional, max 200 characters |
| `sex` | Must be MALE, FEMALE, or UNKNOWN |
| `birthDate` | Must be valid date, cannot be in future |
| `acquisitionDate` | Required, must be valid date, cannot be before birthDate |
| `currentWeight` | Positive number if provided |
| `notes` | Max 2000 characters |

---

### PUT /api/reptiles/[id]

Update an existing reptile profile. Supports partial updates.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Reptile CUID |

#### Request Body

All fields are optional (partial update):

```typescript
{
  name?: string
  species?: string
  morph?: string | null      // null to clear
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN'
  birthDate?: string | null  // null to clear
  acquisitionDate?: string
  currentWeight?: number | null
  notes?: string | null
  isPublic?: boolean
}
```

#### Request Example

```http
PUT /api/reptiles/clx1234567890
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentWeight": 1285.0,
  "notes": "Great eater, very docile. Updated weight after monthly check."
}
```

#### Response (200 OK)

```typescript
{
  data: Reptile
}
```

#### Response Example

```json
{
  "data": {
    "id": "clx1234567890",
    "userId": "user_abc123",
    "name": "Luna",
    "species": "ball_python",
    "morph": "Banana Pied",
    "sex": "FEMALE",
    "birthDate": "2022-06-15T00:00:00.000Z",
    "acquisitionDate": "2022-09-01T00:00:00.000Z",
    "currentWeight": 1285.0,
    "notes": "Great eater, very docile. Updated weight after monthly check.",
    "isPublic": false,
    "shareId": null,
    "createdAt": "2022-09-01T12:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z",
    "deletedAt": null
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Reptile belongs to another user |
| 404 | `NOT_FOUND` | Reptile not found |
| 409 | `CONFLICT` | Concurrent update conflict (stale data) |
| 500 | `INTERNAL_ERROR` | Server error |

#### Optimistic Locking

For offline sync conflict detection, the client may include an `updatedAt` header:

```http
If-Unmodified-Since: 2024-01-15T08:30:00.000Z
```

If the server's `updatedAt` is newer, a `409 Conflict` is returned with the current server state.

---

### DELETE /api/reptiles/[id]

Soft delete a reptile. Sets `deletedAt` timestamp; data is retained.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Reptile CUID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hard` | boolean | false | Permanently delete (admin only, not implemented) |

#### Request Example

```http
DELETE /api/reptiles/clx1234567890
Authorization: Bearer <token>
```

#### Response (200 OK)

```typescript
{
  data: {
    id: string
    deletedAt: string
  }
}
```

#### Response Example

```json
{
  "data": {
    "id": "clx1234567890",
    "deletedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Reptile belongs to another user |
| 404 | `NOT_FOUND` | Reptile not found or already deleted |
| 500 | `INTERNAL_ERROR` | Server error |

---

### POST /api/reptiles/[id]/restore

Restore a soft-deleted reptile.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Reptile CUID |

#### Request Example

```http
POST /api/reptiles/clx1234567890/restore
Authorization: Bearer <token>
```

#### Response (200 OK)

```typescript
{
  data: Reptile
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `NOT_DELETED` | Reptile is not deleted |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Reptile belongs to another user |
| 404 | `NOT_FOUND` | Reptile not found |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Data Types

### Reptile

```typescript
interface Reptile {
  id: string                    // CUID
  userId: string                // Owner's user ID
  name: string                  // Display name
  species: string               // Species identifier
  morph: string | null          // Morph/variant description
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN'
  birthDate: string | null      // ISO 8601
  acquisitionDate: string       // ISO 8601
  currentWeight: number | null  // Weight in grams
  notes: string | null          // User notes
  isPublic: boolean             // Public profile visibility
  shareId: string | null        // Unique share link ID
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
  deletedAt: string | null      // ISO 8601, null if active
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string          // Machine-readable error code
    message: string       // Human-readable message
    details?: object      // Additional error details
    field?: string        // Field that caused validation error
  }
}
```

---

## Zod Validation Schemas

The following Zod schemas should be used for request validation.

### ReptileCreateSchema

```typescript
// src/lib/validations/reptile.ts
import { z } from 'zod'

export const SexEnum = z.enum(['MALE', 'FEMALE', 'UNKNOWN'])

export const ReptileCreateSchema = z.object({
  id: z.string().cuid2().optional(),  // For offline-created records
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  species: z.string()
    .min(1, 'Species is required')
    .trim(),
  morph: z.string()
    .max(200, 'Morph must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  sex: SexEnum.default('UNKNOWN'),
  birthDate: z.coerce.date()
    .max(new Date(), 'Birth date cannot be in the future')
    .optional()
    .nullable(),
  acquisitionDate: z.coerce.date()
    .max(new Date(), 'Acquisition date cannot be in the future'),
  currentWeight: z.number()
    .positive('Weight must be positive')
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  isPublic: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.birthDate && data.acquisitionDate) {
      return data.acquisitionDate >= data.birthDate
    }
    return true
  },
  {
    message: 'Acquisition date cannot be before birth date',
    path: ['acquisitionDate'],
  }
)

export type ReptileCreate = z.infer<typeof ReptileCreateSchema>
```

### ReptileUpdateSchema

```typescript
export const ReptileUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
  species: z.string()
    .min(1, 'Species is required')
    .trim()
    .optional(),
  morph: z.string()
    .max(200, 'Morph must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  sex: SexEnum.optional(),
  birthDate: z.coerce.date()
    .max(new Date(), 'Birth date cannot be in the future')
    .optional()
    .nullable(),
  acquisitionDate: z.coerce.date()
    .max(new Date(), 'Acquisition date cannot be in the future')
    .optional(),
  currentWeight: z.number()
    .positive('Weight must be positive')
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
})

export type ReptileUpdate = z.infer<typeof ReptileUpdateSchema>
```

### ReptileQuerySchema

```typescript
export const ReptileQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['name', 'species', 'createdAt', 'updatedAt', 'acquisitionDate'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  species: z.string().optional(),
  sex: SexEnum.optional(),
  search: z.string().max(100).optional(),
  includeDeleted: z.coerce.boolean().default(false),
})

export type ReptileQuery = z.infer<typeof ReptileQuerySchema>
```

### ReptileIncludeSchema

```typescript
export const ReptileIncludeSchema = z.object({
  include: z.string()
    .transform(val => val.split(',').map(s => s.trim()))
    .pipe(
      z.array(z.enum([
        'feedings', 'sheds', 'weights', 'photos',
        'vetVisits', 'medications', 'stats'
      ]))
    )
    .optional(),
  feedingsLimit: z.coerce.number().int().positive().max(100).default(10),
  shedsLimit: z.coerce.number().int().positive().max(100).default(10),
  weightsLimit: z.coerce.number().int().positive().max(100).default(30),
  photosLimit: z.coerce.number().int().positive().max(100).default(20),
})

export type ReptileInclude = z.infer<typeof ReptileIncludeSchema>
```

---

## Offline-First Considerations

### Client-Generated IDs

For offline creation, clients may generate CUIDs locally:

```typescript
{
  "id": "clx_client_generated_id",  // Optional client CUID
  "name": "Luna",
  // ... other fields
}
```

If provided, the server uses the client ID. Duplicate ID handling returns `409 Conflict`.

### Sync Queue Integration

Operations are queued locally when offline:

```typescript
interface SyncQueueItem {
  id: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  table: 'reptiles'
  recordId: string
  payload: ReptileCreate | ReptileUpdate | null
  timestamp: string
}
```

### Conflict Resolution

When syncing, use `If-Unmodified-Since` header with the local `updatedAt`:

1. **No conflict**: Server applies change, returns updated record
2. **Conflict detected**: Server returns `409` with current state
3. **Client resolution**: Client may merge or prompt user

Default strategy: **Last-write-wins** (server timestamp)

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /api/reptiles | 100 | 1 minute |
| GET /api/reptiles/[id] | 200 | 1 minute |
| POST /api/reptiles | 30 | 1 minute |
| PUT /api/reptiles/[id] | 60 | 1 minute |
| DELETE /api/reptiles/[id] | 30 | 1 minute |

Exceeded limits return `429 Too Many Requests`.

---

## Implementation Notes

### File Structure

```
src/app/api/reptiles/
  route.ts              # GET (list), POST (create)
  [id]/
    route.ts            # GET, PUT, DELETE
    restore/
      route.ts          # POST (restore)
```

### Service Layer

API routes should delegate to a `ReptileService`:

```typescript
// src/services/reptile.service.ts
export class ReptileService {
  async list(userId: string, query: ReptileQuery): Promise<PaginatedResult<Reptile>>
  async getById(userId: string, id: string, include?: ReptileInclude): Promise<Reptile>
  async create(userId: string, data: ReptileCreate): Promise<Reptile>
  async update(userId: string, id: string, data: ReptileUpdate): Promise<Reptile>
  async softDelete(userId: string, id: string): Promise<{ id: string; deletedAt: string }>
  async restore(userId: string, id: string): Promise<Reptile>
}
```

### Authorization Pattern

All operations verify `userId` ownership:

```typescript
const reptile = await prisma.reptile.findUnique({ where: { id } })

if (!reptile) {
  throw new NotFoundError('Reptile not found')
}

if (reptile.userId !== currentUserId) {
  throw new ForbiddenError('Access denied')
}
```

---

## Trade-offs Considered

### 1. Soft Delete vs Hard Delete

**Decision**: Soft delete by default

**Rationale**:
- Users may want to recover accidentally deleted reptiles
- Historical data (feedings, weights) remains associated
- Hard delete can be added later for GDPR compliance

### 2. Pagination Style

**Decision**: Offset pagination (page/limit)

**Rationale**:
- Simpler implementation
- Works well with small-to-medium datasets
- Cursor pagination can be added if needed for large collections

### 3. Include Parameter vs Separate Endpoints

**Decision**: Single endpoint with include parameter

**Rationale**:
- Reduces HTTP requests for common use cases
- Flexible for different view requirements
- Separate endpoints available for heavy operations if needed

### 4. Stats Computation

**Decision**: Computed on-demand when requested

**Rationale**:
- Avoids stale cached statistics
- Acceptable latency for single-reptile views
- Can add caching layer if performance becomes an issue

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-31 | Initial API design |
