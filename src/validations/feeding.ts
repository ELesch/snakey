// Feeding Validation Schemas - Zod 4
import { z } from 'zod'

export const PreySourceEnum = z.enum(['LIVE', 'FROZEN_THAWED', 'PRE_KILLED'])

export const FeedingCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  date: z.coerce.date(),
  preyType: z
    .string()
    .min(1, 'Prey type is required')
    .max(100, 'Prey type must be 100 characters or less')
    .trim(),
  preySize: z
    .string()
    .min(1, 'Prey size is required')
    .max(50, 'Prey size must be 50 characters or less')
    .trim(),
  preySource: PreySourceEnum,
  accepted: z.boolean(),
  refused: z.boolean().default(false),
  regurgitated: z.boolean().default(false),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type FeedingCreate = z.infer<typeof FeedingCreateSchema>

export const FeedingUpdateSchema = z.object({
  date: z.coerce.date().optional(),
  preyType: z
    .string()
    .min(1, 'Prey type is required')
    .max(100, 'Prey type must be 100 characters or less')
    .trim()
    .optional(),
  preySize: z
    .string()
    .min(1, 'Prey size is required')
    .max(50, 'Prey size must be 50 characters or less')
    .trim()
    .optional(),
  preySource: PreySourceEnum.optional(),
  accepted: z.boolean().optional(),
  refused: z.boolean().optional(),
  regurgitated: z.boolean().optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type FeedingUpdate = z.infer<typeof FeedingUpdateSchema>

export const FeedingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['date', 'createdAt', 'preyType']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  preyType: z.string().optional(),
  accepted: z.coerce.boolean().optional(),
})

export type FeedingQuery = z.infer<typeof FeedingQuerySchema>
