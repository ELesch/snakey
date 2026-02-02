// Reptile Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { Reptile, Prisma, Sex } from '@/generated/prisma/client'

export interface FindManyOptions {
  userId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  species?: string
  sex?: Sex
  search?: string
  includeDeleted?: boolean
  includeProfilePhoto?: boolean
}

export interface FindByIdOptions {
  include?: {
    feedings?: boolean | { take: number; orderBy: { date: 'desc' } }
    sheds?: boolean | { take: number; orderBy: { completedDate: 'desc' } }
    weights?: boolean | { take: number; orderBy: { date: 'desc' } }
    photos?: boolean | { take: number; orderBy: { takenAt: 'desc' } }
    vetVisits?: boolean | { take: number; orderBy: { date: 'desc' } }
    medications?: boolean
  }
}

export class ReptileRepository {
  async findMany(options: FindManyOptions): Promise<Reptile[]> {
    const {
      userId,
      skip = 0,
      take = 20,
      orderBy = { createdAt: 'desc' },
      species,
      sex,
      search,
      includeDeleted = false,
      includeProfilePhoto = false,
    } = options

    const where: Prisma.ReptileWhereInput = {
      userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(species && { species }),
      ...(sex && { sex }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { morph: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    return prisma.reptile.findMany({
      where,
      skip,
      take,
      orderBy,
      include: includeProfilePhoto
        ? {
            photos: {
              where: { isPrimary: true, deletedAt: null },
              take: 1,
              select: { id: true, storagePath: true, thumbnailPath: true },
            },
          }
        : undefined,
    })
  }

  async count(options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { userId, species, sex, search, includeDeleted = false } = options

    const where: Prisma.ReptileWhereInput = {
      userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(species && { species }),
      ...(sex && { sex }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { morph: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    return prisma.reptile.count({ where })
  }

  async findById(id: string, options?: FindByIdOptions): Promise<Reptile | null> {
    return prisma.reptile.findUnique({
      where: { id },
      include: options?.include,
    })
  }

  async create(data: Prisma.ReptileUncheckedCreateInput): Promise<Reptile> {
    return prisma.reptile.create({
      data,
    })
  }

  async update(id: string, data: Prisma.ReptileUpdateInput): Promise<Reptile> {
    return prisma.reptile.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<Reptile> {
    return prisma.reptile.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async restore(id: string): Promise<Reptile> {
    return prisma.reptile.update({
      where: { id },
      data: { deletedAt: null },
    })
  }
}

// Singleton instance for use across the application
export const reptileRepository = new ReptileRepository()
