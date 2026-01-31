// Dashboard Service - Aggregates data for dashboard display
import { prisma } from '@/lib/db/client'
import { createLogger } from '@/lib/logger'

const log = createLogger('DashboardService')

// Response types
export interface DashboardStats {
  totalReptiles: number
  feedingsDue: number
  recentWeights: number
  environmentAlerts: number
}

export interface UpcomingFeeding {
  id: string
  reptileId: string
  reptileName: string
  species: string
  dueDate: Date
  daysSinceLastFeeding: number
  feedingInterval: number
}

export interface EnvironmentAlert {
  id: string
  reptileId: string
  reptileName: string
  type: 'temperature' | 'humidity'
  severity: 'warning' | 'critical'
  message: string
  value: number
  date: Date
}

export type ActivityType = 'feeding' | 'shed' | 'weight' | 'environment' | 'photo'

export interface Activity {
  id: string
  type: ActivityType
  reptileId: string
  reptileName: string
  description: string
  timestamp: Date
}

// Default feeding intervals by species (days)
const DEFAULT_FEEDING_INTERVALS: Record<string, number> = {
  'Ball Python': 10,
  'Corn Snake': 7,
  'Leopard Gecko': 3,
  'Bearded Dragon': 1,
  'Crested Gecko': 2,
  default: 7,
}

export class DashboardService {
  /**
   * Get aggregated stats for the dashboard
   */
  async getStats(userId: string): Promise<DashboardStats> {
    log.info({ userId }, 'Fetching dashboard stats')

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [totalReptiles, feedingsDue, recentWeights, environmentAlerts] =
      await Promise.all([
        // Count non-deleted reptiles
        prisma.reptile.count({
          where: { userId, deletedAt: null },
        }),

        // Count feedings due (reptiles that need feeding in next 7 days)
        this.countFeedingsDue(userId),

        // Count weight records in last 30 days
        prisma.weight.count({
          where: {
            reptile: { userId, deletedAt: null },
            date: { gte: thirtyDaysAgo },
          },
        }),

        // Count environment alerts
        prisma.environmentLog.count({
          where: {
            reptile: { userId, deletedAt: null },
            isAlert: true,
            date: { gte: sevenDaysAgo },
          },
        }),
      ])

    return {
      totalReptiles,
      feedingsDue,
      recentWeights,
      environmentAlerts,
    }
  }

