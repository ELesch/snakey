// Reports Service - Aggregates data for analytics and reporting
import { prisma } from '@/lib/db/client'
import { createLogger } from '@/lib/logger'
import type { Prisma } from '@/generated/prisma/client'

const log = createLogger('ReportsService')

// Filter options for all report queries
export interface ReportFilters {
  reptileId?: string
  startDate?: string
  endDate?: string
}

// Pagination options
export interface PaginationOptions {
  limit?: number
  offset?: number
}

// Pagination meta for responses
export interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

// Constants for pagination
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

// Growth/Weight response types
export interface GrowthDataPoint {
  date: string
  weight: number | null
  length?: number | null  // Optional length in cm
  reptileId: string
  reptileName: string
}

export interface GrowthDataResponse {
  data: GrowthDataPoint[]
  meta: PaginationMeta
}

// Feeding stats response types
export interface FeedingDataPoint {
  date: string
  accepted: number
  refused: number
  regurgitated: number
}

export interface FeedingStatsSummary {
  totalFeedings: number
  acceptanceRate: number
  averageInterval: number
}

export interface FeedingStatsResponse {
  data: FeedingDataPoint[]
  summary: FeedingStatsSummary
  meta: PaginationMeta
}

// Shed stats response types
export interface ShedDataPoint {
  date: string
  reptileId: string
  quality: string
  durationDays: number | null
}

export interface ShedStatsSummary {
  totalSheds: number
  averageInterval: number
  averageQuality: string
}

export interface ShedStatsResponse {
  data: ShedDataPoint[]
  summary: ShedStatsSummary
  meta: PaginationMeta
}

// Environment stats response types
export interface EnvironmentDataPoint {
  date: string
  temperature: number | null
  humidity: number | null
  location: string | null
}

export interface EnvironmentStatsSummary {
  avgTemp: number
  avgHumidity: number
  tempRange: { min: number; max: number }
  humidityRange: { min: number; max: number }
}

export interface EnvironmentStatsResponse {
  data: EnvironmentDataPoint[]
  summary: EnvironmentStatsSummary
}

// Summary response types
export interface SummaryResponse {
  totalReptiles: number
  totalFeedings: number
  totalSheds: number
  lastFeeding: string | null
  lastShed: string | null
  healthScore: number
}

