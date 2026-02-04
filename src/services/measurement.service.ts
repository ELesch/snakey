// Measurement Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { MeasurementRepository } from '@/repositories/measurement.repository'
import {
  MeasurementCreateSchema,
  MeasurementUpdateSchema,
  type MeasurementQuery,
} from '@/validations/measurement'
import { verifyReptileOwnership, verifyRecordOwnership } from './base.service'
import type { Measurement } from '@/generated/prisma/client'

const log = createLogger('MeasurementService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class MeasurementService {
  private measurementRepository: MeasurementRepository

  constructor() {
    this.measurementRepository = new MeasurementRepository()
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<MeasurementQuery> = {}
  ): Promise<PaginatedResult<Measurement>> {
    const {
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc',
      type,
      startDate,
      endDate,
    } = query

    // Verify ownership first
    await verifyReptileOwnership(reptileId, userId)

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, reptileId, page, limit, type }, 'Listing measurements')

    const [measurements, total] = await Promise.all([
      this.measurementRepository.findMany({
        reptileId,
        skip,
        take: limit,
        orderBy,
        type,
        startDate,
        endDate,
      }),
      this.measurementRepository.count({
        reptileId,
        type,
        startDate,
        endDate,
      }),
    ])

    return {
      data: measurements,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, id: string): Promise<Measurement> {
    log.info({ userId, measurementId: id }, 'Getting measurement by id')

    const measurement = await verifyRecordOwnership(
      this.measurementRepository,
      id,
      userId,
      { entityLabel: 'Measurement' }
    )
    return measurement
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Measurement> {
    // Verify ownership first
    await verifyReptileOwnership(reptileId, userId)

    // Validate input data
    const validated = validateSchema(MeasurementCreateSchema, data)

    log.info({ userId, reptileId, type: validated.type, value: validated.value }, 'Creating measurement')

    const measurement = await this.measurementRepository.create({
      ...(validated.id && { id: validated.id }),
      reptileId,
      date: validated.date,
      type: validated.type,
      value: validated.value,
      unit: validated.unit,
      notes: validated.notes ?? null,
    })

    log.info({ measurementId: measurement.id }, 'Measurement created')
    return measurement
  }

  async update(userId: string, id: string, data: unknown): Promise<Measurement> {
    // Verify ownership
    await verifyRecordOwnership(
      this.measurementRepository,
      id,
      userId,
      { entityLabel: 'Measurement' }
    )

    // Validate update data
    const validated = validateSchema(MeasurementUpdateSchema, data)

    log.info({ userId, measurementId: id }, 'Updating measurement')

    const updateData: Record<string, unknown> = {}
    if (validated.type !== undefined) updateData.type = validated.type
    if (validated.value !== undefined) updateData.value = validated.value
    if (validated.unit !== undefined) updateData.unit = validated.unit
    if (validated.date !== undefined) updateData.date = validated.date
    if (validated.notes !== undefined) updateData.notes = validated.notes

    const updatedMeasurement = await this.measurementRepository.update(id, updateData)

    log.info({ measurementId: id }, 'Measurement updated')
    return updatedMeasurement
  }

  async delete(userId: string, id: string): Promise<Measurement> {
    // Verify ownership
    await verifyRecordOwnership(
      this.measurementRepository,
      id,
      userId,
      { entityLabel: 'Measurement' }
    )

    log.info({ userId, measurementId: id }, 'Deleting measurement')

    const deletedMeasurement = await this.measurementRepository.delete(id)

    log.info({ measurementId: id }, 'Measurement deleted')
    return deletedMeasurement
  }
}

// Singleton instance
export const measurementService = new MeasurementService()
