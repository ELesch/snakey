// Tests for use-photos hooks
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchPhotos = vi.fn()
const mockFetchPhoto = vi.fn()
const mockCreatePhoto = vi.fn()
const mockUpdatePhoto = vi.fn()
const mockDeletePhoto = vi.fn()
const mockGetUploadUrl = vi.fn()
const mockUploadToStorage = vi.fn()

vi.mock('@/lib/api/photo.api', () => ({
  fetchPhotos: (...args: unknown[]) => mockFetchPhotos(...args),
  fetchPhoto: (...args: unknown[]) => mockFetchPhoto(...args),
  createPhoto: (...args: unknown[]) => mockCreatePhoto(...args),
  updatePhoto: (...args: unknown[]) => mockUpdatePhoto(...args),
  deletePhoto: (...args: unknown[]) => mockDeletePhoto(...args),
  getUploadUrl: (...args: unknown[]) => mockGetUploadUrl(...args),
  uploadToStorage: (...args: unknown[]) => mockUploadToStorage(...args),
}))

// Mock the online status hook
const mockIsOnline = vi.fn()
vi.mock('./use-online-status', () => ({
  useOnlineStatus: () => mockIsOnline(),
}))

// Create mock objects that will be used inside vi.mock
const createMockPhotos = () => ({
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  reverse: vi.fn().mockReturnThis(),
  sortBy: vi.fn().mockResolvedValue([]),
  bulkPut: vi.fn().mockResolvedValue(undefined),
  add: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
})

const createMockSyncQueue = () => ({
  add: vi.fn().mockResolvedValue(undefined),
})

// Store references for tests
let mockPhotos = createMockPhotos()
let mockSyncQueue = createMockSyncQueue()

vi.mock('@/lib/offline/db', () => ({
  offlineDb: {
    get photos() {
      return mockPhotos
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
  usePhotos,
  usePhoto,
  useUploadPhoto,
  useUpdatePhoto,
  useDeletePhoto,
  photoKeys,
} from './use-photos'

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

describe('photoKeys', () => {
  it('should generate correct all key', () => {
    expect(photoKeys.all).toEqual(['photos'])
  })

  it('should generate correct lists key', () => {
    expect(photoKeys.lists()).toEqual(['photos', 'list'])
  })

  it('should generate correct list key with reptileId', () => {
    expect(photoKeys.list('reptile-123')).toEqual([
      'photos',
      'list',
      'reptile-123',
      {},
    ])
  })

  it('should generate correct list key with reptileId and filters', () => {
    expect(photoKeys.list('reptile-123', { category: 'GENERAL' })).toEqual([
      'photos',
      'list',
      'reptile-123',
      { category: 'GENERAL' },
    ])
  })

  it('should generate correct detail key', () => {
    expect(photoKeys.detail('photo-456')).toEqual([
      'photos',
      'detail',
      'photo-456',
    ])
  })
})

describe('usePhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockPhotos = createMockPhotos()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should fetch photos when online', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-123', storagePath: '/path/1.jpg', category: 'GENERAL' },
        { id: '2', reptileId: 'reptile-123', storagePath: '/path/2.jpg', category: 'SHED' },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    mockFetchPhotos.mockResolvedValue(mockData)

    const { result } = renderHook(() => usePhotos('reptile-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.photos).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(mockFetchPhotos).toHaveBeenCalledWith('reptile-123', {})
  })

  it('should pass query parameters to fetchPhotos', async () => {
    mockFetchPhotos.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })
    const query = { category: 'SHED' }

    const { result } = renderHook(() => usePhotos('reptile-123', query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchPhotos).toHaveBeenCalledWith('reptile-123', query)
  })

  it('should return isOnline status', async () => {
    mockFetchPhotos.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })

    const { result } = renderHook(() => usePhotos('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('should indicate offline data when offline', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => usePhotos('reptile-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isOfflineData).toBe(true)
    expect(mockFetchPhotos).not.toHaveBeenCalled()
  })

  it('should handle fetch errors', async () => {
    mockFetchPhotos.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePhotos('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should not fetch when reptileId is empty', async () => {
    const { result } = renderHook(() => usePhotos(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchPhotos).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })
})

describe('usePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockPhotos = createMockPhotos()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should fetch a single photo', async () => {
    const mockPhoto = {
      id: 'photo-123',
      reptileId: 'reptile-123',
      storagePath: '/path/photo.jpg',
      category: 'GENERAL',
      takenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    mockFetchPhoto.mockResolvedValue(mockPhoto)

    const { result } = renderHook(() => usePhoto('photo-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockPhoto)
    expect(mockFetchPhoto).toHaveBeenCalledWith('photo-123')
  })

  it('should not fetch when photoId is empty', async () => {
    const { result } = renderHook(() => usePhoto(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchPhoto).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('should not fetch when offline', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => usePhoto('photo-123'), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchPhoto).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })
})

describe('useUploadPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockPhotos = createMockPhotos()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should upload a photo when online', async () => {
    const mockUploadResponse = {
      uploadUrl: 'https://storage.example.com/upload',
      storagePath: '/uploads/reptile-123/photo.jpg',
      thumbnailPath: '/uploads/reptile-123/photo-thumb.jpg',
    }
    mockGetUploadUrl.mockResolvedValue(mockUploadResponse)
    mockUploadToStorage.mockResolvedValue(undefined)

    const newPhoto = {
      id: 'new-photo',
      reptileId: 'reptile-123',
      storagePath: mockUploadResponse.storagePath,
      thumbnailPath: mockUploadResponse.thumbnailPath,
      category: 'GENERAL',
      takenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    mockCreatePhoto.mockResolvedValue(newPhoto)

    const { result } = renderHook(() => useUploadPhoto('reptile-123'), {
      wrapper: createWrapper(),
    })

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const onProgress = vi.fn()

    await act(async () => {
      const created = await result.current.mutateAsync({
        file: mockFile,
        data: { category: 'GENERAL' },
        onProgress,
      })
      expect(created).toEqual(newPhoto)
    })

    expect(mockGetUploadUrl).toHaveBeenCalledWith('reptile-123', 'test.jpg', 'image/jpeg')
    expect(mockUploadToStorage).toHaveBeenCalledWith(
      mockUploadResponse.uploadUrl,
      mockFile,
      onProgress
    )
    expect(mockCreatePhoto).toHaveBeenCalledWith('reptile-123', expect.objectContaining({
      storagePath: mockUploadResponse.storagePath,
      thumbnailPath: mockUploadResponse.thumbnailPath,
      category: 'GENERAL',
    }))
  })

  it('should store photo offline and queue sync when offline', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useUploadPhoto('reptile-123'), {
      wrapper: createWrapper(),
    })

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.mutateAsync({
        file: mockFile,
        data: { category: 'GENERAL', caption: 'Test caption' },
      })
    })

    expect(mockPhotos.add).toHaveBeenCalledWith(expect.objectContaining({
      reptileId: 'reptile-123',
      category: 'GENERAL',
      caption: 'Test caption',
      _syncStatus: 'pending',
      blob: mockFile,
    }))
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'CREATE',
      table: 'photos',
      status: 'PENDING',
    }))
    expect(mockGetUploadUrl).not.toHaveBeenCalled()
  })

  it('should handle upload errors', async () => {
    mockGetUploadUrl.mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useUploadPhoto('reptile-123'), {
      wrapper: createWrapper(),
    })

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          file: mockFile,
          data: { category: 'GENERAL' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Upload failed')
      }
    })
  })
})

