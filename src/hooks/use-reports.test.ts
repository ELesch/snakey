// Tests for use-reports hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchGrowthData = vi.fn()
const mockFetchFeedingStats = vi.fn()
const mockFetchShedStats = vi.fn()
const mockFetchEnvironmentStats = vi.fn()
const mockFetchReportsSummary = vi.fn()

vi.mock('@/lib/api/reports.api', () => ({
  fetchGrowthData: (...args: unknown[]) => mockFetchGrowthData(...args),
  fetchFeedingStats: (...args: unknown[]) => mockFetchFeedingStats(...args),
  fetchShedStats: (...args: unknown[]) => mockFetchShedStats(...args),
  fetchEnvironmentStats: (...args: unknown[]) => mockFetchEnvironmentStats(...args),
  fetchReportsSummary: (...args: unknown[]) => mockFetchReportsSummary(...args),
}))

import {
  useGrowthData,
  useFeedingStats,
  useShedStats,
  useEnvironmentStats,
  useReportsSummary,
  reportsKeys,
} from './use-reports'

// Create a wrapper component for the QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('reportsKeys', () => {
  it('should generate correct all key', () => {
    expect(reportsKeys.all).toEqual(['reports'])
  })

  it('should generate correct growth key with filters', () => {
    const filters = { reptileId: 'reptile-1', startDate: '2024-01-01' }
    expect(reportsKeys.growth(filters)).toEqual(['reports', 'growth', filters])
  })

  it('should generate correct growth key without filters', () => {
    expect(reportsKeys.growth()).toEqual(['reports', 'growth', undefined])
  })

  it('should generate correct feedings key with filters', () => {
    const filters = { reptileId: 'reptile-1' }
    expect(reportsKeys.feedings(filters)).toEqual(['reports', 'feedings', filters])
  })

  it('should generate correct sheds key with filters', () => {
    const filters = { reptileId: 'reptile-1' }
    expect(reportsKeys.sheds(filters)).toEqual(['reports', 'sheds', filters])
  })

  it('should generate correct environment key with filters', () => {
    const filters = { reptileId: 'reptile-1' }
    expect(reportsKeys.environment(filters)).toEqual(['reports', 'environment', filters])
  })

  it('should generate correct summary key', () => {
    expect(reportsKeys.summary()).toEqual(['reports', 'summary'])
  })
})

