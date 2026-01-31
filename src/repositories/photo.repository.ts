// Photo Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { Photo, Prisma, PhotoCategory } from '@/generated/prisma/client'

export interface FindManyOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  category?: PhotoCategory
  shedId?: string
  vetVisitId?: string
  includeDeleted?: boolean
}

export interface FindByIdOptions {
  includeReptile?: boolean
}

export interface PhotoWithReptile extends Photo {
  reptile?: {
    id: string
    userId: string
    deletedAt: Date | null
  }
}

export class PhotoRepository {
  async findMany(options: FindManyOptions): Promise<Photo[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { takenAt: 'desc' },
      category,
      shedId,
      vetVisitId,
      includeDeleted = false,
    } = options

    const where: Prisma.PhotoWhereInput = {
      reptileId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(category && { category }),
      ...(shedId && { shedId }),
      ...(vetVisitId && { vetVisitId }),
    }

    return prisma.photo.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(
    options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>
  ): Promise<number> {
    const { reptileId, category, shedId, vetVisitId, includeDeleted = false } = options

    const where: Prisma.PhotoWhereInput = {
      reptileId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(category && { category }),
      ...(shedId && { shedId }),
      ...(vetVisitId && { vetVisitId }),
    }

    return prisma.photo.count({ where })
  }

  async findById(
    id: string,
    options?: FindByIdOptions
  ): Promise<PhotoWithReptile | null> {
    return prisma.photo.findUnique({
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
    storagePath: string
    thumbnailPath?: string | null
    caption?: string | null
    takenAt?: Date
    category?: PhotoCategory
    isPrimary?: boolean
    shedId?: string | null
    vetVisitId?: string | null
    id?: string
  }): Promise<Photo> {
    return prisma.photo.create({
      data: {
        ...(data.id && { id: data.id }),
        reptileId: data.reptileId,
        storagePath: data.storagePath,
        thumbnailPath: data.thumbnailPath ?? null,
        caption: data.caption ?? null,
        takenAt: data.takenAt ?? new Date(),
        category: data.category ?? 'GENERAL',
        isPrimary: data.isPrimary ?? false,
        shedId: data.shedId ?? null,
        vetVisitId: data.vetVisitId ?? null,
      },
    })
  }

  async update(id: string, data: Prisma.PhotoUpdateInput): Promise<Photo> {
    return prisma.photo.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<Photo> {
    return prisma.photo.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async clearPrimaryForReptile(reptileId: string): Promise<void> {
    await prisma.photo.updateMany({
      where: {
        reptileId,
        isPrimary: true,
        deletedAt: null,
      },
      data: { isPrimary: false },
    })
  }
}

// Singleton instance for use across the application
export const photoRepository = new PhotoRepository()
