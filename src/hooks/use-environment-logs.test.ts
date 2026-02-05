// Tests for use-environment-logs hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module - must be before imports
vi.mock('@/lib/api/environment.api', () => ({
  fetchEnvironmentLogs: vi.fn(),
  createEnvironmentLog: vi.fn(),
  updateEnvironmentLog: vi.fn(),
  deleteEnvironmentLog: vi.fn(),
}))

// Mock the online status hook
vi.mock('./use-online-status', () => ({
  useOnlineStatus: vi.fn(),
}))

// Mock the offline database
vi.mock('@/lib/offline/db', () => ({
  offlineDb: {
    environmentLogs: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      sortBy: vi.fn().mockResolvedValue([]),
      bulkPut: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue('new-id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
    syncQueue: {
      add: vi.fn().mockResolvedValue('sync-id'),
    },
  },
}))

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn().mockReturnValue([]),
}))

// Mock ID generation
vi.mock('@/lib/id', () => ({
  generateId: () => 'generated-id-123',
}))

import {
  useEnvironmentLogs,
  useCreateEnvironmentLog,
  useUpdateEnvironmentLog,
  useDeleteEnvironmentLog,
  environmentKeys,
} from './use-environment-logs'
import { useLiveQuery } from 'dexie-react-hooks'
import { useOnlineStatus } from './use-online-status'
import { offlineDb } from '@/lib/offline/db'
import {
  fetchEnvironmentLogs,
  createEnvironmentLog,
  updateEnvironmentLog,
  deleteEnvironmentLog,
} from '@/lib/api/environment.api'

// Get mocked functions
const mockFetchEnvironmentLogs = fetchEnvironmentLogs as ReturnType<typeof vi.fn>
const mockCreateEnvironmentLog = createEnvironmentLog as ReturnType<typeof vi.fn>
const mockUpdateEnvironmentLog = updateEnvironmentLog as ReturnType<typeof vi.fn>
const mockDeleteEnvironmentLog = deleteEnvironmentLog as ReturnType<typeof vi.fn>
const mockUseOnlineStatus = useOnlineStatus as ReturnType<typeof vi.fn>
const mockOfflineDb = offlineDb as {
  environmentLogs: {
    where: ReturnType<typeof vi.fn>
    equals: ReturnType<typeof vi.fn>
    reverse: ReturnType<typeof vi.fn>
    limit: ReturnType<typeof vi.fn>
    sortBy: ReturnType<typeof vi.fn>
    bulkPut: ReturnType<typeof vi.fn>
    add: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
  }
  syncQueue: {
    add: ReturnType<typeof vi.fn>
  }
}

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

describe('environmentKeys', () => {
  it('should generate correct all key', () => {
    expect(environmentKeys.all).toEqual(['environmentLogs'])
  })

  it('should generate correct lists key', () => {
    expect(environmentKeys.lists()).toEqual(['environmentLogs', 'list'])
  })

  it('should generate correct list key with reptileId and filters', () => {
    const filters = { limit: 10 }
    expect(environmentKeys.list('reptile-1', filters)).toEqual([
      'environmentLogs',
      'list',
      'reptile-1',
      filters,
    ])
  })

  it('should generate correct list key with reptileId only', () => {
    expect(environmentKeys.list('reptile-1')).toEqual([
      'environmentLogs',
      'list',
      'reptile-1',
      {},
    ])
  })

  it('should generate correct details key', () => {
    expect(environmentKeys.details()).toEqual(['environmentLogs', 'detail'])
  })

  it('should generate correct detail key with reptileId and logId', () => {
    expect(environmentKeys.detail('reptile-1', 'log-1')).toEqual([
      'environmentLogs',
      'detail',
      'reptile-1',
      'log-1',
    ])
  })
})

describe('useEnvironmentLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOnlineStatus.mockReturnValue(true)
    ;(useLiveQuery as ReturnType<typeof vi.fn>).mockReturnValue([])
  })

  it('should fetch environment logs when online', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-1', date: '2024-01-15', temperature: 85, humidity: 60 },
        { id: '2', reptileId: 'reptile-1', date: '2024-01-14', temperature: 84, humidity: 58 },
      ],
      meta: { total: 2, page: 1, limit: 50 },
    }
    mockFetchEnvironmentLogs.mockResolvedValue(mockData)

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.logs).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOfflineData).toBe(false)
    expect(mockFetchEnvironmentLogs).toHaveBeenCalledWith('reptile-1', {})
  })

  it('should pass query parameters to fetchEnvironmentLogs', async () => {
    mockFetchEnvironmentLogs.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })
    const query = { limit: 20 }

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1', query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchEnvironmentLogs).toHaveBeenCalledWith('reptile-1', query)
  })

  it('should use offline data when offline', async () => {
    mockUseOnlineStatus.mockReturnValue(false)
    const offlineLogs = [
      { id: '1', reptileId: 'reptile-1', date: 1705276800000, temperature: 85, humidity: 60 },
    ]
    ;(useLiveQuery as ReturnType<typeof vi.fn>).mockReturnValue(offlineLogs)

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1'), {
      wrapper: createWrapper(),
    })

    // Should not fetch from API when offline
    expect(mockFetchEnvironmentLogs).not.toHaveBeenCalled()
    expect(result.current.logs).toEqual(offlineLogs)
    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOfflineData).toBe(true)
  })

  it('should handle fetch errors', async () => {
    mockFetchEnvironmentLogs.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return empty array when no data', async () => {
    mockFetchEnvironmentLogs.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50 } })

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.logs).toEqual([])
  })

  it('should provide refetch function', async () => {
    mockFetchEnvironmentLogs.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50 } })

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })

  it('should sync fetched data to offline database', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-1', date: '2024-01-15T00:00:00.000Z', temperature: 85, humidity: 60, location: 'hot_side', notes: null, isAlert: false, createdAt: '2024-01-15T00:00:00.000Z' },
      ],
      meta: { total: 1, page: 1, limit: 50 },
    }
    mockFetchEnvironmentLogs.mockResolvedValue(mockData)

    const { result } = renderHook(() => useEnvironmentLogs('reptile-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockOfflineDb.environmentLogs.bulkPut).toHaveBeenCalled()
  })
})

