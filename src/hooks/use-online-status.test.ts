// Tests for useOnlineStatus hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

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

// Setup mock navigator
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

import { useOnlineStatus } from './use-online-status'

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onlineHandler = null
    offlineHandler = null
  })

  afterEach(() => {
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
    it('should return true when navigator.onLine is true', () => {
      setupMocks(true)

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current).toBe(true)
    })

    it('should return true initially before useEffect runs (default state)', () => {
      setupMocks(false)

      const { result } = renderHook(() => useOnlineStatus())

      // After useEffect, it should reflect navigator.onLine
      // Since React 18 batches effects, we should see the updated value
      expect(result.current).toBe(false)
    })
  })

  describe('event listeners', () => {
    it('should add event listeners for online and offline events', () => {
      setupMocks(true)

      renderHook(() => useOnlineStatus())

      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should remove event listeners on unmount', () => {
      setupMocks(true)

      const { unmount } = renderHook(() => useOnlineStatus())
      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })

  describe('state changes', () => {
    it('should update to false when offline event is triggered', () => {
      setupMocks(true)

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current).toBe(true)

      // Simulate offline event
      act(() => {
        if (offlineHandler) offlineHandler()
      })

      expect(result.current).toBe(false)
    })

    it('should update to true when online event is triggered', () => {
      setupMocks(false)

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current).toBe(false)

      // Simulate online event
      act(() => {
        if (onlineHandler) onlineHandler()
      })

      expect(result.current).toBe(true)
    })

    it('should handle multiple state transitions', () => {
      setupMocks(true)

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current).toBe(true)

      // Go offline
      act(() => {
        if (offlineHandler) offlineHandler()
      })
      expect(result.current).toBe(false)

      // Go online
      act(() => {
        if (onlineHandler) onlineHandler()
      })
      expect(result.current).toBe(true)

      // Go offline again
      act(() => {
        if (offlineHandler) offlineHandler()
      })
      expect(result.current).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should not crash when events fire rapidly', () => {
      setupMocks(true)

      const { result } = renderHook(() => useOnlineStatus())

      // Rapid state changes
      act(() => {
        if (offlineHandler) offlineHandler()
        if (onlineHandler) onlineHandler()
        if (offlineHandler) offlineHandler()
        if (onlineHandler) onlineHandler()
      })

      // Final state should be online
      expect(result.current).toBe(true)
    })

    it('should handle remounting correctly', () => {
      setupMocks(true)

      const { result, unmount, rerender } = renderHook(() => useOnlineStatus())

      expect(result.current).toBe(true)

      // Unmount and remount
      unmount()

      // Reset mocks for new mount
      vi.clearAllMocks()
      onlineHandler = null
      offlineHandler = null

      const { result: result2 } = renderHook(() => useOnlineStatus())

      expect(result2.current).toBe(true)
      expect(mockAddEventListener).toHaveBeenCalledTimes(2) // online and offline
    })
  })
})
