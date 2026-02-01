// Base Service - Shared Ownership Verification Utilities
// Consolidates ownership verification patterns used across multiple services

import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError } from '@/lib/errors'
import { ReptileRepository, reptileRepository as defaultReptileRepository } from '@/repositories/reptile.repository'
import type { Reptile } from '@/generated/prisma/client'

const log = createLogger('OwnershipVerification')

// Use the shared singleton instance for production, but allow injection for testing
let _reptileRepository: ReptileRepository | null = null

/**
 * Get or create the reptile repository instance
 * This allows tests to mock the repository
 */
function getReptileRepository(): ReptileRepository {
  if (!_reptileRepository) {
    _reptileRepository = defaultReptileRepository
  }
  return _reptileRepository
}

/**
 * Options for ownership verification
 */
export interface OwnershipOptions {
  /** Custom label for the entity in error messages (e.g., 'Male', 'Female') */
  entityLabel?: string
  /** Allow soft-deleted records to pass verification */
  allowDeleted?: boolean
}

/**
 * Interface for repositories that can be used with verifyRecordOwnership
 */
export interface RecordRepository<T> {
  findById(id: string, options?: { includeReptile?: boolean }): Promise<T | null>
}

/**
 * Type for records that have a reptile relation
 */
export interface RecordWithReptile {
  reptileId: string
  deletedAt?: Date | null
  reptile?: {
    userId: string
    deletedAt?: Date | null
  } | null
}

/**
 * Verify that a reptile belongs to a user and is not deleted
 *
 * @param reptileId - The ID of the reptile to verify
 * @param userId - The ID of the user who should own the reptile
 * @param options - Optional configuration
 * @returns The reptile record if verification passes
 * @throws NotFoundError if the reptile doesn't exist or is deleted
 * @throws ForbiddenError if the user doesn't own the reptile
 *
 * @example
 * ```typescript
 * // Basic usage
 * const reptile = await verifyReptileOwnership(reptileId, userId)
 *
 * // With custom label for error messages
 * const reptile = await verifyReptileOwnership(reptileId, userId, { entityLabel: 'Male' })
 *
 * // Allow soft-deleted reptiles
 * const reptile = await verifyReptileOwnership(reptileId, userId, { allowDeleted: true })
 * ```
 */
export async function verifyReptileOwnership(
  reptileId: string,
  userId: string,
  options: OwnershipOptions = {}
): Promise<Reptile> {
  const { entityLabel, allowDeleted = false } = options
  const labelPrefix = entityLabel ? `${entityLabel} reptile` : 'Reptile'

  const reptileRepository = getReptileRepository()
  const reptile = await reptileRepository.findById(reptileId)

  if (!reptile) {
    log.warn({ reptileId, entityLabel }, `${labelPrefix} not found`)
    throw new NotFoundError(`${labelPrefix} not found`)
  }

  if (reptile.userId !== userId) {
    log.warn({ userId, reptileId, entityLabel }, `Access denied to ${labelPrefix.toLowerCase()}`)
    throw new ForbiddenError('Access denied')
  }

  if (!allowDeleted && reptile.deletedAt) {
    log.warn({ reptileId, entityLabel }, `${labelPrefix} is deleted`)
    throw new NotFoundError(`${labelPrefix} not found`)
  }

  return reptile
}

/**
 * Verify that a record belongs to a user's reptile
 *
 * This function is for records that have a reptile relation (feedings, sheds, photos, etc.)
 * It verifies both the record exists and that the user owns the associated reptile.
 *
 * @param repository - The repository instance with a findById method
 * @param recordId - The ID of the record to verify
 * @param userId - The ID of the user who should own the record (via reptile)
 * @param options - Configuration including entity label for error messages
 * @returns The record if verification passes
 * @throws NotFoundError if the record doesn't exist or is deleted
 * @throws ForbiddenError if the user doesn't own the associated reptile
 *
 * @example
 * ```typescript
 * const feeding = await verifyRecordOwnership(
 *   feedingRepository,
 *   feedingId,
 *   userId,
 *   { entityLabel: 'Feeding' }
 * )
 * ```
 */
export async function verifyRecordOwnership<T extends RecordWithReptile>(
  repository: RecordRepository<T>,
  recordId: string,
  userId: string,
  options: OwnershipOptions & { entityLabel: string }
): Promise<T> {
  const { entityLabel, allowDeleted = false } = options

  const record = await repository.findById(recordId, { includeReptile: true })

  if (!record) {
    log.warn({ recordId }, `${entityLabel} not found`)
    throw new NotFoundError(`${entityLabel} not found`)
  }

  // Check if record is soft-deleted
  if (!allowDeleted && record.deletedAt) {
    log.warn({ recordId }, `${entityLabel} is deleted`)
    throw new NotFoundError(`${entityLabel} not found`)
  }

  // Verify ownership through the reptile relation
  if (!record.reptile || record.reptile.userId !== userId) {
    log.warn({ userId, recordId }, `Access denied to ${entityLabel.toLowerCase()}`)
    throw new ForbiddenError('Access denied')
  }

  return record
}

// Re-export error classes for convenience
export { NotFoundError, ForbiddenError }
