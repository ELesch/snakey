// Weight Validation Schemas - Zod 4
import { z } from 'zod'

export const WeightCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  date: z.coerce.date(),
  weight: z.number().positive('Weight must be positive'),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type WeightCreate = z.infer<typeof WeightCreateSchema>

export const WeightUpdateSchema = z.object({
  date: z.coerce.date().optional(),
  weight: z.number().positive('Weight must be positive').optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type WeightUpdate = z.infer<typeof WeightUpdateSchema>

export const WeightQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['date', 'weight', 'createdAt']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type WeightQuery = z.infer<typeof WeightQuerySchema>
