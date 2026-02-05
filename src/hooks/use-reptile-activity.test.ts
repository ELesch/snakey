// Tests for useReptileActivity hook
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReptileActivity } from './use-reptile-activity'

// Mock the hooks
const mockUseFeedings = vi.fn()
const mockUseSheds = vi.fn()

vi.mock('@/hooks', () => ({
  useFeedings: (...args: unknown[]) => mockUseFeedings(...args),
  useSheds: (...args: unknown[]) => mockUseSheds(...args),
}))

describe('useReptileActivity', () => {
  const testReptileId = 'reptile-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation - empty arrays, not pending
    mockUseFeedings.mockReturnValue({
      feedings: [],
      isPending: false,
    })
    mockUseSheds.mockReturnValue({
      sheds: [],
      isPending: false,
    })
  })

  describe('initialization', () => {
    it('should return empty activities when no feedings or sheds exist', () => {
      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities).toEqual([])
      expect(result.current.isPending).toBe(false)
    })

    it('should call useFeedings with the reptileId', () => {
      renderHook(() => useReptileActivity(testReptileId))

      expect(mockUseFeedings).toHaveBeenCalledWith(testReptileId)
    })

    it('should call useSheds with the reptileId', () => {
      renderHook(() => useReptileActivity(testReptileId))

      expect(mockUseSheds).toHaveBeenCalledWith(testReptileId)
    })
  })

  describe('isPending state', () => {
    it('should show isPending as true when feedings are loading', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [],
        isPending: true,
      })
      mockUseSheds.mockReturnValue({
        sheds: [],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.isPending).toBe(true)
    })

    it('should show isPending as true when sheds are loading', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [],
        isPending: false,
      })
      mockUseSheds.mockReturnValue({
        sheds: [],
        isPending: true,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.isPending).toBe(true)
    })

    it('should show isPending as true when both are loading', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [],
        isPending: true,
      })
      mockUseSheds.mockReturnValue({
        sheds: [],
        isPending: true,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.isPending).toBe(true)
    })

    it('should show isPending as false when both are loaded', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [],
        isPending: false,
      })
      mockUseSheds.mockReturnValue({
        sheds: [],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.isPending).toBe(false)
    })
  })

  describe('combining events', () => {
    it('should convert feeding events correctly', () => {
      const mockFeeding = {
        id: 'feeding-1',
        date: new Date('2024-01-15'),
        preyType: 'Mouse',
        preySize: 'Adult',
        accepted: true,
      }

      mockUseFeedings.mockReturnValue({
        feedings: [mockFeeding],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities).toHaveLength(1)
      expect(result.current.activities[0]).toMatchObject({
        id: 'feeding-1',
        type: 'feeding',
        description: 'Mouse (Adult)',
      })
    })

    it('should include refused status in feeding description', () => {
      const mockFeeding = {
        id: 'feeding-1',
        date: new Date('2024-01-15'),
        preyType: 'Mouse',
        preySize: 'Adult',
        accepted: false,
      }

      mockUseFeedings.mockReturnValue({
        feedings: [mockFeeding],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].description).toBe('Mouse (Adult) - refused')
    })

    it('should convert shed events correctly', () => {
      const mockShed = {
        id: 'shed-1',
        completedDate: new Date('2024-01-15'),
        quality: 'good',
        isComplete: true,
      }

      mockUseSheds.mockReturnValue({
        sheds: [mockShed],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities).toHaveLength(1)
      expect(result.current.activities[0]).toMatchObject({
        id: 'shed-1',
        type: 'shed',
        description: 'good shed',
      })
    })

    it('should include incomplete status in shed description', () => {
      const mockShed = {
        id: 'shed-1',
        completedDate: new Date('2024-01-15'),
        quality: 'fair',
        isComplete: false,
      }

      mockUseSheds.mockReturnValue({
        sheds: [mockShed],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].description).toBe('fair shed (incomplete)')
    })

    it('should combine feeding and shed events', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [
          { id: 'feeding-1', date: new Date('2024-01-15'), preyType: 'Mouse', preySize: 'Adult', accepted: true },
        ],
        isPending: false,
      })
      mockUseSheds.mockReturnValue({
        sheds: [
          { id: 'shed-1', completedDate: new Date('2024-01-10'), quality: 'good', isComplete: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities).toHaveLength(2)
      expect(result.current.activities.find(a => a.type === 'feeding')).toBeDefined()
      expect(result.current.activities.find(a => a.type === 'shed')).toBeDefined()
    })
  })

  describe('sorting', () => {
    it('should sort events by date descending (most recent first)', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [
          { id: 'feeding-1', date: new Date('2024-01-10'), preyType: 'Mouse', preySize: 'Adult', accepted: true },
          { id: 'feeding-2', date: new Date('2024-01-20'), preyType: 'Rat', preySize: 'Small', accepted: true },
        ],
        isPending: false,
      })
      mockUseSheds.mockReturnValue({
        sheds: [
          { id: 'shed-1', completedDate: new Date('2024-01-15'), quality: 'good', isComplete: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].id).toBe('feeding-2') // Jan 20
      expect(result.current.activities[1].id).toBe('shed-1')     // Jan 15
      expect(result.current.activities[2].id).toBe('feeding-1') // Jan 10
    })
  })

  describe('limit parameter', () => {
    it('should use default limit of 5', () => {
      const manyFeedings = Array.from({ length: 10 }, (_, i) => ({
        id: `feeding-${i}`,
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        preyType: 'Mouse',
        preySize: 'Adult',
        accepted: true,
      }))

      mockUseFeedings.mockReturnValue({
        feedings: manyFeedings,
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities).toHaveLength(5)
    })

    it('should respect custom limit parameter', () => {
      const manyFeedings = Array.from({ length: 10 }, (_, i) => ({
        id: `feeding-${i}`,
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        preyType: 'Mouse',
        preySize: 'Adult',
        accepted: true,
      }))

      mockUseFeedings.mockReturnValue({
        feedings: manyFeedings,
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId, 3))

      expect(result.current.activities).toHaveLength(3)
    })

    it('should return fewer items if data is less than limit', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [
          { id: 'feeding-1', date: new Date('2024-01-10'), preyType: 'Mouse', preySize: 'Adult', accepted: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId, 10))

      expect(result.current.activities).toHaveLength(1)
    })
  })

  describe('date parsing', () => {
    it('should handle Date objects for feeding dates', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [
          { id: 'feeding-1', date: new Date('2024-01-15'), preyType: 'Mouse', preySize: 'Adult', accepted: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].date).toBeInstanceOf(Date)
      expect(result.current.activities[0].date.toISOString()).toContain('2024-01-15')
    })

    it('should handle timestamp numbers for feeding dates', () => {
      const timestamp = new Date('2024-01-15').getTime()
      mockUseFeedings.mockReturnValue({
        feedings: [
          { id: 'feeding-1', date: timestamp, preyType: 'Mouse', preySize: 'Adult', accepted: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].date).toBeInstanceOf(Date)
      expect(result.current.activities[0].date.getTime()).toBe(timestamp)
    })

    it('should handle ISO string dates for feeding dates', () => {
      mockUseFeedings.mockReturnValue({
        feedings: [
          { id: 'feeding-1', date: '2024-01-15T00:00:00.000Z', preyType: 'Mouse', preySize: 'Adult', accepted: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].date).toBeInstanceOf(Date)
      expect(result.current.activities[0].date.toISOString()).toContain('2024-01-15')
    })

    it('should handle Date objects for shed completedDate', () => {
      mockUseSheds.mockReturnValue({
        sheds: [
          { id: 'shed-1', completedDate: new Date('2024-01-15'), quality: 'good', isComplete: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].date).toBeInstanceOf(Date)
      expect(result.current.activities[0].date.toISOString()).toContain('2024-01-15')
    })

    it('should handle timestamp numbers for shed completedDate', () => {
      const timestamp = new Date('2024-01-15').getTime()
      mockUseSheds.mockReturnValue({
        sheds: [
          { id: 'shed-1', completedDate: timestamp, quality: 'good', isComplete: true },
        ],
        isPending: false,
      })

      const { result } = renderHook(() => useReptileActivity(testReptileId))

      expect(result.current.activities[0].date).toBeInstanceOf(Date)
      expect(result.current.activities[0].date.getTime()).toBe(timestamp)
    })
  })
})
