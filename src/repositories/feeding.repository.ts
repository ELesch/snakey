// Feeding Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { Feeding, Prisma, PreySource } from '@/generated/prisma/client'

export interface FindManyOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  startDate?: Date
  endDate?: Date
  preyType?: string
  accepted?: boolean
}

export interface FindByIdOptions {
  includeReptile?: boolean
}

export class FeedingRepository {
  async findMany(options: FindManyOptions): Promise<Feeding[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { date: 'desc' },
      startDate,
      endDate,
      preyType,
      accepted,
    } = options

    const where: Prisma.FeedingWhereInput = {
      reptileId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(startDate && !endDate && {
        date: { gte: startDate },
      }),
      ...(!startDate && endDate && {
        date: { lte: endDate },
      }),
      ...(preyType && { preyType }),
      ...(accepted !== undefined && { accepted }),
    }

    return prisma.feeding.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, startDate, endDate, preyType, accepted } = options

    const where: Prisma.FeedingWhereInput = {
      reptileId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(startDate && !endDate && {
        date: { gte: startDate },
      }),
      ...(!startDate && endDate && {
        date: { lte: endDate },
      }),
      ...(preyType && { preyType }),
      ...(accepted !== undefined && { accepted }),
    }

    return prisma.feeding.count({ where })
  }

  async findById(
    id: string,
    options?: FindByIdOptions
  ): Promise<(Feeding & { reptile?: { id: string; userId: string; deletedAt: Date | null } }) | null> {
    return prisma.feeding.findUnique({
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

  async create(data: {
    reptileId: string
    date: Date
    preyType: string
    preySize: string
    preySource: PreySource
    accepted: boolean
    refused?: boolean
    regurgitated?: boolean
    notes?: string | null
    id?: string
  }): Promise<Feeding> {
    return prisma.feeding.create({
      data: {
        ...(data.id && { id: data.id }),
        reptileId: data.reptileId,
        date: data.date,
        preyType: data.preyType,
        preySize: data.preySize,
        preySource: data.preySource,
        accepted: data.accepted,
        refused: data.refused ?? false,
        regurgitated: data.regurgitated ?? false,
        notes: data.notes ?? null,
      },
    })
  }

  async update(id: string, data: Prisma.FeedingUpdateInput): Promise<Feeding> {
    return prisma.feeding.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Feeding> {
    return prisma.feeding.delete({
      where: { id },
    })
  }
}

// Singleton instance for use across the application
export const feedingRepository = new FeedingRepository()
