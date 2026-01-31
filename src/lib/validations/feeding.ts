import { z } from 'zod'

export const feedingSchema = z.object({
  reptileId: z.string().min(1, 'Reptile ID is required'),
  date: z.coerce.date(),
  preyType: z.string().min(1, 'Prey type is required'),
  preySize: z.string().min(1, 'Prey size is required'),
  preyCount: z.number().int().positive().default(1),
  wasEaten: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
})

export type FeedingInput = z.infer<typeof feedingSchema>

export const preyTypes = [
  'mouse',
  'rat',
  'rabbit',
  'chick',
  'quail',
  'cricket',
  'dubia_roach',
  'mealworm',
  'superworm',
  'hornworm',
  'waxworm',
  'pinkie_mouse',
  'fuzzy_mouse',
  'hopper_mouse',
  'adult_mouse',
  'weaned_rat',
  'small_rat',
  'medium_rat',
  'large_rat',
  'other',
] as const

export const preySizes = [
  'pinkie',
  'fuzzy',
  'hopper',
  'weaned',
  'small',
  'medium',
  'large',
  'extra_large',
  'jumbo',
] as const