  /**
   * Count reptiles that are due for feeding
   */
  private async countFeedingsDue(userId: string): Promise<number> {
    const reptiles = await prisma.reptile.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        species: true,
        feedings: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
      },
    })

    const now = new Date()
    let dueCount = 0

    for (const reptile of reptiles) {
      const interval =
        DEFAULT_FEEDING_INTERVALS[reptile.species] ??
        DEFAULT_FEEDING_INTERVALS.default
      const lastFeeding = reptile.feedings[0]?.date

      if (!lastFeeding) {
        // Never fed, definitely due
        dueCount++
      } else {
        const daysSince = Math.floor(
          (now.getTime() - lastFeeding.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSince >= interval - 1) {
          // Due within next day
          dueCount++
        }
      }
    }

    return dueCount
  }

  /**
   * Get upcoming feedings for all user's reptiles
   */
  async getUpcomingFeedings(
    userId: string,
    days: number = 7
  ): Promise<UpcomingFeeding[]> {
    log.info({ userId, days }, 'Fetching upcoming feedings')

    const reptiles = await prisma.reptile.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        species: true,
        feedings: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
      },
    })

    const now = new Date()
    const upcomingFeedings: UpcomingFeeding[] = []

    for (const reptile of reptiles) {
      const interval =
        DEFAULT_FEEDING_INTERVALS[reptile.species] ??
        DEFAULT_FEEDING_INTERVALS.default
      const lastFeeding = reptile.feedings[0]?.date
      const daysSince = lastFeeding
        ? Math.floor(
            (now.getTime() - lastFeeding.getTime()) / (1000 * 60 * 60 * 24)
          )
        : interval + 1 // If never fed, overdue

      // Calculate due date
      const dueDate = lastFeeding
        ? new Date(lastFeeding.getTime() + interval * 24 * 60 * 60 * 1000)
        : now

      // Include if due within the specified days window
      const daysUntilDue = Math.floor(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilDue <= days) {
        upcomingFeedings.push({
          id: `feeding-due-${reptile.id}`,
          reptileId: reptile.id,
          reptileName: reptile.name,
          species: reptile.species,
          dueDate,
          daysSinceLastFeeding: daysSince,
          feedingInterval: interval,
        })
      }
    }

    // Sort by due date (most urgent first)
    upcomingFeedings.sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    )

    return upcomingFeedings
  }

  /**
   * Get recent activity across all event types
   */
  async getRecentActivity(
    userId: string,
    limit: number = 10
  ): Promise<Activity[]> {
    log.info({ userId, limit }, 'Fetching recent activity')

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [feedings, sheds, weights] = await Promise.all([
      prisma.feeding.findMany({
        where: {
          reptile: { userId, deletedAt: null },
          date: { gte: thirtyDaysAgo },
        },
        include: { reptile: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        take: limit,
      }),

      prisma.shed.findMany({
        where: {
          reptile: { userId, deletedAt: null },
          completedDate: { gte: thirtyDaysAgo },
        },
        include: { reptile: { select: { id: true, name: true } } },
        orderBy: { completedDate: 'desc' },
        take: limit,
      }),

      prisma.weight.findMany({
        where: {
          reptile: { userId, deletedAt: null },
          date: { gte: thirtyDaysAgo },
        },
        include: { reptile: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        take: limit,
      }),
    ])

    const activities: Activity[] = []

    // Convert feedings to activities
    for (const feeding of feedings) {
      const status = feeding.refused
        ? 'refused'
        : feeding.regurgitated
          ? 'regurgitated'
          : 'accepted'
      activities.push({
        id: feeding.id,
        type: 'feeding',
        reptileId: feeding.reptile.id,
        reptileName: feeding.reptile.name,
        description: `Fed ${feeding.preySize} ${feeding.preyType} (${status})`,
        timestamp: feeding.date,
      })
    }

    // Convert sheds to activities
    for (const shed of sheds) {
      activities.push({
        id: shed.id,
        type: 'shed',
        reptileId: shed.reptile.id,
        reptileName: shed.reptile.name,
        description: `Completed ${shed.quality.toLowerCase()} shed`,
        timestamp: shed.completedDate,
      })
    }

    // Convert weights to activities
    for (const weight of weights) {
      activities.push({
        id: weight.id,
        type: 'weight',
        reptileId: weight.reptile.id,
        reptileName: weight.reptile.name,
        description: `Weighed ${formatWeight(weight.weight)}g`,
        timestamp: weight.date,
      })
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )

    return activities.slice(0, limit)
  }

  /**
   * Get active environment alerts
   */
  async getEnvironmentAlerts(userId: string): Promise<EnvironmentAlert[]> {
    log.info({ userId }, 'Fetching environment alerts')

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const alertLogs = await prisma.environmentLog.findMany({
      where: {
        reptile: { userId, deletedAt: null },
        isAlert: true,
        date: { gte: sevenDaysAgo },
      },
      include: { reptile: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    })

    return alertLogs.map((log) => {
      const hasTemp = log.temperature !== null
      const hasHumidity = log.humidity !== null
      const type: 'temperature' | 'humidity' = hasTemp ? 'temperature' : 'humidity'
      const value = hasTemp
        ? Number(log.temperature)
        : Number(log.humidity)

      // Determine severity based on value ranges (simplified)
      const severity: 'warning' | 'critical' =
        type === 'temperature'
          ? value > 100 || value < 65
            ? 'critical'
            : 'warning'
          : value > 90 || value < 30
            ? 'critical'
            : 'warning'

      const message =
        type === 'temperature'
          ? `Temperature at ${value}F`
          : `Humidity at ${value}%`

      return {
        id: log.id,
        reptileId: log.reptile.id,
        reptileName: log.reptile.name,
        type,
        severity,
        message,
        value,
        date: log.date,
      }
    })
  }
}

// Helper to format weight (handles Prisma Decimal type)
function formatWeight(weight: unknown): string {
  return Number(weight).toFixed(1)
}

// Singleton instance
export const dashboardService = new DashboardService()
