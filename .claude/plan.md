# Plan: Unified Measurements Table

## Overview

Replace the separate `Weight` table with a unified `Measurement` table that supports multiple measurement types (weight, length, shell dimensions, etc.) based on species.

## Design

### Measurement Types by Species

| Species Type | Relevant Measurements |
|--------------|----------------------|
| Snakes | WEIGHT, LENGTH |
| Lizards | WEIGHT, LENGTH, SNOUT_TO_VENT |
| Turtles/Tortoises | WEIGHT, SHELL_LENGTH, SHELL_WIDTH |
| Geckos | WEIGHT, LENGTH, SNOUT_TO_VENT |

### Database Schema

```prisma
enum MeasurementType {
  WEIGHT
  LENGTH
  SHELL_LENGTH
  SHELL_WIDTH
  SNOUT_TO_VENT
  TAIL_LENGTH

  @@schema("snakey")
}

model Measurement {
  id        String          @id @default(cuid())
  reptileId String
  date      DateTime
  type      MeasurementType
  value     Decimal
  unit      String          // "g", "cm", "in", "mm"
  notes     String?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  reptile Reptile @relation(fields: [reptileId], references: [id])

  @@index([reptileId, date])
  @@index([reptileId, type, date])
  @@schema("snakey")
}
```

### Reptile Model Updates

Replace `currentWeight` with a more flexible approach:
- Remove `currentWeight` field (computed from Measurement table instead)
- Add `measurements` relation
- Remove `weights` relation

## Implementation Tasks

### Phase 1: Database Schema (dev-prisma-7)

1. Create `MeasurementType` enum
2. Create `Measurement` model
3. Add `measurements` relation to `Reptile`
4. Keep `Weight` table temporarily (for data migration)
5. Keep `currentWeight` on Reptile temporarily
6. Run `prisma db push`
7. Regenerate client

### Phase 2: Data Migration (dev-prisma-7)

1. Create migration script to copy Weight records → Measurement records
2. Run migration
3. Verify data integrity

### Phase 3: API Endpoint (dev-backend)

Create `/api/reptiles/[id]/measurements` endpoint:
- POST: Create measurement record (with type)
- GET: List measurements (filterable by type)

Update existing weights endpoint to use new Measurement table (backward compatibility).

### Phase 4: Form Update (dev-nextjs-15)

Update `reptile-form.tsx`:

1. **Species-aware measurement fields:**
   - Show relevant measurement types based on selected species
   - Default units per measurement type (g for weight, cm for length)

2. **Initial vs Current measurements:**
   - Initial measurements: recorded with acquisition date
   - Current measurements: recorded with today's date (if different)

3. **Form layout:**
   ```
   Species: [Ball Python ▼]

   Initial Measurements (at acquisition)
   ┌─────────────┐ ┌─────────────┐
   │ Weight (g)  │ │ Length (cm) │  ← shown for snakes
   └─────────────┘ └─────────────┘

   Current Measurements (today)        ← only if acq date ≠ today
   ┌─────────────┐ ┌─────────────┐
   │ Weight (g)  │ │ Length (cm) │
   └─────────────┘ └─────────────┘
   ```

### Phase 5: Cleanup (dev-prisma-7)

After verifying everything works:
1. Remove `Weight` model from schema
2. Remove `currentWeight` from Reptile (or keep as computed/cached)
3. Update any remaining Weight references

### Phase 6: Tests (dev-test)

1. Test Measurement API endpoint
2. Test form creates correct measurement records
3. Test species-specific measurement types
4. Test data migration integrity

## Files to Create/Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add MeasurementType enum, Measurement model |
| `src/lib/species/measurements.ts` | NEW - Species → measurement types mapping |
| `src/app/api/reptiles/[id]/measurements/route.ts` | NEW - Measurements API |
| `src/components/reptiles/reptile-form.tsx` | Species-aware measurement fields |
| `src/components/reptiles/reptile-form.test.tsx` | Update tests |
| `scripts/migrate-weights.ts` | NEW - Data migration script |

## Agent Delegation Sequence

```
1. dev-prisma-7   → Schema changes (keep Weight for now)
2. dev-prisma-7   → Data migration script
3. dev-backend    → Measurements API endpoint
4. dev-nextjs-15  → Form updates with species-aware fields
5. dev-test       → Test coverage
6. dev-prisma-7   → Cleanup (remove Weight table)
```

## Species Configuration

Create mapping in `src/lib/species/measurements.ts`:

```typescript
export const MEASUREMENT_TYPES_BY_SPECIES: Record<string, MeasurementType[]> = {
  'ball_python': ['WEIGHT', 'LENGTH'],
  'corn_snake': ['WEIGHT', 'LENGTH'],
  'leopard_gecko': ['WEIGHT', 'LENGTH', 'SNOUT_TO_VENT'],
  'bearded_dragon': ['WEIGHT', 'LENGTH', 'SNOUT_TO_VENT'],
  'red_eared_slider': ['WEIGHT', 'SHELL_LENGTH', 'SHELL_WIDTH'],
  'russian_tortoise': ['WEIGHT', 'SHELL_LENGTH', 'SHELL_WIDTH'],
  // default for unknown species
  'default': ['WEIGHT', 'LENGTH'],
}

export const MEASUREMENT_UNITS: Record<MeasurementType, string> = {
  WEIGHT: 'g',
  LENGTH: 'cm',
  SHELL_LENGTH: 'cm',
  SHELL_WIDTH: 'cm',
  SNOUT_TO_VENT: 'cm',
  TAIL_LENGTH: 'cm',
}

export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  WEIGHT: 'Weight',
  LENGTH: 'Length',
  SHELL_LENGTH: 'Shell Length',
  SHELL_WIDTH: 'Shell Width',
  SNOUT_TO_VENT: 'Snout-to-Vent Length',
  TAIL_LENGTH: 'Tail Length',
}
```

## Acceptance Criteria

- [ ] Measurement table created with type enum
- [ ] Existing Weight data migrated to Measurement
- [ ] API endpoint works for all measurement types
- [ ] Form shows species-appropriate measurement fields
- [ ] Initial measurements saved with acquisition date
- [ ] Current measurements saved with today's date
- [ ] All tests pass
- [ ] Weight table removed (cleanup phase)
