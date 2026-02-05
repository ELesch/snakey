// Tests for use-dashboard hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchDashboardStats = vi.fn()
const mockFetchRecentActivity = vi.fn()
const mockFetchUpcomingFeedings = vi.fn()
const mockFetchEnvironmentAlerts = vi.fn()

vi.mock('@/lib/api/dashboard.api', () => ({
  fetchDashboardStats: (...args: unknown[]) => mockFetchDashboardStats(...args),
  fetchRecentActivity: (...args: unknown[]) => mockFetchRecentActivity(...args),
  fetchUpcomingFeedings: (...args: unknown[]) => mockFetchUpcomingFeedings(...args),
  fetchEnvironmentAlerts: (...args: unknown[]) => mockFetchEnvironmentAlerts(...args),
}))

import {
  useDashboardStats,
  useRecentActivity,
  useUpcomingFeedings,
  useEnvironmentAlerts,
  dashboardKeys,
} from './use-dashboard'

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

describe('dashboardKeys', () => {
  it('should generate correct all key', () => {
    expect(dashboardKeys.all).toEqual(['dashboard'])
  })

  it('should generate correct stats key', () => {
    expect(dashboardKeys.stats()).toEqual(['dashboard', 'stats'])
  })

  it('should generate correct activity key with limit', () => {
    expect(dashboardKeys.activity(5)).toEqual(['dashboard', 'activity', 5])
  })

  it('should generate correct activity key without limit', () => {
    expect(dashboardKeys.activity()).toEqual(['dashboard', 'activity', undefined])
  })

  it('should generate correct feedings key with days', () => {
    expect(dashboardKeys.feedings(7)).toEqual(['dashboard', 'feedings', 7])
  })

  it('should generate correct feedings key without days', () => {
    expect(dashboardKeys.feedings()).toEqual(['dashboard', 'feedings', undefined])
  })

  it('should generate correct alerts key', () => {
    expect(dashboardKeys.alerts()).toEqual(['dashboard', 'alerts'])
  })
})

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch dashboard stats on mount', async () => {
    const mockStats = {
      totalReptiles: 5,
      activeReptiles: 4,
      pendingFeedings: 2,
      recentSheds: 1,
    }
    mockFetchDashboardStats.mockResolvedValue(mockStats)

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    // Initially pending
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(mockFetchDashboardStats).toHaveBeenCalledTimes(1)
  })

  it('should handle fetch errors', async () => {
    const mockError = new Error('Network error')
    mockFetchDashboardStats.mockRejectedValue(mockError)

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.stats).toBeUndefined()
  })

  it('should return undefined stats when no data', async () => {
    mockFetchDashboardStats.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.stats).toBeUndefined()
  })

  it('should provide refetch function', async () => {
    mockFetchDashboardStats.mockResolvedValue({ totalReptiles: 0 })

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useRecentActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch recent activity with default limit', async () => {
    const mockActivity = [
      { id: '1', type: 'feeding', date: '2024-01-15', description: 'Fed Monty' },
      { id: '2', type: 'shed', date: '2024-01-14', description: 'Monty shed' },
    ]
    mockFetchRecentActivity.mockResolvedValue(mockActivity)

    const { result } = renderHook(() => useRecentActivity(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.activity).toEqual(mockActivity)
    expect(mockFetchRecentActivity).toHaveBeenCalledWith(10) // default limit
  })

  it('should fetch recent activity with custom limit', async () => {
    const mockActivity = [{ id: '1', type: 'feeding', date: '2024-01-15' }]
    mockFetchRecentActivity.mockResolvedValue(mockActivity)

    const { result } = renderHook(() => useRecentActivity(5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchRecentActivity).toHaveBeenCalledWith(5)
  })

  it('should handle fetch errors', async () => {
    mockFetchRecentActivity.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useRecentActivity(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.activity).toBeUndefined()
  })

  it('should return empty activity array when no data', async () => {
    mockFetchRecentActivity.mockResolvedValue([])

    const { result } = renderHook(() => useRecentActivity(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.activity).toEqual([])
  })

  it('should provide refetch function', async () => {
    mockFetchRecentActivity.mockResolvedValue([])

    const { result } = renderHook(() => useRecentActivity(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useUpcomingFeedings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch upcoming feedings with default days', async () => {
    const mockFeedings = [
      { id: '1', reptileId: 'reptile-1', dueDate: '2024-01-20', reptileName: 'Monty' },
      { id: '2', reptileId: 'reptile-2', dueDate: '2024-01-21', reptileName: 'Slinky' },
    ]
    mockFetchUpcomingFeedings.mockResolvedValue(mockFeedings)

    const { result } = renderHook(() => useUpcomingFeedings(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.feedings).toEqual(mockFeedings)
    expect(mockFetchUpcomingFeedings).toHaveBeenCalledWith(7) // default days
  })

  it('should fetch upcoming feedings with custom days', async () => {
    mockFetchUpcomingFeedings.mockResolvedValue([])

    const { result } = renderHook(() => useUpcomingFeedings(14), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchUpcomingFeedings).toHaveBeenCalledWith(14)
  })

  it('should handle fetch errors', async () => {
    mockFetchUpcomingFeedings.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useUpcomingFeedings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return empty feedings array when no data', async () => {
    mockFetchUpcomingFeedings.mockResolvedValue([])

    const { result } = renderHook(() => useUpcomingFeedings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.feedings).toEqual([])
  })

  it('should provide refetch function', async () => {
    mockFetchUpcomingFeedings.mockResolvedValue([])

    const { result } = renderHook(() => useUpcomingFeedings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useEnvironmentAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch environment alerts on mount', async () => {
    const mockAlerts = [
      { id: '1', reptileId: 'reptile-1', type: 'high_temp', message: 'Temperature too high' },
      { id: '2', reptileId: 'reptile-2', type: 'low_humidity', message: 'Humidity too low' },
    ]
    mockFetchEnvironmentAlerts.mockResolvedValue(mockAlerts)

    const { result } = renderHook(() => useEnvironmentAlerts(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.alerts).toEqual(mockAlerts)
    expect(mockFetchEnvironmentAlerts).toHaveBeenCalledTimes(1)
  })

  it('should handle fetch errors', async () => {
    mockFetchEnvironmentAlerts.mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useEnvironmentAlerts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return empty alerts array when no data', async () => {
    mockFetchEnvironmentAlerts.mockResolvedValue([])

    const { result } = renderHook(() => useEnvironmentAlerts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.alerts).toEqual([])
  })

  it('should provide refetch function', async () => {
    mockFetchEnvironmentAlerts.mockResolvedValue([])

    const { result } = renderHook(() => useEnvironmentAlerts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})
