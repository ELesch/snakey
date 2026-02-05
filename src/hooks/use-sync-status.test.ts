// Tests for useSyncStatus hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock the offline modules
const mockGetPendingCount = vi.fn()
const mockGetFailedOperations = vi.fn()
const mockGetLastPullTimestamp = vi.fn()

vi.mock('@/lib/offline/queue', () => ({
  getPendingCount: (...args: unknown[]) => mockGetPendingCount(...args),
  getFailedOperations: (...args: unknown[]) => mockGetFailedOperations(...args),
}))

vi.mock('@/lib/offline/sync', () => ({
  getLastPullTimestamp: (...args: unknown[]) => mockGetLastPullTimestamp(...args),
}))

// Store original navigator and window to restore later
const originalNavigator = global.navigator
const originalWindow = global.window

// Create mock event handlers storage
let onlineHandler: (() => void) | null = null
let offlineHandler: (() => void) | null = null

// Mock window event listeners
const mockAddEventListener = vi.fn((event: string, handler: () => void) => {
  if (event === 'online') onlineHandler = handler
  if (event === 'offline') offlineHandler = handler
})

const mockRemoveEventListener = vi.fn((event: string, _handler: () => void) => {
  if (event === 'online') onlineHandler = null
  if (event === 'offline') offlineHandler = null
})

// Setup mock navigator and window
function setupMocks(isOnline: boolean) {
  Object.defineProperty(global, 'navigator', {
    value: { onLine: isOnline },
    writable: true,
    configurable: true,
  })

  Object.defineProperty(global, 'window', {
    value: {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    },
    writable: true,
    configurable: true,
  })
}

import { useSyncStatus } from './use-sync-status'

