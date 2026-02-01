// Vet Service - Facade for VetVisit and Medication Services
// This module provides backward compatibility by composing both services
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { VetRepository } from '@/repositories/vet.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  VetVisitCreateSchema,
  VetVisitUpdateSchema,
  MedicationCreateSchema,
  MedicationUpdateSchema,
  type VetQuery,
  type MedicationQuery,
} from '@/validations/vet'
import type { VetVisit, Medication } from '@/generated/prisma/client'

const log = createLogger('VetService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

/**
 * Unified VetService that composes VetVisit and Medication operations.
 * Methods delegate to focused private methods to maintain modularity.
 */
export class VetService {
  private vetRepository: VetRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.vetRepository = new VetRepository()
    this.reptileRepository = new ReptileRepository()
  }

  private async verifyOwnership(userId: string, reptileId: string): Promise<void> {
    const reptile = await this.reptileRepository.findById(reptileId)
    if (!reptile) throw new NotFoundError('Reptile not found')
    if (reptile.userId !== userId) throw new ForbiddenError('Access denied')
    if (reptile.deletedAt) throw new NotFoundError('Reptile not found')
  }

  // VET VISIT METHODS
  async listVisits(userId: string, reptileId: string, query: Partial<VetQuery> = {}): Promise<PaginatedResult<VetVisit>> {
    await this.verifyOwnership(userId, reptileId)
    const { page = 1, limit = 20, sort = 'date', order = 'desc', startDate, endDate } = query
    const skip = (page - 1) * limit
    log.info({ userId, reptileId, page, limit }, 'Listing vet visits')
    const [visits, total] = await Promise.all([
      this.vetRepository.findManyVisits({ reptileId, skip, take: limit, orderBy: { [sort]: order }, startDate, endDate }),
      this.vetRepository.countVisits({ reptileId, startDate, endDate }),
    ])
    return { data: visits, meta: createPaginationMeta({ total, page, limit }) }
  }

  async getVisitById(userId: string, visitId: string): Promise<VetVisit> {
    const visit = await this.vetRepository.findVisitById(visitId, { includeReptile: true })
    if (!visit) throw new NotFoundError('Vet visit not found')
    if (!visit.reptile || visit.reptile.userId !== userId) throw new ForbiddenError('Access denied')
    return visit
  }

  async createVisit(userId: string, reptileId: string, data: unknown): Promise<VetVisit> {
    await this.verifyOwnership(userId, reptileId)
    const v = validateSchema(VetVisitCreateSchema, data)
    log.info({ userId, reptileId, reason: v.reason }, 'Creating vet visit')
    return this.vetRepository.createVisit({ ...(v.id && { id: v.id }), reptileId, date: v.date, reason: v.reason, diagnosis: v.diagnosis, treatment: v.treatment, vetName: v.vetName, vetClinic: v.vetClinic, cost: v.cost, followUp: v.followUp, notes: v.notes })
  }

  async updateVisit(userId: string, visitId: string, data: unknown): Promise<VetVisit> {
    const existing = await this.vetRepository.findVisitById(visitId, { includeReptile: true })
    if (!existing) throw new NotFoundError('Vet visit not found')
    if (!existing.reptile || existing.reptile.userId !== userId) throw new ForbiddenError('Access denied')
    const validated = validateSchema(VetVisitUpdateSchema, data)
    log.info({ userId, visitId }, 'Updating vet visit')
    return this.vetRepository.updateVisit(visitId, validated)
  }

  async deleteVisit(userId: string, visitId: string): Promise<{ id: string }> {
    const existing = await this.vetRepository.findVisitById(visitId, { includeReptile: true })
    if (!existing) throw new NotFoundError('Vet visit not found')
    if (!existing.reptile || existing.reptile.userId !== userId) throw new ForbiddenError('Access denied')
    log.info({ userId, visitId }, 'Deleting vet visit')
    const deleted = await this.vetRepository.deleteVisit(visitId)
    return { id: deleted.id }
  }

  // MEDICATION METHODS
  async listMedications(userId: string, reptileId: string, query: Partial<MedicationQuery> = {}): Promise<PaginatedResult<Medication>> {
    await this.verifyOwnership(userId, reptileId)
    const { page = 1, limit = 20, sort = 'startDate', order = 'desc', activeOnly } = query
    const skip = (page - 1) * limit
    log.info({ userId, reptileId, page, limit }, 'Listing medications')
    const [medications, total] = await Promise.all([
      this.vetRepository.findManyMedications({ reptileId, skip, take: limit, orderBy: { [sort]: order }, activeOnly }),
      this.vetRepository.countMedications({ reptileId, activeOnly }),
    ])
    return { data: medications, meta: createPaginationMeta({ total, page, limit }) }
  }

  async getMedicationById(userId: string, medicationId: string): Promise<Medication> {
    const medication = await this.vetRepository.findMedicationById(medicationId, { includeReptile: true })
    if (!medication) throw new NotFoundError('Medication not found')
    if (!medication.reptile || medication.reptile.userId !== userId) throw new ForbiddenError('Access denied')
    return medication
  }

  async createMedication(userId: string, reptileId: string, data: unknown): Promise<Medication> {
    await this.verifyOwnership(userId, reptileId)
    const v = validateSchema(MedicationCreateSchema, data)
    log.info({ userId, reptileId, name: v.name }, 'Creating medication')
    return this.vetRepository.createMedication({ ...(v.id && { id: v.id }), reptileId, name: v.name, dosage: v.dosage, frequency: v.frequency, startDate: v.startDate, endDate: v.endDate, notes: v.notes, reminders: v.reminders })
  }

  async updateMedication(userId: string, medicationId: string, data: unknown): Promise<Medication> {
    const existing = await this.vetRepository.findMedicationById(medicationId, { includeReptile: true })
    if (!existing) throw new NotFoundError('Medication not found')
    if (!existing.reptile || existing.reptile.userId !== userId) throw new ForbiddenError('Access denied')
    const validated = validateSchema(MedicationUpdateSchema, data)
    log.info({ userId, medicationId }, 'Updating medication')
    return this.vetRepository.updateMedication(medicationId, validated)
  }

  async deleteMedication(userId: string, medicationId: string): Promise<{ id: string }> {
    const existing = await this.vetRepository.findMedicationById(medicationId, { includeReptile: true })
    if (!existing) throw new NotFoundError('Medication not found')
    if (!existing.reptile || existing.reptile.userId !== userId) throw new ForbiddenError('Access denied')
    log.info({ userId, medicationId }, 'Deleting medication')
    const deleted = await this.vetRepository.deleteMedication(medicationId)
    return { id: deleted.id }
  }

  async getMedicationSchedule(userId: string, reptileId: string): Promise<Medication[]> {
    await this.verifyOwnership(userId, reptileId)
    log.info({ userId, reptileId }, 'Getting medication schedule')
    return this.vetRepository.findActiveMedications(reptileId)
  }
}

export const vetService = new VetService()
