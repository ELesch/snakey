// Photo Validation Schemas - Zod 4
import { z } from 'zod'

export const PhotoCategoryEnum = z.enum([
  'GENERAL',
  'MORPH',
  'SHED',
  'VET',
  'ENCLOSURE',
])

export type PhotoCategory = z.infer<typeof PhotoCategoryEnum>

export const PhotoCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  storagePath: z
    .string()
    .max(500, 'Storage path must be 500 characters or less')
    .optional()
    .nullable(),
  thumbnailPath: z
    .string()
    .max(500, 'Thumbnail path must be 500 characters or less')
    .optional()
    .nullable(),
  imageData: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.startsWith('data:image/'),
      { message: 'Image data must be a valid data URL' }
    ),
  caption: z
    .string()
    .max(500, 'Caption must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
  takenAt: z.coerce.date().optional(),
  category: PhotoCategoryEnum.default('GENERAL'),
  isPrimary: z.boolean().default(false),
  shedId: z.string().cuid2().optional().nullable(),
  vetVisitId: z.string().cuid2().optional().nullable(),
}).refine(
  (data) => data.storagePath || data.imageData,
  { message: 'Either storagePath or imageData is required' }
)

export type PhotoCreate = z.infer<typeof PhotoCreateSchema>

export const PhotoUpdateSchema = z.object({
  caption: z
    .string()
    .max(500, 'Caption must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
  category: PhotoCategoryEnum.optional(),
  isPrimary: z.boolean().optional(),
  shedId: z.string().cuid2().optional().nullable(),
  vetVisitId: z.string().cuid2().optional().nullable(),
})

export type PhotoUpdate = z.infer<typeof PhotoUpdateSchema>

export const PhotoQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['takenAt', 'createdAt']).default('takenAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  category: PhotoCategoryEnum.optional(),
  shedId: z.string().cuid2().optional(),
  vetVisitId: z.string().cuid2().optional(),
})

export type PhotoQuery = z.infer<typeof PhotoQuerySchema>

export const UploadUrlRequestSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be 255 characters or less'),
  contentType: z
    .string()
    .min(1, 'Content type is required')
    .refine(
      (type) =>
        ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(type),
      { message: 'Content type must be a valid image type (jpeg, png, webp, heic)' }
    ),
})

export type UploadUrlRequest = z.infer<typeof UploadUrlRequestSchema>
