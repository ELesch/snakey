// Tests for use-feedings hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchFeedings = vi.fn()
const mockCreateFeeding = vi.fn()
const mockUpdateFeeding = vi.fn()
const mockDeleteFeeding = vi.fn()

vi.mock('@/lib/api/feeding.api', () => ({
  fetchFeedings: (...args: unknown[]) => mockFetchFeedings(...args),
  createFeeding: (...args: unknown[]) => mockCreateFeeding(...args),
  updateFeeding: (...args: unknown[]) => mockUpdateFeeding(...args),
  deleteFeeding: (...args: unknown[]) => mockDeleteFeeding(...args),
}))

// Mock the online status hook
const mockIsOnline = vi.fn()
vi.mock('./use-online-status', () => ({
  useOnlineStatus: () => mockIsOnline(),
}))

// Create mock objects that will be used inside vi.mock
const createMockFeedings = () => ({
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  reverse: vi.fn().mockReturnThis(),
  sortBy: vi.fn().mockResolvedValue([]),
  bulkPut: vi.fn().mockResolvedValue(undefined),
  add: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
})

const createMockSyncQueue = () => ({
  add: vi.fn().mockResolvedValue(undefined),
})

// Store references for tests
let mockFeedings = createMockFeedings()
let mockSyncQueue = createMockSyncQueue()

vi.mock('@/lib/offline/db', () => ({
  offlineDb: {
    get feedings() {
      return mockFeedings
    },
    get syncQueue() {
      return mockSyncQueue
    },
  },
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => [],
}))

import {
  useFeedings,
  useCreateFeeding,
  useUpdateFeeding,
  useDeleteFeeding,
  feedingKeys,
} from './use-feedings'

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

describe('feedingKeys', () => {
  it('should generate correct all key', () => {
    expect(feedingKeys.all).toEqual(['feedings'])
  })

  it('should generate correct lists key', () => {
    expect(feedingKeys.lists()).toEqual(['feedings', 'list'])
  })

  it('should generate correct list key with reptileId', () => {
    expect(feedingKeys.list('reptile-123')).toEqual([
      'feedings',
      'list',
      'reptile-123',
      {},
    ])
  })

  it('should generate correct list key with reptileId and filters', () => {
    expect(feedingKeys.list('reptile-123', { limit: 10 })).toEqual([
      'feedings',
      'list',
      'reptile-123',
      { limit: 10 },
    ])
  })

  it('should generate correct detail key', () => {
    expect(feedingKeys.detail('reptile-123', 'feeding-456')).toEqual([
      'feedings',
      'detail',
      'reptile-123',
      'feeding-456',
    ])
  })
})

