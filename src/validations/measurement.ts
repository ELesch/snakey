// Measurement Validation Schemas - Zod 4
import { z } from 'zod'
import { MeasurementType } from '@/generated/prisma/client'

// Create enum from MeasurementType values for Zod validation
const measurementTypeValues = [
  'WEIGHT',
  'LENGTH',
  'SHELL_LENGTH',
  'SHELL_WIDTH',
  'SNOUT_TO_VENT',
  'TAIL_LENGTH',
] as const

export const MeasurementTypeSchema = z.enum(measurementTypeValues)

export const MeasurementCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  type: MeasurementTypeSchema,
  value: z.number().positive('Value must be positive'),
  unit: z.string().min(1, 'Unit is required').max(10, 'Unit must be 10 characters or less'),
  date: z.coerce.date(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type MeasurementCreate = z.infer<typeof MeasurementCreateSchema>

export const MeasurementUpdateSchema = z.object({
  type: MeasurementTypeSchema.optional(),
  value: z.number().positive('Value must be positive').optional(),
  unit: z.string().min(1, 'Unit is required').max(10, 'Unit must be 10 characters or less').optional(),
  date: z.coerce.date().optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type MeasurementUpdate = z.infer<typeof MeasurementUpdateSchema>

export const MeasurementQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['date', 'value', 'type', 'createdAt']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  type: MeasurementTypeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type MeasurementQuery = z.infer<typeof MeasurementQuerySchema>
