// Breeding Validation Schemas - Zod 4
import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const SexEnum = z.enum(['MALE', 'FEMALE', 'UNKNOWN'])
export const HatchStatusEnum = z.enum(['DEVELOPING', 'HATCHED', 'FAILED', 'SOLD', 'KEPT'])

// ============================================================================
// PAIRING SCHEMAS
// ============================================================================

export const PairingCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  maleId: z.string().cuid2('Invalid male reptile ID'),
  femaleId: z.string().cuid2('Invalid female reptile ID'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  successful: z.boolean().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type PairingCreate = z.infer<typeof PairingCreateSchema>

export const PairingUpdateSchema = z.object({
  maleId: z.string().cuid2('Invalid male reptile ID').optional(),
  femaleId: z.string().cuid2('Invalid female reptile ID').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  successful: z.boolean().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type PairingUpdate = z.infer<typeof PairingUpdateSchema>

export const PairingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['startDate', 'createdAt', 'endDate']).default('startDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  successful: z.coerce.boolean().optional(),
})

export type PairingQuery = z.infer<typeof PairingQuerySchema>

// ============================================================================
// CLUTCH SCHEMAS
// ============================================================================

export const ClutchCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  layDate: z.coerce.date(),
  eggCount: z.coerce.number().int().min(1, 'Egg count must be at least 1'),
  fertileCount: z.coerce.number().int().min(0).optional().nullable(),
  incubationTemp: z.coerce.number().positive().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type ClutchCreate = z.infer<typeof ClutchCreateSchema>

export const ClutchUpdateSchema = z.object({
  layDate: z.coerce.date().optional(),
  eggCount: z.coerce.number().int().min(1, 'Egg count must be at least 1').optional(),
  fertileCount: z.coerce.number().int().min(0).optional().nullable(),
  incubationTemp: z.coerce.number().positive().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type ClutchUpdate = z.infer<typeof ClutchUpdateSchema>

export const ClutchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['layDate', 'createdAt', 'dueDate']).default('layDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type ClutchQuery = z.infer<typeof ClutchQuerySchema>

// ============================================================================
// HATCHLING SCHEMAS
// ============================================================================

export const HatchlingCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  hatchDate: z.coerce.date().optional().nullable(),
  status: HatchStatusEnum.default('DEVELOPING'),
  morph: z
    .string()
    .max(100, 'Morph must be 100 characters or less')
    .trim()
    .optional()
    .nullable(),
  sex: SexEnum.default('UNKNOWN'),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  reptileId: z.string().cuid2().optional().nullable(), // Link to created reptile profile
})

export type HatchlingCreate = z.infer<typeof HatchlingCreateSchema>

export const HatchlingUpdateSchema = z.object({
  hatchDate: z.coerce.date().optional().nullable(),
  status: HatchStatusEnum.optional(),
  morph: z
    .string()
    .max(100, 'Morph must be 100 characters or less')
    .trim()
    .optional()
    .nullable(),
  sex: SexEnum.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  reptileId: z.string().cuid2().optional().nullable(),
})

export type HatchlingUpdate = z.infer<typeof HatchlingUpdateSchema>

export const HatchlingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['hatchDate', 'createdAt', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: HatchStatusEnum.optional(),
})

export type HatchlingQuery = z.infer<typeof HatchlingQuerySchema>
