// Reports Service Tests - Analytics data aggregation
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportsService } from './reports.service'

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
      count: vi.fn(),
    },
    weight: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    environmentLog: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/client'

const mockedPrisma = vi.mocked(prisma, true)

describe('ReportsService', () => {
  let service: ReportsService
  const userId = 'test-user-id'

  beforeEach(() => {
    service = new ReportsService()
    vi.clearAllMocks()
  })

  describe('getGrowthData', () => {
    it('should return weight data points for charting', async () => {
      const now = new Date()
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      mockedPrisma.weight.findMany.mockResolvedValue([
        {
          id: 'weight-1',
          date: now,
          weight: 500.5,
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
        {
          id: 'weight-2',
          date: lastMonth,
          weight: 480.0,
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getGrowthData(userId, {})

      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toMatchObject({
        weight: expect.any(Number),
        reptileId: 'reptile-1',
        reptileName: 'Slither',
      })
    })

    it('should filter by reptileId when provided', async () => {
      mockedPrisma.weight.findMany.mockResolvedValue([
        {
          id: 'weight-1',
          date: new Date(),
          weight: 500.5,
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      await service.getGrowthData(userId, { reptileId: 'reptile-1' })

      expect(mockedPrisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reptileId: 'reptile-1',
          }),
        })
      )
    })

    it('should filter by date range when provided', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      mockedPrisma.weight.findMany.mockResolvedValue([])

      await service.getGrowthData(userId, { startDate, endDate })

      expect(mockedPrisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it('should return empty array when no data exists', async () => {
      mockedPrisma.weight.findMany.mockResolvedValue([])

      const result = await service.getGrowthData(userId, {})

      expect(result.data).toEqual([])
    })
  })

  describe('getFeedingStats', () => {
    it('should return feeding statistics with summary', async () => {
      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      mockedPrisma.feeding.findMany.mockResolvedValue([
        {
          id: 'feed-1',
          date: now,
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
        {
          id: 'feed-2',
          date: lastWeek,
          accepted: false,
          refused: true,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
        {
          id: 'feed-3',
          date: lastWeek,
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getFeedingStats(userId, {})

      expect(result.data).toBeDefined()
      expect(result.summary).toMatchObject({
        totalFeedings: 3,
        acceptanceRate: expect.any(Number),
        averageInterval: expect.any(Number),
      })
      expect(result.summary.acceptanceRate).toBeCloseTo(66.67, 1)
    })

    it('should group feedings by date', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      mockedPrisma.feeding.findMany.mockResolvedValue([
        {
          id: 'feed-1',
          date: today,
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
        {
          id: 'feed-2',
          date: today,
          accepted: false,
          refused: true,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getFeedingStats(userId, {})

      // Two feedings on same day should be grouped
      expect(result.data.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by reptileId when provided', async () => {
      mockedPrisma.feeding.findMany.mockResolvedValue([])

      await service.getFeedingStats(userId, { reptileId: 'reptile-1' })

      expect(mockedPrisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reptileId: 'reptile-1',
          }),
        })
      )
    })

    it('should calculate average interval between feedings', async () => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockedPrisma.feeding.findMany.mockResolvedValue([
        {
          id: 'feed-1',
          date: now,
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
        {
          id: 'feed-2',
          date: sevenDaysAgo,
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
        {
          id: 'feed-3',
          date: fourteenDaysAgo,
          accepted: true,
          refused: false,
          regurgitated: false,
          reptile: { id: 'r1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getFeedingStats(userId, {})

      // 14 days total, 2 intervals = 7 days average
      expect(result.summary.averageInterval).toBeCloseTo(7, 0)
    })
  })

  describe('getShedStats', () => {
    it('should return shed data with summary', async () => {
      const now = new Date()
      const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

      mockedPrisma.shed.findMany.mockResolvedValue([
        {
          id: 'shed-1',
          completedDate: now,
          startDate: startDate,
          quality: 'COMPLETE',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getShedStats(userId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject({
        reptileId: 'reptile-1',
        quality: 'COMPLETE',
        durationDays: expect.any(Number),
      })
      expect(result.summary).toMatchObject({
        totalSheds: 1,
        averageInterval: expect.any(Number),
        averageQuality: expect.any(String),
      })
    })

    it('should calculate shed duration correctly', async () => {
      const now = new Date()
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

      mockedPrisma.shed.findMany.mockResolvedValue([
        {
          id: 'shed-1',
          completedDate: now,
          startDate: fiveDaysAgo,
          quality: 'COMPLETE',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getShedStats(userId, {})

      expect(result.data[0].durationDays).toBe(5)
    })

    it('should return null duration when startDate is not set', async () => {
      mockedPrisma.shed.findMany.mockResolvedValue([
        {
          id: 'shed-1',
          completedDate: new Date(),
          startDate: null,
          quality: 'COMPLETE',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getShedStats(userId, {})

      expect(result.data[0].durationDays).toBeNull()
    })

    it('should calculate most common shed quality', async () => {
      mockedPrisma.shed.findMany.mockResolvedValue([
        {
          id: 'shed-1',
          completedDate: new Date(),
          startDate: null,
          quality: 'COMPLETE',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
        {
          id: 'shed-2',
          completedDate: new Date(),
          startDate: null,
          quality: 'COMPLETE',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
        {
          id: 'shed-3',
          completedDate: new Date(),
          startDate: null,
          quality: 'PARTIAL',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getShedStats(userId, {})

      expect(result.summary.averageQuality).toBe('COMPLETE')
    })
  })

  describe('getEnvironmentStats', () => {
    it('should return environment readings with summary', async () => {
      mockedPrisma.environmentLog.findMany.mockResolvedValue([
        {
          id: 'env-1',
          date: new Date(),
          temperature: 85.0,
          humidity: 60.0,
          location: 'Hot Side',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
        {
          id: 'env-2',
          date: new Date(),
          temperature: 75.0,
          humidity: 50.0,
          location: 'Cool Side',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getEnvironmentStats(userId, {})

      expect(result.data).toHaveLength(2)
      expect(result.summary).toMatchObject({
        avgTemp: 80.0,
        avgHumidity: 55.0,
        tempRange: { min: 75.0, max: 85.0 },
        humidityRange: { min: 50.0, max: 60.0 },
      })
    })

    it('should handle missing temperature or humidity', async () => {
      mockedPrisma.environmentLog.findMany.mockResolvedValue([
        {
          id: 'env-1',
          date: new Date(),
          temperature: 85.0,
          humidity: null,
          location: 'Hot Side',
          reptileId: 'reptile-1',
          reptile: { id: 'reptile-1', name: 'Slither', userId },
        },
      ] as never)

      const result = await service.getEnvironmentStats(userId, {})

      expect(result.data).toHaveLength(1)
      expect(result.summary.avgTemp).toBe(85.0)
    })

    it('should filter by reptileId when provided', async () => {
      mockedPrisma.environmentLog.findMany.mockResolvedValue([])

      await service.getEnvironmentStats(userId, { reptileId: 'reptile-1' })

      expect(mockedPrisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reptileId: 'reptile-1',
          }),
        })
      )
    })

    it('should return empty data with zero summary when no logs exist', async () => {
      mockedPrisma.environmentLog.findMany.mockResolvedValue([])

      const result = await service.getEnvironmentStats(userId, {})

      expect(result.data).toEqual([])
      expect(result.summary.avgTemp).toBe(0)
      expect(result.summary.avgHumidity).toBe(0)
    })
  })

  describe('getSummary', () => {
    it('should return key metrics for summary cards', async () => {
      const now = new Date()

      mockedPrisma.reptile.count.mockResolvedValue(5)
      mockedPrisma.feeding.count.mockResolvedValue(20)
      mockedPrisma.shed.count.mockResolvedValue(8)

      mockedPrisma.feeding.findMany.mockResolvedValue([
        {
          id: 'feed-1',
          date: now,
          accepted: true,
          refused: false,
          regurgitated: false,
        },
      ] as never)

      mockedPrisma.shed.findMany.mockResolvedValue([
        {
          id: 'shed-1',
          completedDate: now,
        },
      ] as never)

      const result = await service.getSummary(userId)

      expect(result).toMatchObject({
        totalReptiles: 5,
        totalFeedings: 20,
        totalSheds: 8,
        lastFeeding: expect.any(String),
        lastShed: expect.any(String),
        healthScore: expect.any(Number),
      })
    })

    it('should return null for lastFeeding when no feedings exist', async () => {
      mockedPrisma.reptile.count.mockResolvedValue(1)
      mockedPrisma.feeding.count.mockResolvedValue(0)
      mockedPrisma.shed.count.mockResolvedValue(0)
      mockedPrisma.feeding.findMany.mockResolvedValue([])
      mockedPrisma.shed.findMany.mockResolvedValue([])

      const result = await service.getSummary(userId)

      expect(result.lastFeeding).toBeNull()
      expect(result.lastShed).toBeNull()
    })

    it('should calculate health score based on feeding acceptance', async () => {
      mockedPrisma.reptile.count.mockResolvedValue(1)
      mockedPrisma.feeding.count.mockResolvedValue(10)
      mockedPrisma.shed.count.mockResolvedValue(0)
      mockedPrisma.feeding.findMany.mockResolvedValue([
        { id: 'f1', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f2', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f3', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f4', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f5', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f6', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f7', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f8', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f9', date: new Date(), accepted: true, refused: false, regurgitated: false },
        { id: 'f10', date: new Date(), accepted: false, refused: true, regurgitated: false },
      ] as never)
      mockedPrisma.shed.findMany.mockResolvedValue([])

      const result = await service.getSummary(userId)

      // 90% acceptance should give a high health score
      expect(result.healthScore).toBeGreaterThanOrEqual(80)
    })
  })
})
