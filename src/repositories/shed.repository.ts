// Shed Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { Shed, Prisma, ShedQuality } from '@/generated/prisma/client'

export interface FindManyOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  quality?: ShedQuality
  startAfter?: Date
  endBefore?: Date
}

export interface FindByIdOptions {
  include?: {
    reptile?: boolean
    photos?: boolean | { take: number; orderBy: { takenAt: 'desc' } }
  }
  /** Alias for include.reptile for consistency with other repositories */
  includeReptile?: boolean
}

export class ShedRepository {
  async findMany(options: FindManyOptions): Promise<Shed[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { completedDate: 'desc' },
      quality,
      startAfter,
      endBefore,
    } = options

    const where: Prisma.ShedWhereInput = {
      reptileId,
      ...(quality && { quality }),
      ...(startAfter && { completedDate: { gte: startAfter } }),
      ...(endBefore && { completedDate: { lte: endBefore } }),
    }

    return prisma.shed.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, quality, startAfter, endBefore } = options

    const where: Prisma.ShedWhereInput = {
      reptileId,
      ...(quality && { quality }),
      ...(startAfter && { completedDate: { gte: startAfter } }),
      ...(endBefore && { completedDate: { lte: endBefore } }),
    }

    return prisma.shed.count({ where })
  }

  async findById(id: string, options?: FindByIdOptions): Promise<(Shed & { reptile?: { id: string; userId: string; deletedAt: Date | null } }) | null> {
    // Support both include.reptile and includeReptile patterns
    const includeReptile = options?.includeReptile || options?.include?.reptile

    return prisma.shed.findUnique({
      where: { id },
      include: {
        ...options?.include,
        ...(includeReptile && {
          reptile: {
            select: {
              id: true,
              userId: true,
              deletedAt: true,
            },
          },
        }),
      },
    })
  }

  async create(data: Prisma.ShedUncheckedCreateInput): Promise<Shed> {
    return prisma.shed.create({
      data,
    })
  }

  async update(id: string, data: Prisma.ShedUpdateInput): Promise<Shed> {
    return prisma.shed.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<Shed> {
    // Note: Shed model doesn't have deletedAt field in schema
    // Using actual delete - but could add deletedAt to model if needed
    return prisma.shed.delete({
      where: { id },
    })
  }
}

// Singleton instance for use across the application
export const shedRepository = new ShedRepository()
