import { z } from 'zod'

export const shedQuality = ['complete', 'partial', 'stuck'] as const

export const shedSchema = z.object({
  reptileId: z.string().min(1, 'Reptile ID is required'),
  date: z.coerce.date(),
  quality: z.enum(shedQuality),
  notes: z.string().max(1000).optional(),
})

export type ShedInput = z.infer<typeof shedSchema>
