// Environment Validation Schemas - Zod 4
import { z } from 'zod'

// Location options for environment readings
export const LocationEnum = z.enum([
  'hot_side',
  'cool_side',
  'ambient',
  'basking',
  'hide',
  'water',
  'other',
])

export type Location = z.infer<typeof LocationEnum>

export const EnvironmentCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  date: z.coerce.date(),
  temperature: z
    .number()
    .min(0, 'Temperature must be at least 0')
    .max(150, 'Temperature must be at most 150')
    .optional()
    .nullable(),
  humidity: z
    .number()
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must be at most 100%')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(50, 'Location must be 50 characters or less')
    .trim()
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type EnvironmentCreate = z.infer<typeof EnvironmentCreateSchema>

export const EnvironmentUpdateSchema = z.object({
  date: z.coerce.date().optional(),
  temperature: z
    .number()
    .min(0, 'Temperature must be at least 0')
    .max(150, 'Temperature must be at most 150')
    .optional()
    .nullable(),
  humidity: z
    .number()
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must be at most 100%')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(50, 'Location must be 50 characters or less')
    .trim()
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type EnvironmentUpdate = z.infer<typeof EnvironmentUpdateSchema>

export const EnvironmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['date', 'temperature', 'humidity', 'createdAt']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  alertsOnly: z.coerce.boolean().default(false),
})

export type EnvironmentQuery = z.infer<typeof EnvironmentQuerySchema>
