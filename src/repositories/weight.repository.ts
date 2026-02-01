// Weight Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { Weight, Prisma } from '@/generated/prisma/client'

export interface FindManyOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  startDate?: Date
  endDate?: Date
}

export interface FindByIdOptions {
  includeReptile?: boolean
}

export class WeightRepository {
  async findMany(options: FindManyOptions): Promise<Weight[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { date: 'desc' },
      startDate,
      endDate,
    } = options

    const where: Prisma.WeightWhereInput = {
      reptileId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    }

    return prisma.weight.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, startDate, endDate } = options

    const where: Prisma.WeightWhereInput = {
      reptileId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    }

    return prisma.weight.count({ where })
  }

  async findById(
    id: string,
    options?: FindByIdOptions
  ): Promise<(Weight & { reptile?: { id: string; userId: string; deletedAt: Date | null } }) | null> {
    return prisma.weight.findUnique({
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

  async create(data: Prisma.WeightUncheckedCreateInput): Promise<Weight> {
    return prisma.weight.create({
      data,
    })
  }

  async update(id: string, data: Prisma.WeightUpdateInput): Promise<Weight> {
    return prisma.weight.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Weight> {
    return prisma.weight.delete({
      where: { id },
    })
  }
}

// Singleton instance for use across the application
export const weightRepository = new WeightRepository()
