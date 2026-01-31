import { z } from 'zod'

export const environmentLogSchema = z.object({
  reptileId: z.string().min(1, 'Reptile ID is required'),
  timestamp: z.coerce.date(),
  tempHot: z.number().min(50).max(150, 'Temperature seems unrealistic'),
  tempCool: z.number().min(50).max(150, 'Temperature seems unrealistic'),
  humidity: z.number().min(0).max(100),
  notes: z.string().max(1000).optional(),
})

export type EnvironmentLogInput = z.infer<typeof environmentLogSchema>
