// Tests for use-sheds hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchSheds = vi.fn()
const mockCreateShed = vi.fn()
const mockUpdateShed = vi.fn()
const mockDeleteShed = vi.fn()

vi.mock('@/lib/api/shed.api', () => ({
  fetchSheds: (...args: unknown[]) => mockFetchSheds(...args),
  createShed: (...args: unknown[]) => mockCreateShed(...args),
  updateShed: (...args: unknown[]) => mockUpdateShed(...args),
  deleteShed: (...args: unknown[]) => mockDeleteShed(...args),
}))

// Mock the online status hook
const mockIsOnline = vi.fn()
vi.mock('./use-online-status', () => ({
  useOnlineStatus: () => mockIsOnline(),
}))

// Create mock objects that will be used inside vi.mock
const createMockSheds = () => ({
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
let mockSheds = createMockSheds()
let mockSyncQueue = createMockSyncQueue()

vi.mock('@/lib/offline/db', () => ({
  offlineDb: {
    get sheds() {
      return mockSheds
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
  useSheds,
  useCreateShed,
  useUpdateShed,
  useDeleteShed,
  shedKeys,
} from './use-sheds'

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

describe('shedKeys', () => {
  it('should generate correct all key', () => {
    expect(shedKeys.all).toEqual(['sheds'])
  })

  it('should generate correct lists key', () => {
    expect(shedKeys.lists()).toEqual(['sheds', 'list'])
  })

  it('should generate correct list key with reptileId', () => {
    expect(shedKeys.list('reptile-123')).toEqual([
      'sheds',
      'list',
      'reptile-123',
      {},
    ])
  })

  it('should generate correct list key with reptileId and filters', () => {
    expect(shedKeys.list('reptile-123', { limit: 10 })).toEqual([
      'sheds',
      'list',
      'reptile-123',
      { limit: 10 },
    ])
  })

  it('should generate correct detail key', () => {
    expect(shedKeys.detail('reptile-123', 'shed-456')).toEqual([
      'sheds',
      'detail',
      'reptile-123',
      'shed-456',
    ])
  })
})

describe('useSheds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockSheds = createMockSheds()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should fetch sheds when online', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-123', quality: 'good', completedDate: new Date().toISOString() },
        { id: '2', reptileId: 'reptile-123', quality: 'fair', completedDate: new Date().toISOString() },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    mockFetchSheds.mockResolvedValue(mockData)

    const { result } = renderHook(() => useSheds('reptile-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.sheds).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(mockFetchSheds).toHaveBeenCalledWith('reptile-123', {})
  })

  it('should pass query parameters to fetchSheds', async () => {
    mockFetchSheds.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })
    const query = { limit: 10 }

    const { result } = renderHook(() => useSheds('reptile-123', query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchSheds).toHaveBeenCalledWith('reptile-123', query)
  })

  it('should return isOnline status', async () => {
    mockFetchSheds.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })

    const { result } = renderHook(() => useSheds('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('should indicate offline data when offline', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useSheds('reptile-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isOfflineData).toBe(true)
    expect(mockFetchSheds).not.toHaveBeenCalled()
  })

  it('should handle fetch errors', async () => {
    mockFetchSheds.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSheds('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should not fetch when reptileId is empty', async () => {
    const { result } = renderHook(() => useSheds(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchSheds).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })
})

describe('useCreateShed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockSheds = createMockSheds()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should create a shed when online', async () => {
    const newShed = {
      id: 'new-shed',
      reptileId: 'reptile-123',
      quality: 'good',
      completedDate: new Date().toISOString(),
      isComplete: true,
    }
    mockCreateShed.mockResolvedValue(newShed)

    const { result } = renderHook(() => useCreateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const created = await result.current.mutateAsync({
        quality: 'good',
        completedDate: new Date().toISOString(),
        isComplete: true,
      })
      expect(created).toEqual(newShed)
    })

    expect(mockCreateShed).toHaveBeenCalledWith('reptile-123', expect.objectContaining({
      quality: 'good',
      isComplete: true,
    }))
  })

  it('should create shed offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useCreateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    const shedData = {
      quality: 'good',
      completedDate: new Date().toISOString(),
      isComplete: true,
    }

    await act(async () => {
      await result.current.mutateAsync(shedData)
    })

    expect(mockSheds.add).toHaveBeenCalled()
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'CREATE',
      table: 'sheds',
      status: 'PENDING',
    }))
    expect(mockCreateShed).not.toHaveBeenCalled()
  })

  it('should handle shed with start date', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useCreateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    const startDate = new Date('2024-01-10').toISOString()
    const completedDate = new Date('2024-01-15').toISOString()

    await act(async () => {
      await result.current.mutateAsync({
        quality: 'good',
        startDate,
        completedDate,
        isComplete: true,
      })
    })

    expect(mockSheds.add).toHaveBeenCalledWith(expect.objectContaining({
      startDate: new Date(startDate).getTime(),
      completedDate: new Date(completedDate).getTime(),
    }))
  })

  it('should handle creation errors', async () => {
    mockCreateShed.mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          quality: 'good',
          completedDate: new Date().toISOString(),
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Validation error')
      }
    })
  })
})

