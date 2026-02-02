import { createId } from '@paralleldrive/cuid2'

/**
 * Generate a unique ID in cuid format.
 * Use this for all client-generated IDs to match Prisma's @default(cuid()) format.
 */
export function generateId(): string {
  return createId()
}