describe('useUpdatePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockPhotos = createMockPhotos()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should update a photo when online', async () => {
    const updatedPhoto = {
      id: 'photo-123',
      reptileId: 'reptile-123',
      caption: 'Updated caption',
      category: 'SHED',
    }
    mockUpdatePhoto.mockResolvedValue(updatedPhoto)

    const { result } = renderHook(() => useUpdatePhoto(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        photoId: 'photo-123',
        data: { caption: 'Updated caption', category: 'SHED' },
      })
      expect(updated).toEqual(updatedPhoto)
    })

    expect(mockUpdatePhoto).toHaveBeenCalledWith('photo-123', {
      caption: 'Updated caption',
      category: 'SHED',
    })
  })

  it('should update photo offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)
    mockPhotos.get.mockResolvedValue({ id: 'photo-123', caption: 'Updated caption' })

    const { result } = renderHook(() => useUpdatePhoto(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        photoId: 'photo-123',
        data: { caption: 'Updated caption' },
      })
    })

    expect(mockPhotos.update).toHaveBeenCalledWith('photo-123', expect.objectContaining({
      caption: 'Updated caption',
      _syncStatus: 'pending',
    }))
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'UPDATE',
      table: 'photos',
      recordId: 'photo-123',
    }))
    expect(mockUpdatePhoto).not.toHaveBeenCalled()
  })

  it('should handle update errors', async () => {
    mockUpdatePhoto.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdatePhoto(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          photoId: 'photo-123',
          data: { caption: 'Test' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })
})

describe('useDeletePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockPhotos = createMockPhotos()
    mockSyncQueue = createMockSyncQueue()
  })

  it('should delete a photo when online', async () => {
    const deleteResult = { id: 'photo-123', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeletePhoto.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeletePhoto(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('photo-123')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeletePhoto).toHaveBeenCalledWith('photo-123')
  })

  it('should delete photo offline and queue sync', async () => {
    mockIsOnline.mockReturnValue(false)

    const { result } = renderHook(() => useDeletePhoto(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('photo-123')
      expect(deleted).toEqual({ id: 'photo-123' })
    })

    expect(mockPhotos.delete).toHaveBeenCalledWith('photo-123')
    expect(mockSyncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'DELETE',
      table: 'photos',
      recordId: 'photo-123',
    }))
    expect(mockDeletePhoto).not.toHaveBeenCalled()
  })

  it('should handle delete errors', async () => {
    mockDeletePhoto.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeletePhoto(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('photo-123')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})
