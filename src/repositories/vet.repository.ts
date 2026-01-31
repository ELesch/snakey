// Vet Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { VetVisit, Medication, Prisma } from '@/generated/prisma/client'

// ============================================================================
// VET VISIT INTERFACES
// ============================================================================

export interface FindManyVisitsOptions {
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

// ============================================================================
// MEDICATION INTERFACES
// ============================================================================

export interface FindManyMedicationsOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  activeOnly?: boolean
}

// ============================================================================
// REPOSITORY CLASS
// ============================================================================

export class VetRepository {
  // --------------------------------------------------------------------------
  // VET VISIT METHODS
  // --------------------------------------------------------------------------

  async findManyVisits(options: FindManyVisitsOptions): Promise<VetVisit[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { date: 'desc' },
      startDate,
      endDate,
    } = options

    const where: Prisma.VetVisitWhereInput = {
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
    }

    return prisma.vetVisit.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async countVisits(options: Omit<FindManyVisitsOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, startDate, endDate } = options

    const where: Prisma.VetVisitWhereInput = {
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
    }

    return prisma.vetVisit.count({ where })
  }

  async findVisitById(
    id: string,
    options?: FindByIdOptions
  ): Promise<(VetVisit & { reptile?: { id: string; userId: string; deletedAt: Date | null } }) | null> {
    return prisma.vetVisit.findUnique({
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

  async createVisit(data: {
    reptileId: string
    date: Date
    reason: string
    diagnosis?: string | null
    treatment?: string | null
    vetName?: string | null
    vetClinic?: string | null
    cost?: number | null
    followUp?: Date | null
    notes?: string | null
    id?: string
  }): Promise<VetVisit> {
    return prisma.vetVisit.create({
      data: {
        ...(data.id && { id: data.id }),
        reptileId: data.reptileId,
        date: data.date,
        reason: data.reason,
        diagnosis: data.diagnosis ?? null,
        treatment: data.treatment ?? null,
        vetName: data.vetName ?? null,
        vetClinic: data.vetClinic ?? null,
        cost: data.cost ?? null,
        followUp: data.followUp ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async updateVisit(id: string, data: Prisma.VetVisitUpdateInput): Promise<VetVisit> {
    return prisma.vetVisit.update({
      where: { id },
      data,
    })
  }

  async deleteVisit(id: string): Promise<VetVisit> {
    return prisma.vetVisit.delete({
      where: { id },
    })
  }

  // --------------------------------------------------------------------------
  // MEDICATION METHODS
  // --------------------------------------------------------------------------

  async findManyMedications(options: FindManyMedicationsOptions): Promise<Medication[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { startDate: 'desc' },
      activeOnly,
    } = options

    const now = new Date()

    const where: Prisma.MedicationWhereInput = {
      reptileId,
      ...(activeOnly && {
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      }),
    }

    return prisma.medication.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async countMedications(options: Omit<FindManyMedicationsOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, activeOnly } = options

    const now = new Date()

    const where: Prisma.MedicationWhereInput = {
      reptileId,
      ...(activeOnly && {
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      }),
    }

    return prisma.medication.count({ where })
  }

  async findMedicationById(
    id: string,
    options?: FindByIdOptions
  ): Promise<(Medication & { reptile?: { id: string; userId: string; deletedAt: Date | null } }) | null> {
    return prisma.medication.findUnique({
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

  async createMedication(data: {
    reptileId: string
    name: string
    dosage: string
    frequency: string
    startDate: Date
    endDate?: Date | null
    notes?: string | null
    reminders?: boolean
    id?: string
  }): Promise<Medication> {
    return prisma.medication.create({
      data: {
        ...(data.id && { id: data.id }),
        reptileId: data.reptileId,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        notes: data.notes ?? null,
        reminders: data.reminders ?? false,
      },
    })
  }

  async updateMedication(id: string, data: Prisma.MedicationUpdateInput): Promise<Medication> {
    return prisma.medication.update({
      where: { id },
      data,
    })
  }

  async deleteMedication(id: string): Promise<Medication> {
    return prisma.medication.delete({
      where: { id },
    })
  }

  async findActiveMedications(reptileId: string): Promise<Medication[]> {
    const now = new Date()

    return prisma.medication.findMany({
      where: {
        reptileId,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { startDate: 'asc' },
    })
  }
}

// Singleton instance for use across the application
export const vetRepository = new VetRepository()