describe('useUpdateShed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockSheds = createMockSheds()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should update a shed when online', async () => {
    const updatedShed = {
      id: 'shed-123',
      reptileId: 'reptile-123',
      quality: 'excellent',
      isComplete: true,
    }
    mockUpdateShed.mockResolvedValue(updatedShed)

    const { result } = renderHook(() => useUpdateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        shedId: 'shed-123',
        data: { quality: 'excellent' },
      })
      expect(updated).toEqual(updatedShed)
    })

    expect(mockUpdateShed).toHaveBeenCalledWith('reptile-123', 'shed-123', { quality: 'excellent' })
  })

  it('should update shed offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)
    mockSheds.get.mockResolvedValue({ id: 'shed-123', quality: 'excellent' })

    const { result } = renderHook(() => useUpdateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        shedId: 'shed-123',
        data: { quality: 'excellent' },
      })
    })

    expect(mockSheds.update).toHaveBeenCalledWith('shed-123', expect.objectContaining({
      quality: 'excellent',
      _syncStatus: 'pending',
    }))
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'UPDATE',
      table: 'sheds',
      recordId: 'shed-123',
    }))
    expect(mockUpdateShed).not.toHaveBeenCalled()
  })

  it('should update isComplete status', async () => {
    mockIsOnline.mockReturnValue(false)
    mockSheds.get.mockResolvedValue({ id: 'shed-123', isComplete: true })

    const { result } = renderHook(() => useUpdateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        shedId: 'shed-123',
        data: { isComplete: false },
      })
    })

    expect(mockSheds.update).toHaveBeenCalledWith('shed-123', expect.objectContaining({
      isComplete: false,
    }))
  })

  it('should handle update errors', async () => {
    mockUpdateShed.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          shedId: 'shed-123',
          data: { quality: 'excellent' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })
})

describe('useDeleteShed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockSheds = createMockSheds()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should delete a shed when online', async () => {
    const deleteResult = { id: 'shed-123', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeleteShed.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeleteShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('shed-123')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeleteShed).toHaveBeenCalledWith('reptile-123', 'shed-123')
  })

  it('should delete shed offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useDeleteShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('shed-123')
      expect(deleted).toEqual({ id: 'shed-123', deletedAt: expect.any(String) })
    })

    expect(mockSheds.delete).toHaveBeenCalledWith('shed-123')
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'DELETE',
      table: 'sheds',
      recordId: 'shed-123',
    }))
    expect(mockDeleteShed).not.toHaveBeenCalled()
  })

  it('should handle delete errors', async () => {
    mockDeleteShed.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteShed('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('shed-123')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})
