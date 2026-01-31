// Dashboard Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardService } from './dashboard.service'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    reptile: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    feeding: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    shed: {
      findMany: vi.fn(),
    },
    weight: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    environmentLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/client'

const mockedPrisma = vi.mocked(prisma, true)

describe('DashboardService', () => {
  let service: DashboardService
  const userId = 'test-user-id'

  beforeEach(() => {
    service = new DashboardService()
    vi.clearAllMocks()
  })

  describe('getStats', () => {
    it('should return collection stats for a user', async () => {
      // Mock for reptile count
      mockedPrisma.reptile.count.mockResolvedValue(5)

      // Mock for countFeedingsDue (internal call to findMany)
      mockedPrisma.reptile.findMany.mockResolvedValue([
        {
          id: 'reptile-1',
          species: 'Ball Python',
          feedings: [{ date: new Date() }],
        },
      ] as never)

      // Mock for weight count
      mockedPrisma.weight.count.mockResolvedValue(2)

      // Mock for environment alerts count
      mockedPrisma.environmentLog.count.mockResolvedValue(1)

      const stats = await service.getStats(userId)

      expect(stats).toEqual({
        totalReptiles: 5,
        feedingsDue: 0, // Not due since just fed
        recentWeights: 2,
        environmentAlerts: 1,
      })
      expect(mockedPrisma.reptile.count).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
      })
    })

    it('should count overdue feedings correctly', async () => {
      mockedPrisma.reptile.count.mockResolvedValue(2)

      // One reptile with old feeding, one never fed
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      mockedPrisma.reptile.findMany.mockResolvedValue([
        {
          id: 'reptile-1',
          species: 'Ball Python',
          feedings: [{ date: thirtyDaysAgo }],
        },
        {
          id: 'reptile-2',
          species: 'Corn Snake',
          feedings: [], // Never fed
        },
      ] as never)

      mockedPrisma.weight.count.mockResolvedValue(0)
      mockedPrisma.environmentLog.count.mockResolvedValue(0)

      const stats = await service.getStats(userId)

      expect(stats.feedingsDue).toBe(2) // Both are overdue
    })
  })

  describe('getUpcomingFeedings', () => {
    it('should return upcoming feedings for user reptiles', async () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

      const mockReptiles = [
        {
          id: 'reptile-1',
          name: 'Slither',
          species: 'Ball Python',
          feedings: [{ date: recentDate }],
        },
        {
          id: 'reptile-2',
          name: 'Scales',
          species: 'Corn Snake',
          feedings: [{ date: new Date() }], // Just fed today
        },
      ]
      mockedPrisma.reptile.findMany.mockResolvedValue(mockReptiles as never)

      const feedings = await service.getUpcomingFeedings(userId, 7)

      expect(Array.isArray(feedings)).toBe(true)
      expect(feedings.length).toBeGreaterThan(0)
      expect(mockedPrisma.reptile.findMany).toHaveBeenCalled()
    })

    it('should return empty array when no reptiles', async () => {
      mockedPrisma.reptile.findMany.mockResolvedValue([])

      const feedings = await service.getUpcomingFeedings(userId, 7)

      expect(feedings).toEqual([])
    })
  })

  describe('getRecentActivity', () => {
    it('should return recent activity across all event types', async () => {
      mockedPrisma.feeding.findMany.mockResolvedValue([
        {
          id: 'feed-1',
          date: new Date(),
          preyType: 'Mouse',
          preySize: 'Medium',
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'reptile-1', name: 'Slither' },
        },
      ] as never)
      mockedPrisma.shed.findMany.mockResolvedValue([])
      mockedPrisma.weight.findMany.mockResolvedValue([])

      const activity = await service.getRecentActivity(userId, 10)

      expect(Array.isArray(activity)).toBe(true)
      expect(activity.length).toBe(1)
      expect(activity[0].type).toBe('feeding')
      expect(activity[0].reptileName).toBe('Slither')
    })

    it('should combine and sort activities from all types', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      mockedPrisma.feeding.findMany.mockResolvedValue([
        {
          id: 'feed-1',
          date: yesterday,
          preyType: 'Mouse',
          preySize: 'Medium',
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither' },
        },
      ] as never)
      mockedPrisma.shed.findMany.mockResolvedValue([
        {
          id: 'shed-1',
          completedDate: now,
          quality: 'COMPLETE',
          reptile: { id: 'r2', name: 'Scales' },
        },
      ] as never)
      mockedPrisma.weight.findMany.mockResolvedValue([])

      const activity = await service.getRecentActivity(userId, 10)

      expect(activity.length).toBe(2)
      // Most recent first
      expect(activity[0].type).toBe('shed')
      expect(activity[1].type).toBe('feeding')
    })
  })

  describe('getEnvironmentAlerts', () => {
    it('should return active environment alerts', async () => {
      mockedPrisma.environmentLog.findMany.mockResolvedValue([
        {
          id: 'alert-1',
          date: new Date(),
          temperature: 95,
          humidity: null,
          isAlert: true,
          reptile: { id: 'reptile-1', name: 'Slither' },
        },
      ] as never)

      const alerts = await service.getEnvironmentAlerts(userId)

      expect(Array.isArray(alerts)).toBe(true)
      expect(alerts.length).toBe(1)
      expect(alerts[0].type).toBe('temperature')
      expect(alerts[0].reptileName).toBe('Slither')
      expect(mockedPrisma.environmentLog.findMany).toHaveBeenCalled()
    })

    it('should determine correct severity for alerts', async () => {
      mockedPrisma.environmentLog.findMany.mockResolvedValue([
        {
          id: 'alert-1',
          date: new Date(),
          temperature: 105, // Critical - too hot
          humidity: null,
          isAlert: true,
          reptile: { id: 'r1', name: 'Hot Snake' },
        },
        {
          id: 'alert-2',
          date: new Date(),
          temperature: null,
          humidity: 25, // Critical - too dry
          isAlert: true,
          reptile: { id: 'r2', name: 'Dry Gecko' },
        },
      ] as never)

      const alerts = await service.getEnvironmentAlerts(userId)

      expect(alerts[0].severity).toBe('critical')
      expect(alerts[1].severity).toBe('critical')
    })
  })
})
