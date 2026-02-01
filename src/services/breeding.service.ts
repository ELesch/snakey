// Breeding Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import {
  PairingRepository,
  ClutchRepository,
  HatchlingRepository,
} from '@/repositories/breeding.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  PairingCreateSchema,
  PairingUpdateSchema,
  ClutchCreateSchema,
  ClutchUpdateSchema,
  HatchlingCreateSchema,
  HatchlingUpdateSchema,
  type PairingQuery,
  type ClutchQuery,
  type HatchlingQuery,
} from '@/validations/breeding'
import type { Pairing, Clutch, Hatchling, Sex, HatchStatus } from '@/generated/prisma/client'

const log = createLogger('BreedingService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

// ============================================================================
// PAIRING SERVICE
// ============================================================================

export class PairingService {
  private pairingRepository: PairingRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.pairingRepository = new PairingRepository()
    this.reptileRepository = new ReptileRepository()
  }

  /**
   * Verify user owns the reptile and it's not deleted
   */
  private async verifyReptileOwnership(
    userId: string,
    reptileId: string,
    label: string
  ): Promise<void> {
    const reptile = await this.reptileRepository.findById(reptileId)

    if (!reptile) {
      log.warn({ reptileId }, `${label} reptile not found`)
      throw new NotFoundError(`${label} reptile not found`)
    }

    if (reptile.userId !== userId) {
      log.warn({ userId, reptileId }, `Access denied to ${label.toLowerCase()} reptile`)
      throw new ForbiddenError('Access denied')
    }

    if (reptile.deletedAt) {
      log.warn({ reptileId }, `${label} reptile is deleted`)
      throw new NotFoundError(`${label} reptile not found`)
    }
  }

  async list(
    userId: string,
    query: Partial<PairingQuery> = {}
  ): Promise<PaginatedResult<Pairing>> {
    const {
      page = 1,
      limit = 20,
      sort = 'startDate',
      order = 'desc',
      startDate,
      endDate,
      successful,
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, page, limit }, 'Listing pairings')

    const [pairings, total] = await Promise.all([
      this.pairingRepository.findMany({
        userId,
        skip,
        take: limit,
        orderBy,
        startDate,
        endDate,
        successful,
      }),
      this.pairingRepository.count({
        userId,
        startDate,
        endDate,
        successful,
      }),
    ])

    return {
      data: pairings,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, pairingId: string): Promise<Pairing> {
    log.info({ userId, pairingId }, 'Getting pairing by id')

    const pairing = await this.pairingRepository.findById(pairingId, {
      includeMale: true,
      includeFemale: true,
      includeClutches: true,
    })

    if (!pairing) {
      log.warn({ pairingId }, 'Pairing not found')
      throw new NotFoundError('Pairing not found')
    }

    if (pairing.userId !== userId) {
      log.warn({ userId, pairingId }, 'Access denied to pairing')
      throw new ForbiddenError('Access denied')
    }

    return pairing
  }

  async create(userId: string, data: unknown): Promise<Pairing> {
    // Validate input data
    const validated = validateSchema(PairingCreateSchema, data)

    // Verify ownership of both reptiles
    await this.verifyReptileOwnership(userId, validated.maleId, 'Male')
    await this.verifyReptileOwnership(userId, validated.femaleId, 'Female')

    log.info(
      { userId, maleId: validated.maleId, femaleId: validated.femaleId },
      'Creating pairing'
    )

    const pairing = await this.pairingRepository.create({
      ...(validated.id && { id: validated.id }),
      userId,
      maleId: validated.maleId,
      femaleId: validated.femaleId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      successful: validated.successful,
      notes: validated.notes,
    })

    log.info({ pairingId: pairing.id }, 'Pairing created')
    return pairing
  }

  async update(userId: string, pairingId: string, data: unknown): Promise<Pairing> {
    // First get the pairing to check ownership
    const existing = await this.pairingRepository.findById(pairingId)

    if (!existing) {
      log.warn({ pairingId }, 'Pairing not found for update')
      throw new NotFoundError('Pairing not found')
    }

    if (existing.userId !== userId) {
      log.warn({ userId, pairingId }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    // Validate update data
    const validated = validateSchema(PairingUpdateSchema, data)

    // If changing male or female, verify ownership
    if (validated.maleId) {
      await this.verifyReptileOwnership(userId, validated.maleId, 'Male')
    }
    if (validated.femaleId) {
      await this.verifyReptileOwnership(userId, validated.femaleId, 'Female')
    }

    log.info({ userId, pairingId }, 'Updating pairing')

    const updatedPairing = await this.pairingRepository.update(pairingId, validated)

    log.info({ pairingId }, 'Pairing updated')
    return updatedPairing
  }

  async delete(userId: string, pairingId: string): Promise<{ id: string }> {
    // First get the pairing to check ownership
    const existing = await this.pairingRepository.findById(pairingId)

    if (!existing) {
      log.warn({ pairingId }, 'Pairing not found for delete')
      throw new NotFoundError('Pairing not found')
    }

    if (existing.userId !== userId) {
      log.warn({ userId, pairingId }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

    log.info({ userId, pairingId }, 'Deleting pairing')

    const deletedPairing = await this.pairingRepository.delete(pairingId)

    log.info({ pairingId }, 'Pairing deleted')
    return { id: deletedPairing.id }
  }
}

// ============================================================================
// CLUTCH SERVICE
// ============================================================================

export class ClutchService {
  private clutchRepository: ClutchRepository
  private pairingRepository: PairingRepository

  constructor() {
    this.clutchRepository = new ClutchRepository()
    this.pairingRepository = new PairingRepository()
  }

  /**
   * Verify user owns the pairing
   */
  private async verifyPairingOwnership(
    userId: string,
    pairingId: string
  ): Promise<void> {
    const pairing = await this.pairingRepository.findById(pairingId)

    if (!pairing) {
      log.warn({ pairingId }, 'Pairing not found')
      throw new NotFoundError('Pairing not found')
    }

    if (pairing.userId !== userId) {
      log.warn({ userId, pairingId }, 'Access denied to pairing')
      throw new ForbiddenError('Access denied')
    }
  }

  async list(
    userId: string,
    pairingId: string,
    query: Partial<ClutchQuery> = {}
  ): Promise<PaginatedResult<Clutch>> {
    // Verify ownership first
    await this.verifyPairingOwnership(userId, pairingId)

    const {
      page = 1,
      limit = 20,
      sort = 'layDate',
      order = 'desc',
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, pairingId, page, limit }, 'Listing clutches')

    const [clutches, total] = await Promise.all([
      this.clutchRepository.findMany({
        pairingId,
        skip,
        take: limit,
        orderBy,
      }),
      this.clutchRepository.count({ pairingId }),
    ])

    return {
      data: clutches,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, clutchId: string): Promise<Clutch> {
    log.info({ userId, clutchId }, 'Getting clutch by id')

    const clutch = await this.clutchRepository.findById(clutchId, {
      includePairing: true,
      includeHatchlings: true,
    })

    if (!clutch) {
      log.warn({ clutchId }, 'Clutch not found')
      throw new NotFoundError('Clutch not found')
    }

    if (!clutch.pairing || clutch.pairing.userId !== userId) {
      log.warn({ userId, clutchId }, 'Access denied to clutch')
      throw new ForbiddenError('Access denied')
    }

    return clutch
  }

  async create(userId: string, pairingId: string, data: unknown): Promise<Clutch> {
    // Verify ownership first
    await this.verifyPairingOwnership(userId, pairingId)

    // Validate input data
    const validated = validateSchema(ClutchCreateSchema, data)

    log.info(
      { userId, pairingId, eggCount: validated.eggCount },
      'Creating clutch'
    )

    const clutch = await this.clutchRepository.create({
      ...(validated.id && { id: validated.id }),
      pairingId,
      layDate: validated.layDate,
      eggCount: validated.eggCount,
      fertileCount: validated.fertileCount,
      incubationTemp: validated.incubationTemp,
      dueDate: validated.dueDate,
      notes: validated.notes,
    })

    log.info({ clutchId: clutch.id }, 'Clutch created')
    return clutch
  }

  async update(userId: string, clutchId: string, data: unknown): Promise<Clutch> {
    // First get the clutch with its pairing to check ownership
    const existing = await this.clutchRepository.findById(clutchId, {
      includePairing: true,
    })

    if (!existing) {
      log.warn({ clutchId }, 'Clutch not found for update')
      throw new NotFoundError('Clutch not found')
    }

    if (!existing.pairing || existing.pairing.userId !== userId) {
      log.warn({ userId, clutchId }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    // Validate update data
    const validated = validateSchema(ClutchUpdateSchema, data)

    log.info({ userId, clutchId }, 'Updating clutch')

    const updatedClutch = await this.clutchRepository.update(clutchId, validated)

    log.info({ clutchId }, 'Clutch updated')
    return updatedClutch
  }

  async delete(userId: string, clutchId: string): Promise<{ id: string }> {
    // First get the clutch with its pairing to check ownership
    const existing = await this.clutchRepository.findById(clutchId, {
      includePairing: true,
    })

    if (!existing) {
      log.warn({ clutchId }, 'Clutch not found for delete')
      throw new NotFoundError('Clutch not found')
    }

    if (!existing.pairing || existing.pairing.userId !== userId) {
      log.warn({ userId, clutchId }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

    log.info({ userId, clutchId }, 'Deleting clutch')

    const deletedClutch = await this.clutchRepository.delete(clutchId)

    log.info({ clutchId }, 'Clutch deleted')
    return { id: deletedClutch.id }
  }
}

// ============================================================================
// HATCHLING SERVICE
// ============================================================================

export class HatchlingService {
  private hatchlingRepository: HatchlingRepository
  private clutchRepository: ClutchRepository

  constructor() {
    this.hatchlingRepository = new HatchlingRepository()
    this.clutchRepository = new ClutchRepository()
  }

  /**
   * Verify user owns the clutch (through pairing)
   */
  private async verifyClutchOwnership(
    userId: string,
    clutchId: string
  ): Promise<void> {
    const clutch = await this.clutchRepository.findById(clutchId, {
      includePairing: true,
    })

    if (!clutch) {
      log.warn({ clutchId }, 'Clutch not found')
      throw new NotFoundError('Clutch not found')
    }

    if (!clutch.pairing || clutch.pairing.userId !== userId) {
      log.warn({ userId, clutchId }, 'Access denied to clutch')
      throw new ForbiddenError('Access denied')
    }
  }

  async list(
    userId: string,
    clutchId: string,
    query: Partial<HatchlingQuery> = {}
  ): Promise<PaginatedResult<Hatchling>> {
    // Verify ownership first
    await this.verifyClutchOwnership(userId, clutchId)

    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      status,
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, clutchId, page, limit }, 'Listing hatchlings')

    const [hatchlings, total] = await Promise.all([
      this.hatchlingRepository.findMany({
        clutchId,
        skip,
        take: limit,
        orderBy,
        status: status as HatchStatus | undefined,
      }),
      this.hatchlingRepository.count({
        clutchId,
        status: status as HatchStatus | undefined,
      }),
    ])

    return {
      data: hatchlings,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, hatchlingId: string): Promise<Hatchling> {
    log.info({ userId, hatchlingId }, 'Getting hatchling by id')

    const hatchling = await this.hatchlingRepository.findById(hatchlingId, {
      includeClutch: true,
    })

    if (!hatchling) {
      log.warn({ hatchlingId }, 'Hatchling not found')
      throw new NotFoundError('Hatchling not found')
    }

    if (!hatchling.clutch?.pairing || hatchling.clutch.pairing.userId !== userId) {
      log.warn({ userId, hatchlingId }, 'Access denied to hatchling')
      throw new ForbiddenError('Access denied')
    }

    return hatchling
  }

  async create(userId: string, clutchId: string, data: unknown): Promise<Hatchling> {
    // Verify ownership first
    await this.verifyClutchOwnership(userId, clutchId)

    // Validate input data
    const validated = validateSchema(HatchlingCreateSchema, data)

    log.info(
      { userId, clutchId, status: validated.status },
      'Creating hatchling'
    )

    const hatchling = await this.hatchlingRepository.create({
      ...(validated.id && { id: validated.id }),
      clutchId,
      hatchDate: validated.hatchDate,
      status: validated.status as HatchStatus,
      morph: validated.morph,
      sex: validated.sex as Sex,
      notes: validated.notes,
      reptileId: validated.reptileId,
    })

    log.info({ hatchlingId: hatchling.id }, 'Hatchling created')
    return hatchling
  }

  async update(userId: string, hatchlingId: string, data: unknown): Promise<Hatchling> {
    // First get the hatchling with its clutch to check ownership
    const existing = await this.hatchlingRepository.findById(hatchlingId, {
      includeClutch: true,
    })

    if (!existing) {
      log.warn({ hatchlingId }, 'Hatchling not found for update')
      throw new NotFoundError('Hatchling not found')
    }

    if (!existing.clutch?.pairing || existing.clutch.pairing.userId !== userId) {
      log.warn({ userId, hatchlingId }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    // Validate update data
    const validated = validateSchema(HatchlingUpdateSchema, data)

    log.info({ userId, hatchlingId }, 'Updating hatchling')

    const updatedHatchling = await this.hatchlingRepository.update(hatchlingId, validated)

    log.info({ hatchlingId }, 'Hatchling updated')
    return updatedHatchling
  }

  async delete(userId: string, hatchlingId: string): Promise<{ id: string }> {
    // First get the hatchling with its clutch to check ownership
    const existing = await this.hatchlingRepository.findById(hatchlingId, {
      includeClutch: true,
    })

    if (!existing) {
      log.warn({ hatchlingId }, 'Hatchling not found for delete')
      throw new NotFoundError('Hatchling not found')
    }

    if (!existing.clutch?.pairing || existing.clutch.pairing.userId !== userId) {
      log.warn({ userId, hatchlingId }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

    log.info({ userId, hatchlingId }, 'Deleting hatchling')

    const deletedHatchling = await this.hatchlingRepository.delete(hatchlingId)

    log.info({ hatchlingId }, 'Hatchling deleted')
    return { id: deletedHatchling.id }
  }
}

// Singleton instances
export const pairingService = new PairingService()
export const clutchService = new ClutchService()
export const hatchlingService = new HatchlingService()
