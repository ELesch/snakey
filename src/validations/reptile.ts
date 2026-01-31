// Reptile Validation Schemas - Zod 4
import { z } from 'zod'

export const SexEnum = z.enum(['MALE', 'FEMALE', 'UNKNOWN'])

export const ReptileCreateSchema = z
  .object({
    id: z.string().cuid2().optional(), // For offline-created records
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .trim(),
    species: z.string().min(1, 'Species is required').trim(),
    morph: z
      .string()
      .max(200, 'Morph must be 200 characters or less')
      .trim()
      .optional()
      .nullable(),
    sex: SexEnum.default('UNKNOWN'),
    birthDate: z.coerce
      .date()
      .max(new Date(), 'Birth date cannot be in the future')
      .optional()
      .nullable(),
    acquisitionDate: z.coerce
      .date()
      .max(new Date(), 'Acquisition date cannot be in the future'),
    currentWeight: z
      .number()
      .positive('Weight must be positive')
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(2000, 'Notes must be 2000 characters or less')
      .trim()
      .optional()
      .nullable(),
    isPublic: z.boolean().default(false),
  })
  .refine(
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

export const ReptileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
  species: z.string().min(1, 'Species is required').trim().optional(),
  morph: z
    .string()
    .max(200, 'Morph must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  sex: SexEnum.optional(),
  birthDate: z.coerce
    .date()
    .max(new Date(), 'Birth date cannot be in the future')
    .optional()
    .nullable(),
  acquisitionDate: z.coerce
    .date()
    .max(new Date(), 'Acquisition date cannot be in the future')
    .optional(),
  currentWeight: z
    .number()
    .positive('Weight must be positive')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
})

export type ReptileUpdate = z.infer<typeof ReptileUpdateSchema>

export const ReptileQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z
    .enum(['name', 'species', 'createdAt', 'updatedAt', 'acquisitionDate'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  species: z.string().optional(),
  sex: SexEnum.optional(),
  search: z.string().max(100).optional(),
  includeDeleted: z.coerce.boolean().default(false),
})

export type ReptileQuery = z.infer<typeof ReptileQuerySchema>

export const ReptileIncludeSchema = z.object({
  include: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .pipe(
      z.array(
        z.enum([
          'feedings',
          'sheds',
          'weights',
          'photos',
          'vetVisits',
          'medications',
          'stats',
        ])
      )
    )
    .optional(),
  feedingsLimit: z.coerce.number().int().positive().max(100).default(10),
  shedsLimit: z.coerce.number().int().positive().max(100).default(10),
  weightsLimit: z.coerce.number().int().positive().max(100).default(30),
  photosLimit: z.coerce.number().int().positive().max(100).default(20),
})

export type ReptileInclude = z.infer<typeof ReptileIncludeSchema>