export class ReportsService {
  /**
   * Get weight/growth data points for charting
   * Fetches both WEIGHT and LENGTH measurements, merging by date
   */
  async getGrowthData(
    userId: string,
    filters: ReportFilters,
    pagination?: PaginationOptions
  ): Promise<GrowthDataResponse> {
    log.info({ userId, filters }, 'Fetching growth data')

    const where = this.buildMeasurementWhere(userId, filters)
    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const offset = pagination?.offset ?? 0

    // Fetch both WEIGHT and LENGTH measurements
    const [measurements, totalWeight] = await Promise.all([
      prisma.measurement.findMany({
        where: { ...where, type: { in: ['WEIGHT', 'LENGTH'] } },
        include: {
          reptile: {
            select: { id: true, name: true, userId: true },
          },
        },
        orderBy: { date: 'asc' },
      }),
      // Total count based on weight for pagination consistency
      prisma.measurement.count({ where: { ...where, type: 'WEIGHT' } }),
    ])

    // Group by date and reptile, combining weight + length
    const dataMap = new Map<string, GrowthDataPoint>()
    for (const m of measurements) {
      // Use date without time for grouping
      const dateKey = m.date.toISOString().split('T')[0]
      const key = `${dateKey}-${m.reptileId}`
      const existing = dataMap.get(key)

      if (existing) {
        if (m.type === 'WEIGHT') {
          existing.weight = Number(m.value)
        } else if (m.type === 'LENGTH') {
          existing.length = Number(m.value)
        }
      } else {
        dataMap.set(key, {
          date: m.date.toISOString(),
          weight: m.type === 'WEIGHT' ? Number(m.value) : null,
          length: m.type === 'LENGTH' ? Number(m.value) : undefined,
          reptileId: m.reptileId,
          reptileName: m.reptile.name,
        })
      }
    }

    // Convert to array and sort by date
    const data = Array.from(dataMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(offset, offset + limit)

    return {
      data,
      meta: { total: totalWeight, limit, offset },
    }
  }

  /**
   * Get feeding statistics with summary metrics
   */
  async getFeedingStats(
    userId: string,
    filters: ReportFilters,
    pagination?: PaginationOptions
  ): Promise<FeedingStatsResponse> {
    log.info({ userId, filters }, 'Fetching feeding stats')

    const where = this.buildFeedingWhere(userId, filters)
    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const offset = pagination?.offset ?? 0

    const [feedings, total] = await Promise.all([
      prisma.feeding.findMany({
        where,
        include: {
          reptile: {
            select: { id: true, name: true, userId: true },
          },
        },
        orderBy: { date: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.feeding.count({ where }),
    ])

    // Group by date for chart data
    const groupedByDate = new Map<
      string,
      { accepted: number; refused: number; regurgitated: number }
    >()

    for (const feeding of feedings) {
      const dateKey = feeding.date.toISOString().split('T')[0]
      const existing = groupedByDate.get(dateKey) || {
        accepted: 0,
        refused: 0,
        regurgitated: 0,
      }

      if (feeding.regurgitated) {
        existing.regurgitated++
      } else if (feeding.refused) {
        existing.refused++
      } else if (feeding.accepted) {
        existing.accepted++
      }

      groupedByDate.set(dateKey, existing)
    }

    const data: FeedingDataPoint[] = Array.from(groupedByDate.entries()).map(
      ([date, counts]) => ({
        date,
        ...counts,
      })
    )

    // Calculate summary metrics
    const totalFeedings = feedings.length
    const acceptedCount = feedings.filter(
      (f) => f.accepted && !f.refused && !f.regurgitated
    ).length
    const acceptanceRate =
      totalFeedings > 0 ? (acceptedCount / totalFeedings) * 100 : 0

    // Calculate average interval between feedings
    const averageInterval = this.calculateAverageInterval(
      feedings.map((f) => f.date)
    )

    return {
      data,
      summary: {
        totalFeedings,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        averageInterval,
      },
      meta: { total, limit, offset },
    }
  }

  /**
   * Get shed statistics with summary metrics
   */
  async getShedStats(
    userId: string,
    filters: ReportFilters,
    pagination?: PaginationOptions
  ): Promise<ShedStatsResponse> {
    log.info({ userId, filters }, 'Fetching shed stats')

    const where = this.buildShedWhere(userId, filters)
    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const offset = pagination?.offset ?? 0

    const [sheds, total] = await Promise.all([
      prisma.shed.findMany({
        where,
        include: {
          reptile: {
            select: { id: true, name: true, userId: true },
          },
        },
        orderBy: { completedDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.shed.count({ where }),
    ])

    const data: ShedDataPoint[] = sheds.map((s) => {
      let durationDays: number | null = null
      if (s.startDate && s.completedDate) {
        const diffMs = s.completedDate.getTime() - s.startDate.getTime()
        durationDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        date: s.completedDate.toISOString(),
        reptileId: s.reptileId,
        quality: s.quality,
        durationDays,
      }
    })

    // Calculate summary metrics
    const totalSheds = sheds.length
    const averageInterval = this.calculateAverageInterval(
      sheds.map((s) => s.completedDate)
    )

    // Find most common quality
    const qualityCounts = new Map<string, number>()
    for (const shed of sheds) {
      const count = qualityCounts.get(shed.quality) || 0
      qualityCounts.set(shed.quality, count + 1)
    }

    let averageQuality = 'N/A'
    let maxCount = 0
    for (const [quality, count] of qualityCounts.entries()) {
      if (count > maxCount) {
        maxCount = count
        averageQuality = quality
      }
    }

    return {
      data,
      summary: {
        totalSheds,
        averageInterval,
        averageQuality,
      },
      meta: { total, limit, offset },
    }
  }

  /**
   * Get environment statistics with summary metrics
   */
  async getEnvironmentStats(
    userId: string,
    filters: ReportFilters
  ): Promise<EnvironmentStatsResponse> {
    log.info({ userId, filters }, 'Fetching environment stats')

    const where = this.buildEnvironmentWhere(userId, filters)

    const logs = await prisma.environmentLog.findMany({
      where,
      include: {
        reptile: {
          select: { id: true, name: true, userId: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    const data: EnvironmentDataPoint[] = logs.map((l) => ({
      date: l.date.toISOString(),
      temperature: l.temperature !== null ? Number(l.temperature) : null,
      humidity: l.humidity !== null ? Number(l.humidity) : null,
      location: l.location,
    }))

    // Calculate summary metrics
    const temps = logs
      .filter((l) => l.temperature !== null)
      .map((l) => Number(l.temperature))
    const humidities = logs
      .filter((l) => l.humidity !== null)
      .map((l) => Number(l.humidity))

    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0
    const avgHumidity =
      humidities.length > 0
        ? humidities.reduce((a, b) => a + b, 0) / humidities.length
        : 0

    const tempRange = {
      min: temps.length > 0 ? Math.min(...temps) : 0,
      max: temps.length > 0 ? Math.max(...temps) : 0,
    }

    const humidityRange = {
      min: humidities.length > 0 ? Math.min(...humidities) : 0,
      max: humidities.length > 0 ? Math.max(...humidities) : 0,
    }

    return {
      data,
      summary: {
        avgTemp: Math.round(avgTemp * 100) / 100,
        avgHumidity: Math.round(avgHumidity * 100) / 100,
        tempRange,
        humidityRange,
      },
    }
  }

  /**
   * Get summary metrics for dashboard cards
   */
  async getSummary(userId: string): Promise<SummaryResponse> {
    log.info({ userId }, 'Fetching reports summary')

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [totalReptiles, totalFeedings, totalSheds, recentFeedings, recentSheds] =
      await Promise.all([
        prisma.reptile.count({
          where: { userId, deletedAt: null },
        }),
        prisma.feeding.count({
          where: { reptile: { userId, deletedAt: null } },
        }),
        prisma.shed.count({
          where: { reptile: { userId, deletedAt: null } },
        }),
        prisma.feeding.findMany({
          where: {
            reptile: { userId, deletedAt: null },
            date: { gte: thirtyDaysAgo },
          },
          orderBy: { date: 'desc' },
          take: 10,
          select: { date: true, accepted: true, refused: true, regurgitated: true },
        }),
        prisma.shed.findMany({
          where: {
            reptile: { userId, deletedAt: null },
            completedDate: { gte: thirtyDaysAgo },
          },
          orderBy: { completedDate: 'desc' },
          take: 1,
          select: { completedDate: true },
        }),
      ])

    const lastFeeding = recentFeedings[0]?.date?.toISOString() ?? null
    const lastShed = recentSheds[0]?.completedDate?.toISOString() ?? null

    // Calculate health score (0-100) based on recent feeding acceptance
    const healthScore = this.calculateHealthScore(recentFeedings)

    return {
      totalReptiles,
      totalFeedings,
      totalSheds,
      lastFeeding,
      lastShed,
      healthScore,
    }
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  private buildMeasurementWhere(userId: string, filters: ReportFilters): Prisma.MeasurementWhereInput {
    const where: Prisma.MeasurementWhereInput = {
      reptile: { userId, deletedAt: null },
    }

    if (filters.reptileId && filters.reptileId !== 'all') {
      where.reptileId = filters.reptileId
    }

    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate)
      }
    }

    return where
  }

  private buildFeedingWhere(userId: string, filters: ReportFilters): Prisma.FeedingWhereInput {
    const where: Prisma.FeedingWhereInput = {
      reptile: { userId, deletedAt: null },
    }

    if (filters.reptileId && filters.reptileId !== 'all') {
      where.reptileId = filters.reptileId
    }

    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate)
      }
    }

    return where
  }

  private buildShedWhere(userId: string, filters: ReportFilters): Prisma.ShedWhereInput {
    const where: Prisma.ShedWhereInput = {
      reptile: { userId, deletedAt: null },
    }

    if (filters.reptileId && filters.reptileId !== 'all') {
      where.reptileId = filters.reptileId
    }

    if (filters.startDate || filters.endDate) {
      where.completedDate = {}
      if (filters.startDate) {
        where.completedDate.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.completedDate.lte = new Date(filters.endDate)
      }
    }

    return where
  }

  private buildEnvironmentWhere(userId: string, filters: ReportFilters): Prisma.EnvironmentLogWhereInput {
    const where: Prisma.EnvironmentLogWhereInput = {
      reptile: { userId, deletedAt: null },
    }

    if (filters.reptileId && filters.reptileId !== 'all') {
      where.reptileId = filters.reptileId
    }

    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate)
      }
    }

    return where
  }

  private calculateAverageInterval(dates: Date[]): number {
    if (dates.length < 2) {
      return 0
    }

    // Sort dates chronologically
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime())

    let totalDays = 0
    for (let i = 1; i < sortedDates.length; i++) {
      const diffMs = sortedDates[i].getTime() - sortedDates[i - 1].getTime()
      totalDays += diffMs / (1000 * 60 * 60 * 24)
    }

    return Math.round(totalDays / (sortedDates.length - 1))
  }

  private calculateHealthScore(
    feedings: Array<{
      accepted: boolean
      refused: boolean
      regurgitated: boolean
    }>
  ): number {
    if (feedings.length === 0) {
      return 100 // No data, assume healthy
    }

    const acceptedCount = feedings.filter(
      (f) => f.accepted && !f.refused && !f.regurgitated
    ).length

    const acceptanceRate = acceptedCount / feedings.length

    // Scale to 0-100
    // 100% acceptance = 100 score
    // 0% acceptance = 50 score (still alive)
    return Math.round(50 + acceptanceRate * 50)
  }
}

// Singleton instance
export const reportsService = new ReportsService()
