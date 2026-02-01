// Shed Validation Schemas - Zod 4
import { z } from 'zod'

export const ShedQualityEnum = z.enum(['COMPLETE', 'PARTIAL', 'PROBLEMATIC'])

export const ShedCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  startDate: z.coerce
    .date()
    .optional()
    .nullable()
    .refine(
      (date) => !date || date <= new Date(),
      'Start date cannot be in the future'
    ),
  completedDate: z.coerce
    .date()
    .refine(
      (date) => date <= new Date(),
      'Completed date cannot be in the future'
    ),
  quality: ShedQualityEnum,
  isComplete: z.boolean().default(true),
  issues: z
    .string()
    .max(500, 'Issues must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.completedDate) {
      return data.completedDate >= data.startDate
    }
    return true
  },
  {
    message: 'Completed date cannot be before start date',
    path: ['completedDate'],
  }
)

export type ShedCreate = z.infer<typeof ShedCreateSchema>

export const ShedUpdateSchema = z.object({
  startDate: z.coerce
    .date()
    .optional()
    .nullable()
    .refine(
      (date) => !date || date <= new Date(),
      'Start date cannot be in the future'
    ),
  completedDate: z.coerce
    .date()
    .optional()
    .refine(
      (date) => !date || date <= new Date(),
      'Completed date cannot be in the future'
    ),
  quality: ShedQualityEnum.optional(),
  isComplete: z.boolean().optional(),
  issues: z
    .string()
    .max(500, 'Issues must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type ShedUpdate = z.infer<typeof ShedUpdateSchema>

export const ShedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z
    .enum(['completedDate', 'createdAt', 'quality'])
    .default('completedDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  quality: ShedQualityEnum.optional(),
  startAfter: z.coerce.date().optional(),
  endBefore: z.coerce.date().optional(),
})

export type ShedQuery = z.infer<typeof ShedQuerySchema>
