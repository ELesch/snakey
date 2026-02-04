// Measurement Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { Measurement, MeasurementType, Prisma } from '@/generated/prisma/client'

export interface FindManyOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  type?: MeasurementType
  startDate?: Date
  endDate?: Date
}

export interface FindByIdOptions {
  includeReptile?: boolean
}

export class MeasurementRepository {
  async findMany(options: FindManyOptions): Promise<Measurement[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { date: 'desc' },
      type,
      startDate,
      endDate,
    } = options

    const where: Prisma.MeasurementWhereInput = {
      reptileId,
      ...(type && { type }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    }

    return prisma.measurement.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, type, startDate, endDate } = options

    const where: Prisma.MeasurementWhereInput = {
      reptileId,
      ...(type && { type }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    }

    return prisma.measurement.count({ where })
  }

  async findById(
    id: string,
    options?: FindByIdOptions
  ): Promise<(Measurement & { reptile?: { id: string; userId: string; deletedAt: Date | null } }) | null> {
    return prisma.measurement.findUnique({
      where: { id },
      include: options?.includeReptile
        ? {
            reptile: {
              select: {
                id: true,
                userId: true,
                deletedAt: true,
              },
            },
          }
        : undefined,
    })
  }

  async create(data: Prisma.MeasurementUncheckedCreateInput): Promise<Measurement> {
    return prisma.measurement.create({
      data,
    })
  }

  async update(id: string, data: Prisma.MeasurementUpdateInput): Promise<Measurement> {
    return prisma.measurement.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Measurement> {
    return prisma.measurement.delete({
      where: { id },
    })
  }
}

// Singleton instance for use across the application
export const measurementRepository = new MeasurementRepository()
