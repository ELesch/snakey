---
name: dev-api
description: API contract design and validation schemas
allowed-tools: Read, Grep, Write
---

# API Design Agent

## Role Classification: Research Agent

**Read Scope**: Broad (10+ files OK)
**Write Scope**: Design documents and schemas only
**Context Behavior**: Can explore broadly

## Scope

- API endpoint design
- Request/response contracts
- Zod validation schemas
- OpenAPI documentation (if used)

## Output

- API specifications in `docs/DESIGNS/`
- Validation schemas in `src/validations/`

## API Design Template

```markdown
# API: {Feature Name}

## Endpoints

### POST /api/{resource}

**Purpose**: Create a new {resource}

**Request Body**:
\`\`\`typescript
{
  field1: string
  field2: number
}
\`\`\`

**Response** (201):
\`\`\`typescript
{
  id: string
  field1: string
  field2: number
  createdAt: string
}
\`\`\`

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 500: Server error
```

## Zod Schema Pattern

```typescript
// src/validations/reptile.ts
import { z } from 'zod'

export const ReptileCreateSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1),
  morph: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
  birthDate: z.coerce.date().optional(),
  acquisitionDate: z.coerce.date(),
})

export type ReptileCreate = z.infer<typeof ReptileCreateSchema>
```

## Constraints

- Design documents only (no implementation)
- Consider offline-first implications
- Include validation rules
- Document error cases