describe('useCreateEnvironmentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOnlineStatus.mockReturnValue(true)
  })

  it('should create an environment log when online', async () => {
    const newLog = { id: 'new-log', reptileId: 'reptile-1', date: '2024-01-15', temperature: 85, humidity: 60 }
    mockCreateEnvironmentLog.mockResolvedValue(newLog)

    const { result } = renderHook(() => useCreateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const created = await result.current.mutateAsync({
        date: '2024-01-15',
        temperature: 85,
        humidity: 60,
      })
      expect(created).toEqual(newLog)
    })

    expect(mockCreateEnvironmentLog).toHaveBeenCalledWith('reptile-1', {
      date: '2024-01-15',
      temperature: 85,
      humidity: 60,
    })
  })

  it('should create an offline log when offline', async () => {
    mockUseOnlineStatus.mockReturnValue(false)

    const { result } = renderHook(() => useCreateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        date: '2024-01-15',
        temperature: 85,
        humidity: 60,
      })
    })

    expect(mockCreateEnvironmentLog).not.toHaveBeenCalled()
    expect(mockOfflineDb.environmentLogs.add).toHaveBeenCalled()
    expect(mockOfflineDb.syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'CREATE',
        table: 'environmentLogs',
        status: 'PENDING',
      })
    )
  })

  it('should handle creation errors', async () => {
    mockCreateEnvironmentLog.mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ date: '', temperature: null, humidity: null })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Validation error')
      }
    })
  })

  it('should use provided id when creating offline log', async () => {
    mockUseOnlineStatus.mockReturnValue(false)

    const { result } = renderHook(() => useCreateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        id: 'custom-id',
        date: '2024-01-15',
        temperature: 85,
      })
    })

    expect(mockOfflineDb.environmentLogs.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'custom-id',
      })
    )
  })
})

describe('useUpdateEnvironmentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOnlineStatus.mockReturnValue(true)
  })

  it('should update an environment log when online', async () => {
    const updatedLog = { id: 'log-1', reptileId: 'reptile-1', temperature: 90 }
    mockUpdateEnvironmentLog.mockResolvedValue(updatedLog)

    const { result } = renderHook(() => useUpdateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        logId: 'log-1',
        data: { temperature: 90 },
      })
      expect(updated).toEqual(updatedLog)
    })

    expect(mockUpdateEnvironmentLog).toHaveBeenCalledWith('reptile-1', 'log-1', { temperature: 90 })
  })

  it('should update offline log when offline', async () => {
    mockUseOnlineStatus.mockReturnValue(false)
    mockOfflineDb.environmentLogs.get.mockResolvedValue({ id: 'log-1', temperature: 90 })

    const { result } = renderHook(() => useUpdateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        logId: 'log-1',
        data: { temperature: 90 },
      })
    })

    expect(mockUpdateEnvironmentLog).not.toHaveBeenCalled()
    expect(mockOfflineDb.environmentLogs.update).toHaveBeenCalled()
    expect(mockOfflineDb.syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'UPDATE',
        table: 'environmentLogs',
        recordId: 'log-1',
        status: 'PENDING',
      })
    )
  })

  it('should handle update errors', async () => {
    mockUpdateEnvironmentLog.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          logId: 'log-1',
          data: { temperature: 90 },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })

  it('should update all supported fields when offline', async () => {
    mockUseOnlineStatus.mockReturnValue(false)
    mockOfflineDb.environmentLogs.get.mockResolvedValue({ id: 'log-1' })

    const { result } = renderHook(() => useUpdateEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        logId: 'log-1',
        data: {
          date: '2024-01-20',
          temperature: 88,
          humidity: 65,
          location: 'cool_side',
          notes: 'Updated notes',
        },
      })
    })

    expect(mockOfflineDb.environmentLogs.update).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({
        _syncStatus: 'pending',
        _lastModified: expect.any(Number),
      })
    )
  })
})

describe('useDeleteEnvironmentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOnlineStatus.mockReturnValue(true)
  })

  it('should delete an environment log when online', async () => {
    const deleteResult = { id: 'log-1', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeleteEnvironmentLog.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeleteEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('log-1')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeleteEnvironmentLog).toHaveBeenCalledWith('reptile-1', 'log-1')
  })

  it('should delete offline log when offline', async () => {
    mockUseOnlineStatus.mockReturnValue(false)

    const { result } = renderHook(() => useDeleteEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('log-1')
      expect(deleted).toEqual(expect.objectContaining({ id: 'log-1' }))
    })

    expect(mockDeleteEnvironmentLog).not.toHaveBeenCalled()
    expect(mockOfflineDb.environmentLogs.delete).toHaveBeenCalledWith('log-1')
    expect(mockOfflineDb.syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'DELETE',
        table: 'environmentLogs',
        recordId: 'log-1',
        payload: null,
        status: 'PENDING',
      })
    )
  })

  it('should handle delete errors', async () => {
    mockDeleteEnvironmentLog.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteEnvironmentLog('reptile-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('log-1')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})
