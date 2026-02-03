// Reptile Types - Extended type definitions for reptile entities
import type { Reptile } from '@/generated/prisma/client'

/**
 * Minimal photo data for profile display.
 * Contains only what's needed to render a thumbnail in the grid.
 */
export type ReptileProfilePhoto = {
  id: string
  storagePath: string | null
  thumbnailPath: string | null
  imageData: string | null
}

/**
 * Reptile with optional profile photo included.
 * Used when listing reptiles for grid display.
 */
export type ReptileWithProfilePhoto = Reptile & {
  photos?: ReptileProfilePhoto[]
}
