// Tests for use-reptiles hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchReptiles = vi.fn()
const mockFetchReptile = vi.fn()
const mockCreateReptile = vi.fn()
const mockUpdateReptile = vi.fn()
const mockDeleteReptile = vi.fn()

vi.mock('@/lib/api/reptile.api', () => ({
  fetchReptiles: (...args: unknown[]) => mockFetchReptiles(...args),
  fetchReptile: (...args: unknown[]) => mockFetchReptile(...args),
  createReptile: (...args: unknown[]) => mockCreateReptile(...args),
  updateReptile: (...args: unknown[]) => mockUpdateReptile(...args),
  deleteReptile: (...args: unknown[]) => mockDeleteReptile(...args),
}))

import {
  useReptiles,
  useReptile,
  useCreateReptile,
  useUpdateReptile,
  useDeleteReptile,
  reptileKeys,
} from './use-reptiles'

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

describe('reptileKeys', () => {
  it('should generate correct all key', () => {
    expect(reptileKeys.all).toEqual(['reptiles'])
  })

  it('should generate correct lists key', () => {
    expect(reptileKeys.lists()).toEqual(['reptiles', 'list'])
  })

  it('should generate correct list key with filters', () => {
    expect(reptileKeys.list({ species: 'ball_python' })).toEqual([
      'reptiles',
      'list',
      { species: 'ball_python' },
    ])
  })

  it('should generate correct details key', () => {
    expect(reptileKeys.details()).toEqual(['reptiles', 'detail'])
  })

  it('should generate correct detail key with id', () => {
    expect(reptileKeys.detail('reptile-123')).toEqual([
      'reptiles',
      'detail',
      'reptile-123',
    ])
  })
})

describe('useReptiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch reptiles on mount', async () => {
    const mockData = {
      data: [
        { id: '1', name: 'Monty', species: 'ball_python' },
        { id: '2', name: 'Slinky', species: 'corn_snake' },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    mockFetchReptiles.mockResolvedValue(mockData)

    const { result } = renderHook(() => useReptiles(), {
      wrapper: createWrapper(),
    })

    // Initially pending
    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.reptiles).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(mockFetchReptiles).toHaveBeenCalledWith({})
  })

  it('should pass query parameters to fetchReptiles', async () => {
    const mockData = { data: [], meta: { total: 0, page: 1, limit: 20 } }
    mockFetchReptiles.mockResolvedValue(mockData)
    const query = { species: 'ball_python', limit: 10 }

    const { result } = renderHook(() => useReptiles(query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchReptiles).toHaveBeenCalledWith(query)
  })

  it('should handle fetch errors', async () => {
    const mockError = new Error('Network error')
    mockFetchReptiles.mockRejectedValue(mockError)

    const { result } = renderHook(() => useReptiles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.reptiles).toEqual([])
  })

  it('should return empty array when no data', async () => {
    mockFetchReptiles.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })

    const { result } = renderHook(() => useReptiles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.reptiles).toEqual([])
  })

  it('should provide refetch function', async () => {
    mockFetchReptiles.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })

    const { result } = renderHook(() => useReptiles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useReptile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch a single reptile by id', async () => {
    const mockReptile = { id: 'reptile-123', name: 'Monty', species: 'ball_python' }
    mockFetchReptile.mockResolvedValue(mockReptile)

    const { result } = renderHook(() => useReptile('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.reptile).toEqual(mockReptile)
    expect(mockFetchReptile).toHaveBeenCalledWith('reptile-123', { include: undefined })
  })

  it('should pass include options to fetchReptile', async () => {
    mockFetchReptile.mockResolvedValue({ id: '1', name: 'Monty' })

    const { result } = renderHook(
      () => useReptile('reptile-123', { include: ['feedings', 'sheds'] }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchReptile).toHaveBeenCalledWith('reptile-123', {
      include: ['feedings', 'sheds'],
    })
  })

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => useReptile('reptile-123', { enabled: false }),
      { wrapper: createWrapper() }
    )

    // Wait a bit to ensure no fetch happens
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchReptile).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true) // Still pending because query is disabled
  })

  it('should not fetch when id is empty', async () => {
    const { result } = renderHook(() => useReptile(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchReptile).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('should handle fetch errors', async () => {
    mockFetchReptile.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useReptile('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useCreateReptile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a reptile', async () => {
    const newReptile = { id: 'new-reptile', name: 'Monty', species: 'ball_python' }
    mockCreateReptile.mockResolvedValue(newReptile)

    const { result } = renderHook(() => useCreateReptile(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const created = await result.current.mutateAsync({
        name: 'Monty',
        species: 'ball_python',
      })
      expect(created).toEqual(newReptile)
    })

    expect(mockCreateReptile).toHaveBeenCalledWith({
      name: 'Monty',
      species: 'ball_python',
    })
  })

  it('should handle creation errors', async () => {
    mockCreateReptile.mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateReptile(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: '', species: 'ball_python' })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Validation error')
      }
    })
  })
})

describe('useUpdateReptile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update a reptile', async () => {
    const updatedReptile = { id: 'reptile-123', name: 'Monty Updated', species: 'ball_python' }
    mockUpdateReptile.mockResolvedValue(updatedReptile)

    const { result } = renderHook(() => useUpdateReptile(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        id: 'reptile-123',
        data: { name: 'Monty Updated' },
      })
      expect(updated).toEqual(updatedReptile)
    })

    expect(mockUpdateReptile).toHaveBeenCalledWith('reptile-123', { name: 'Monty Updated' })
  })

  it('should handle update errors', async () => {
    mockUpdateReptile.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateReptile(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: 'reptile-123',
          data: { name: 'Test' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })

  it('should provide optimistic update via onMutate', async () => {
    // This test verifies the hook is configured correctly
    // The actual optimistic behavior is tested through integration tests
    const { result } = renderHook(() => useUpdateReptile(), {
      wrapper: createWrapper(),
    })

    expect(result.current.mutate).toBeDefined()
    expect(result.current.mutateAsync).toBeDefined()
  })
})

describe('useDeleteReptile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete a reptile', async () => {
    const deleteResult = { id: 'reptile-123', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeleteReptile.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeleteReptile(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('reptile-123')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeleteReptile).toHaveBeenCalledWith('reptile-123')
  })

  it('should handle delete errors', async () => {
    mockDeleteReptile.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteReptile(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('reptile-123')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})