describe('useSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    onlineHandler = null
    offlineHandler = null

    // Default mock implementations
    mockGetPendingCount.mockResolvedValue(0)
    mockGetFailedOperations.mockResolvedValue([])
    mockGetLastPullTimestamp.mockResolvedValue(0)

    setupMocks(true)
  })

  afterEach(() => {
    vi.useRealTimers()

    // Restore original globals
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    })
  })

  describe('initial state', () => {
    it('should return default sync status values', async () => {
      const { result } = renderHook(() => useSyncStatus())

      // Initial values before refresh
      expect(result.current.isSyncing).toBe(false)
      expect(typeof result.current.refresh).toBe('function')
      expect(typeof result.current.setIsSyncing).toBe('function')
    })

    it('should set isOnline based on navigator.onLine', async () => {
      setupMocks(true)
      const { result } = renderHook(() => useSyncStatus())

      expect(result.current.isOnline).toBe(true)
    })

    it('should set isOnline to false when offline', async () => {
      setupMocks(false)
      const { result } = renderHook(() => useSyncStatus())

      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('refresh function', () => {
    it('should fetch pending count, failed operations, and last pull timestamp', async () => {
      mockGetPendingCount.mockResolvedValue(5)
      mockGetFailedOperations.mockResolvedValue([{ id: '1' }, { id: '2' }])
      mockGetLastPullTimestamp.mockResolvedValue(1704067200000) // 2024-01-01

      const { result } = renderHook(() => useSyncStatus())

      // Wait for initial refresh
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(mockGetPendingCount).toHaveBeenCalled()
      expect(mockGetFailedOperations).toHaveBeenCalled()
      expect(mockGetLastPullTimestamp).toHaveBeenCalled()

      expect(result.current.pendingCount).toBe(5)
      expect(result.current.failedCount).toBe(2)
      expect(result.current.lastSync).toBe(1704067200000)
    })

    it('should update hasPendingChanges when pendingCount > 0', async () => {
      mockGetPendingCount.mockResolvedValue(3)

      const { result } = renderHook(() => useSyncStatus())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(result.current.hasPendingChanges).toBe(true)
    })

    it('should set hasPendingChanges to false when pendingCount is 0', async () => {
      mockGetPendingCount.mockResolvedValue(0)

      const { result } = renderHook(() => useSyncStatus())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(result.current.hasPendingChanges).toBe(false)
    })

    it('should update hasFailedChanges when failedCount > 0', async () => {
      mockGetFailedOperations.mockResolvedValue([{ id: '1' }])

      const { result } = renderHook(() => useSyncStatus())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(result.current.hasFailedChanges).toBe(true)
    })

    it('should set hasFailedChanges to false when failedCount is 0', async () => {
      mockGetFailedOperations.mockResolvedValue([])

      const { result } = renderHook(() => useSyncStatus())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(result.current.hasFailedChanges).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetPendingCount.mockRejectedValue(new Error('Database error'))

      const { result } = renderHook(() => useSyncStatus())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get sync status:', expect.any(Error))
      // Values should remain at defaults
      expect(result.current.pendingCount).toBe(0)

      consoleSpy.mockRestore()
    })

    it('should allow manual refresh', async () => {
      const { result } = renderHook(() => useSyncStatus())

      // Wait for initial refresh
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      // Clear mocks to verify manual refresh
      vi.clearAllMocks()
      mockGetPendingCount.mockResolvedValue(10)
      mockGetFailedOperations.mockResolvedValue([])
      mockGetLastPullTimestamp.mockResolvedValue(0)

      await act(async () => {
        await result.current.refresh()
      })

      expect(mockGetPendingCount).toHaveBeenCalled()
      expect(result.current.pendingCount).toBe(10)
    })
  })

  describe('polling', () => {
    it('should poll for changes every 5 seconds', async () => {
      const { result } = renderHook(() => useSyncStatus())

      // Initial call
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(mockGetPendingCount).toHaveBeenCalledTimes(1)

      // After 5 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      expect(mockGetPendingCount).toHaveBeenCalledTimes(2)

      // After another 5 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      expect(mockGetPendingCount).toHaveBeenCalledTimes(3)
    })

    it('should clean up interval on unmount', async () => {
      const { unmount } = renderHook(() => useSyncStatus())

      // Initial call
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(mockGetPendingCount).toHaveBeenCalledTimes(1)

      unmount()

      // Advance time - should not call again
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000)
      })
      expect(mockGetPendingCount).toHaveBeenCalledTimes(1)
    })
  })

  describe('online/offline events', () => {
    it('should add event listeners for online and offline events', () => {
      renderHook(() => useSyncStatus())

      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useSyncStatus())
      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should update isOnline when offline event is triggered', async () => {
      setupMocks(true)
      const { result } = renderHook(() => useSyncStatus())

      expect(result.current.isOnline).toBe(true)

      act(() => {
        if (offlineHandler) offlineHandler()
      })

      expect(result.current.isOnline).toBe(false)
    })

    it('should update isOnline when online event is triggered', async () => {
      setupMocks(false)
      const { result } = renderHook(() => useSyncStatus())

      expect(result.current.isOnline).toBe(false)

      act(() => {
        if (onlineHandler) onlineHandler()
      })

      expect(result.current.isOnline).toBe(true)
    })
  })

  describe('setIsSyncing', () => {
    it('should allow setting isSyncing state', async () => {
      const { result } = renderHook(() => useSyncStatus())

      expect(result.current.isSyncing).toBe(false)

      act(() => {
        result.current.setIsSyncing(true)
      })

      expect(result.current.isSyncing).toBe(true)

      act(() => {
        result.current.setIsSyncing(false)
      })

      expect(result.current.isSyncing).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent refresh calls', async () => {
      mockGetPendingCount.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(5), 100))
      )
      mockGetFailedOperations.mockResolvedValue([])
      mockGetLastPullTimestamp.mockResolvedValue(0)

      const { result } = renderHook(() => useSyncStatus())

      // Call refresh multiple times rapidly
      await act(async () => {
        result.current.refresh()
        result.current.refresh()
        result.current.refresh()
        await vi.advanceTimersByTimeAsync(150)
      })

      // Should complete without errors
      expect(result.current.pendingCount).toBe(5)
    })

    it('should handle state transitions correctly', async () => {
      mockGetPendingCount.mockResolvedValue(0)
      mockGetFailedOperations.mockResolvedValue([])
      mockGetLastPullTimestamp.mockResolvedValue(0)

      const { result } = renderHook(() => useSyncStatus())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      // Initial state
      expect(result.current.hasPendingChanges).toBe(false)
      expect(result.current.hasFailedChanges).toBe(false)

      // Update mocks to have pending changes
      mockGetPendingCount.mockResolvedValue(3)
      mockGetFailedOperations.mockResolvedValue([{ id: '1' }])

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.hasPendingChanges).toBe(true)
      expect(result.current.hasFailedChanges).toBe(true)

      // Clear pending changes
      mockGetPendingCount.mockResolvedValue(0)
      mockGetFailedOperations.mockResolvedValue([])

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.hasPendingChanges).toBe(false)
      expect(result.current.hasFailedChanges).toBe(false)
    })
  })
})
