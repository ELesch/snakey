// Breeding Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type {
  Pairing,
  Clutch,
  Hatchling,
  Prisma,
  Sex,
  HatchStatus,
} from '@/generated/prisma/client'

// ============================================================================
// PAIRING REPOSITORY
// ============================================================================

export interface PairingFindManyOptions {
  userId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  startDate?: Date
  endDate?: Date
  successful?: boolean
}

export interface PairingFindByIdOptions {
  includeMale?: boolean
  includeFemale?: boolean
  includeClutches?: boolean
}

type PairingWithRelations = Pairing & {
  male?: { id: string; userId: string; deletedAt: Date | null; name: string; species: string }
  female?: { id: string; userId: string; deletedAt: Date | null; name: string; species: string }
  clutches?: Clutch[]
}

export class PairingRepository {
  async findMany(options: PairingFindManyOptions): Promise<Pairing[]> {
    const {
      userId,
      skip = 0,
      take = 20,
      orderBy = { startDate: 'desc' },
      startDate,
      endDate,
      successful,
    } = options

    const where: Prisma.PairingWhereInput = {
      userId,
      ...(startDate && endDate && {
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(startDate && !endDate && {
        startDate: { gte: startDate },
      }),
      ...(!startDate && endDate && {
        startDate: { lte: endDate },
      }),
      ...(successful !== undefined && { successful }),
    }

    return prisma.pairing.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        male: {
          select: { id: true, name: true, species: true, morph: true },
        },
        female: {
          select: { id: true, name: true, species: true, morph: true },
        },
      },
    })
  }

  async count(options: Omit<PairingFindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { userId, startDate, endDate, successful } = options

    const where: Prisma.PairingWhereInput = {
      userId,
      ...(startDate && endDate && {
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(startDate && !endDate && {
        startDate: { gte: startDate },
      }),
      ...(!startDate && endDate && {
        startDate: { lte: endDate },
      }),
      ...(successful !== undefined && { successful }),
    }

    return prisma.pairing.count({ where })
  }

  async findById(id: string, options?: PairingFindByIdOptions): Promise<PairingWithRelations | null> {
    const include: Prisma.PairingInclude = {}

    if (options?.includeMale) {
      include.male = {
        select: {
          id: true,
          userId: true,
          deletedAt: true,
          name: true,
          species: true,
        },
      }
    }

    if (options?.includeFemale) {
      include.female = {
        select: {
          id: true,
          userId: true,
          deletedAt: true,
          name: true,
          species: true,
        },
      }
    }

    if (options?.includeClutches) {
      include.clutches = true
    }

    return prisma.pairing.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })
  }

  async create(data: {
    userId: string
    maleId: string
    femaleId: string
    startDate: Date
    endDate?: Date | null
    successful?: boolean | null
    notes?: string | null
    id?: string
  }): Promise<Pairing> {
    return prisma.pairing.create({
      data: {
        ...(data.id && { id: data.id }),
        userId: data.userId,
        maleId: data.maleId,
        femaleId: data.femaleId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        successful: data.successful ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async update(id: string, data: Prisma.PairingUpdateInput): Promise<Pairing> {
    return prisma.pairing.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Pairing> {
    return prisma.pairing.delete({
      where: { id },
    })
  }
}

// ============================================================================
// CLUTCH REPOSITORY
// ============================================================================

export interface ClutchFindManyOptions {
  pairingId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
}

export interface ClutchFindByIdOptions {
  includePairing?: boolean
  includeHatchlings?: boolean
}

type ClutchWithRelations = Clutch & {
  pairing?: Pairing & { userId: string }
  hatchlings?: Hatchling[]
}

export class ClutchRepository {
  async findMany(options: ClutchFindManyOptions): Promise<Clutch[]> {
    const {
      pairingId,
      skip = 0,
      take = 20,
      orderBy = { layDate: 'desc' },
    } = options

    return prisma.clutch.findMany({
      where: { pairingId },
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<ClutchFindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { pairingId } = options

    return prisma.clutch.count({
      where: { pairingId },
    })
  }

  async findById(id: string, options?: ClutchFindByIdOptions): Promise<ClutchWithRelations | null> {
    const include: Prisma.ClutchInclude = {}

    if (options?.includePairing) {
      include.pairing = true
    }

    if (options?.includeHatchlings) {
      include.hatchlings = true
    }

    return prisma.clutch.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })
  }

  async create(data: {
    pairingId: string
    layDate: Date
    eggCount: number
    fertileCount?: number | null
    incubationTemp?: number | null
    dueDate?: Date | null
    notes?: string | null
    id?: string
  }): Promise<Clutch> {
    return prisma.clutch.create({
      data: {
        ...(data.id && { id: data.id }),
        pairingId: data.pairingId,
        layDate: data.layDate,
        eggCount: data.eggCount,
        fertileCount: data.fertileCount ?? null,
        incubationTemp: data.incubationTemp ?? null,
        dueDate: data.dueDate ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async update(id: string, data: Prisma.ClutchUpdateInput): Promise<Clutch> {
    return prisma.clutch.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Clutch> {
    return prisma.clutch.delete({
      where: { id },
    })
  }
}

// ============================================================================
// HATCHLING REPOSITORY
// ============================================================================

export interface HatchlingFindManyOptions {
  clutchId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  status?: HatchStatus
}

export interface HatchlingFindByIdOptions {
  includeClutch?: boolean
}

type HatchlingWithRelations = Hatchling & {
  clutch?: ClutchWithRelations
}

export class HatchlingRepository {
  async findMany(options: HatchlingFindManyOptions): Promise<Hatchling[]> {
    const {
      clutchId,
      skip = 0,
      take = 20,
      orderBy = { createdAt: 'desc' },
      status,
    } = options

    const where: Prisma.HatchlingWhereInput = {
      clutchId,
      ...(status && { status }),
    }

    return prisma.hatchling.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<HatchlingFindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { clutchId, status } = options

    const where: Prisma.HatchlingWhereInput = {
      clutchId,
      ...(status && { status }),
    }

    return prisma.hatchling.count({ where })
  }

  async findById(id: string, options?: HatchlingFindByIdOptions): Promise<HatchlingWithRelations | null> {
    const include: Prisma.HatchlingInclude = {}

    if (options?.includeClutch) {
      include.clutch = {
        include: {
          pairing: true,
        },
      }
    }

    return prisma.hatchling.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })
  }

  async create(data: {
    clutchId: string
    hatchDate?: Date | null
    status: HatchStatus
    morph?: string | null
    sex: Sex
    notes?: string | null
    reptileId?: string | null
    id?: string
  }): Promise<Hatchling> {
    return prisma.hatchling.create({
      data: {
        ...(data.id && { id: data.id }),
        clutchId: data.clutchId,
        hatchDate: data.hatchDate ?? null,
        status: data.status,
        morph: data.morph ?? null,
        sex: data.sex,
        notes: data.notes ?? null,
        reptileId: data.reptileId ?? null,
      },
    })
  }

  async update(id: string, data: Prisma.HatchlingUpdateInput): Promise<Hatchling> {
    return prisma.hatchling.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Hatchling> {
    return prisma.hatchling.delete({
      where: { id },
    })
  }
}

// Singleton instances
export const pairingRepository = new PairingRepository()
export const clutchRepository = new ClutchRepository()
export const hatchlingRepository = new HatchlingRepository()
