import { z } from 'zod'

export const weightSchema = z.object({
  reptileId: z.string().min(1, 'Reptile ID is required'),
  date: z.coerce.date(),
  weight: z.number().positive('Weight must be positive').max(100000, 'Weight seems too high'),
  notes: z.string().max(1000).optional(),
})

export type WeightInput = z.infer<typeof weightSchema>
