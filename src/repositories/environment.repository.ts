// Environment Repository - Database Operations Only
import { prisma } from '@/lib/db/client'
import type { EnvironmentLog, Prisma } from '@/generated/prisma/client'

export interface FindManyOptions {
  reptileId: string
  skip?: number
  take?: number
  orderBy?: { [key: string]: 'asc' | 'desc' }
  startDate?: Date
  endDate?: Date
  location?: string
  alertsOnly?: boolean
}

export class EnvironmentRepository {
  async findMany(options: FindManyOptions): Promise<EnvironmentLog[]> {
    const {
      reptileId,
      skip = 0,
      take = 20,
      orderBy = { date: 'desc' },
      startDate,
      endDate,
      location,
      alertsOnly = false,
    } = options

    const where: Prisma.EnvironmentLogWhereInput = {
      reptileId,
      ...(startDate && { date: { gte: startDate } }),
      ...(endDate && { date: { lte: endDate } }),
      ...(location && { location }),
      ...(alertsOnly && { isAlert: true }),
    }

    // Merge date conditions if both are provided
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate }
    }

    return prisma.environmentLog.findMany({
      where,
      skip,
      take,
      orderBy,
    })
  }

  async count(options: Omit<FindManyOptions, 'skip' | 'take' | 'orderBy'>): Promise<number> {
    const { reptileId, startDate, endDate, location, alertsOnly = false } = options

    const where: Prisma.EnvironmentLogWhereInput = {
      reptileId,
      ...(startDate && { date: { gte: startDate } }),
      ...(endDate && { date: { lte: endDate } }),
      ...(location && { location }),
      ...(alertsOnly && { isAlert: true }),
    }

    // Merge date conditions if both are provided
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate }
    }

    return prisma.environmentLog.count({ where })
  }

  async findById(id: string): Promise<EnvironmentLog | null> {
    return prisma.environmentLog.findUnique({
      where: { id },
    })
  }

  async create(data: Prisma.EnvironmentLogUncheckedCreateInput): Promise<EnvironmentLog> {
    return prisma.environmentLog.create({
      data,
    })
  }

  async update(id: string, data: Prisma.EnvironmentLogUpdateInput): Promise<EnvironmentLog> {
    return prisma.environmentLog.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<EnvironmentLog> {
    return prisma.environmentLog.delete({
      where: { id },
    })
  }
}

// Singleton instance for use across the application
export const environmentRepository = new EnvironmentRepository()