describe('useGrowthData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch growth data on mount', async () => {
    const mockData = [
      { date: '2024-01-01', weight: 150, length: 60 },
      { date: '2024-01-15', weight: 155, length: 62 },
    ]
    mockFetchGrowthData.mockResolvedValue(mockData)

    const { result } = renderHook(() => useGrowthData(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.growthData).toEqual(mockData)
    expect(mockFetchGrowthData).toHaveBeenCalledWith({})
  })

  it('should pass filters to fetchGrowthData', async () => {
    mockFetchGrowthData.mockResolvedValue([])
    const filters = { reptileId: 'reptile-1', startDate: '2024-01-01' }

    const { result } = renderHook(() => useGrowthData(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchGrowthData).toHaveBeenCalledWith(filters)
  })

  it('should handle fetch errors', async () => {
    mockFetchGrowthData.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useGrowthData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.growthData).toBeUndefined()
  })

  it('should return empty array when no data', async () => {
    mockFetchGrowthData.mockResolvedValue([])

    const { result } = renderHook(() => useGrowthData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.growthData).toEqual([])
  })

  it('should provide refetch function', async () => {
    mockFetchGrowthData.mockResolvedValue([])

    const { result } = renderHook(() => useGrowthData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useFeedingStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch feeding stats on mount', async () => {
    const mockData = {
      data: [
        { date: '2024-01-01', count: 5, accepted: 4, refused: 1 },
        { date: '2024-01-08', count: 6, accepted: 6, refused: 0 },
      ],
      summary: {
        totalFeedings: 11,
        acceptedCount: 10,
        refusedCount: 1,
        acceptanceRate: 0.91,
      },
    }
    mockFetchFeedingStats.mockResolvedValue(mockData)

    const { result } = renderHook(() => useFeedingStats(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.feedingData).toEqual(mockData.data)
    expect(result.current.feedingSummary).toEqual(mockData.summary)
    expect(mockFetchFeedingStats).toHaveBeenCalledWith({})
  })

  it('should pass filters to fetchFeedingStats', async () => {
    mockFetchFeedingStats.mockResolvedValue({ data: [], summary: {} })
    const filters = { reptileId: 'reptile-1' }

    const { result } = renderHook(() => useFeedingStats(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchFeedingStats).toHaveBeenCalledWith(filters)
  })

  it('should handle fetch errors', async () => {
    mockFetchFeedingStats.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useFeedingStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return undefined when no data', async () => {
    mockFetchFeedingStats.mockResolvedValue(undefined)

    const { result } = renderHook(() => useFeedingStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.feedingData).toBeUndefined()
    expect(result.current.feedingSummary).toBeUndefined()
  })

  it('should provide refetch function', async () => {
    mockFetchFeedingStats.mockResolvedValue({ data: [], summary: {} })

    const { result } = renderHook(() => useFeedingStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useShedStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch shed stats on mount', async () => {
    const mockData = {
      data: [
        { date: '2024-01-01', quality: 'good', isComplete: true },
        { date: '2024-01-20', quality: 'fair', isComplete: false },
      ],
      summary: {
        totalSheds: 2,
        completeCount: 1,
        averageInterval: 19,
      },
    }
    mockFetchShedStats.mockResolvedValue(mockData)

    const { result } = renderHook(() => useShedStats(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.shedData).toEqual(mockData.data)
    expect(result.current.shedSummary).toEqual(mockData.summary)
    expect(mockFetchShedStats).toHaveBeenCalledWith({})
  })

  it('should pass filters to fetchShedStats', async () => {
    mockFetchShedStats.mockResolvedValue({ data: [], summary: {} })
    const filters = { reptileId: 'reptile-1' }

    const { result } = renderHook(() => useShedStats(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchShedStats).toHaveBeenCalledWith(filters)
  })

  it('should handle fetch errors', async () => {
    mockFetchShedStats.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useShedStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return undefined when no data', async () => {
    mockFetchShedStats.mockResolvedValue(undefined)

    const { result } = renderHook(() => useShedStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.shedData).toBeUndefined()
    expect(result.current.shedSummary).toBeUndefined()
  })

  it('should provide refetch function', async () => {
    mockFetchShedStats.mockResolvedValue({ data: [], summary: {} })

    const { result } = renderHook(() => useShedStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useEnvironmentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch environment stats on mount', async () => {
    const mockData = {
      data: [
        { date: '2024-01-01', avgTemp: 85, avgHumidity: 60 },
        { date: '2024-01-02', avgTemp: 86, avgHumidity: 58 },
      ],
      summary: {
        avgTemperature: 85.5,
        avgHumidity: 59,
        alertCount: 2,
      },
    }
    mockFetchEnvironmentStats.mockResolvedValue(mockData)

    const { result } = renderHook(() => useEnvironmentStats(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.environmentData).toEqual(mockData.data)
    expect(result.current.environmentSummary).toEqual(mockData.summary)
    expect(mockFetchEnvironmentStats).toHaveBeenCalledWith({})
  })

  it('should pass filters to fetchEnvironmentStats', async () => {
    mockFetchEnvironmentStats.mockResolvedValue({ data: [], summary: {} })
    const filters = { reptileId: 'reptile-1' }

    const { result } = renderHook(() => useEnvironmentStats(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchEnvironmentStats).toHaveBeenCalledWith(filters)
  })

  it('should handle fetch errors', async () => {
    mockFetchEnvironmentStats.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useEnvironmentStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return undefined when no data', async () => {
    mockFetchEnvironmentStats.mockResolvedValue(undefined)

    const { result } = renderHook(() => useEnvironmentStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.environmentData).toBeUndefined()
    expect(result.current.environmentSummary).toBeUndefined()
  })

  it('should provide refetch function', async () => {
    mockFetchEnvironmentStats.mockResolvedValue({ data: [], summary: {} })

    const { result } = renderHook(() => useEnvironmentStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useReportsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch reports summary on mount', async () => {
    const mockSummary = {
      totalReptiles: 5,
      totalFeedings: 100,
      totalSheds: 20,
      totalWeightRecords: 50,
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31',
      },
    }
    mockFetchReportsSummary.mockResolvedValue(mockSummary)

    const { result } = renderHook(() => useReportsSummary(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.summary).toEqual(mockSummary)
    expect(mockFetchReportsSummary).toHaveBeenCalledTimes(1)
  })

  it('should handle fetch errors', async () => {
    mockFetchReportsSummary.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useReportsSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.summary).toBeUndefined()
  })

  it('should return undefined when no data', async () => {
    mockFetchReportsSummary.mockResolvedValue(undefined)

    const { result } = renderHook(() => useReportsSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.summary).toBeUndefined()
  })

  it('should provide refetch function', async () => {
    mockFetchReportsSummary.mockResolvedValue({})

    const { result } = renderHook(() => useReportsSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})
