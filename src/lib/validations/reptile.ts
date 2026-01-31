import { z } from 'zod'

export const reptileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  species: z.string().min(1, 'Species is required'),
  morph: z.string().max(200).optional(),
  sex: z.enum(['male', 'female', 'unknown']).optional(),
  birthDate: z.coerce.date().optional(),
  acquisitionDate: z.coerce.date().optional(),
  breeder: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
})

export type ReptileInput = z.infer<typeof reptileSchema>

export const reptileUpdateSchema = reptileSchema.partial()

export type ReptileUpdateInput = z.infer<typeof reptileUpdateSchema>