describe('useFeedings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockFeedings = createMockFeedings()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should fetch feedings when online', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-123', preyType: 'Mouse', date: new Date().toISOString() },
        { id: '2', reptileId: 'reptile-123', preyType: 'Rat', date: new Date().toISOString() },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    mockFetchFeedings.mockResolvedValue(mockData)

    const { result } = renderHook(() => useFeedings('reptile-123'), {
      wrapper: createWrapper(),
    })

    // Initially pending
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.feedings).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(mockFetchFeedings).toHaveBeenCalledWith('reptile-123', {})
  })

  it('should pass query parameters to fetchFeedings', async () => {
    mockFetchFeedings.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })
    const query = { limit: 10 }

    const { result } = renderHook(() => useFeedings('reptile-123', query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchFeedings).toHaveBeenCalledWith('reptile-123', query)
  })

  it('should return isOnline status', async () => {
    mockFetchFeedings.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })

    const { result } = renderHook(() => useFeedings('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('should indicate offline data when offline', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useFeedings('reptile-123'), {
      wrapper: createWrapper(),
    })

    // When offline, query is disabled
    expect(result.current.isOfflineData).toBe(true)
    expect(mockFetchFeedings).not.toHaveBeenCalled()
  })

  it('should handle fetch errors', async () => {
    mockFetchFeedings.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFeedings('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should not fetch when reptileId is empty', async () => {
    const { result } = renderHook(() => useFeedings(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchFeedings).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })
})

describe('useCreateFeeding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockFeedings = createMockFeedings()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should create a feeding when online', async () => {
    const newFeeding = {
      id: 'new-feeding',
      reptileId: 'reptile-123',
      preyType: 'Mouse',
      preySize: 'Adult',
      preySource: 'frozen',
      date: new Date().toISOString(),
      accepted: true,
    }
    mockCreateFeeding.mockResolvedValue(newFeeding)

    const { result } = renderHook(() => useCreateFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const created = await result.current.mutateAsync({
        preyType: 'Mouse',
        preySize: 'Adult',
        preySource: 'frozen',
        date: new Date().toISOString(),
        accepted: true,
      })
      expect(created).toEqual(newFeeding)
    })

    expect(mockCreateFeeding).toHaveBeenCalledWith('reptile-123', expect.objectContaining({
      preyType: 'Mouse',
      preySize: 'Adult',
    }))
  })

  it('should create feeding offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useCreateFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    const feedingData = {
      preyType: 'Mouse',
      preySize: 'Adult',
      preySource: 'frozen',
      date: new Date().toISOString(),
      accepted: true,
    }

    await act(async () => {
      await result.current.mutateAsync(feedingData)
    })

    // Should add to offline DB and sync queue
    expect(mockFeedings.add).toHaveBeenCalled()
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'CREATE',
      table: 'feedings',
      status: 'PENDING',
    }))
    expect(mockCreateFeeding).not.toHaveBeenCalled()
  })

  it('should handle creation errors', async () => {
    mockCreateFeeding.mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          preyType: '',
          preySize: 'Adult',
          preySource: 'frozen',
          date: new Date().toISOString(),
          accepted: true,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Validation error')
      }
    })
  })
})

describe('useUpdateFeeding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockFeedings = createMockFeedings()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should update a feeding when online', async () => {
    const updatedFeeding = {
      id: 'feeding-123',
      reptileId: 'reptile-123',
      preyType: 'Rat',
      accepted: true,
    }
    mockUpdateFeeding.mockResolvedValue(updatedFeeding)

    const { result } = renderHook(() => useUpdateFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        feedingId: 'feeding-123',
        data: { preyType: 'Rat' },
      })
      expect(updated).toEqual(updatedFeeding)
    })

    expect(mockUpdateFeeding).toHaveBeenCalledWith('reptile-123', 'feeding-123', { preyType: 'Rat' })
  })

  it('should update feeding offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)
    mockFeedings.get.mockResolvedValue({ id: 'feeding-123', preyType: 'Rat' })

    const { result } = renderHook(() => useUpdateFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        feedingId: 'feeding-123',
        data: { preyType: 'Rat' },
      })
    })

    expect(mockFeedings.update).toHaveBeenCalledWith('feeding-123', expect.objectContaining({
      preyType: 'Rat',
      _syncStatus: 'pending',
    }))
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'UPDATE',
      table: 'feedings',
      recordId: 'feeding-123',
    }))
    expect(mockUpdateFeeding).not.toHaveBeenCalled()
  })

  it('should handle update errors', async () => {
    mockUpdateFeeding.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          feedingId: 'feeding-123',
          data: { preyType: 'Rat' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })
})

describe('useDeleteFeeding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockFeedings = createMockFeedings()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should delete a feeding when online', async () => {
    const deleteResult = { id: 'feeding-123', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeleteFeeding.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeleteFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('feeding-123')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeleteFeeding).toHaveBeenCalledWith('reptile-123', 'feeding-123')
  })

  it('should delete feeding offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useDeleteFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const result2 = await result.current.mutateAsync('feeding-123')
      expect(result2).toEqual({ id: 'feeding-123', deletedAt: expect.any(String) })
    })

    expect(mockFeedings.delete).toHaveBeenCalledWith('feeding-123')
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'DELETE',
      table: 'feedings',
      recordId: 'feeding-123',
    }))
    expect(mockDeleteFeeding).not.toHaveBeenCalled()
  })

  it('should handle delete errors', async () => {
    mockDeleteFeeding.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteFeeding('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('feeding-123')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})
