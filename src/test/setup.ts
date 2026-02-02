import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Polyfill for pointer capture functions (needed for Radix UI components)
// jsdom doesn't implement these, but Radix UI Select uses them
if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Element.prototype.hasPointerCapture = function () {
    return false
  }
}
if (typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = function () {
    // no-op
  }
}
if (typeof Element.prototype.releasePointerCapture !== 'function') {
  Element.prototype.releasePointerCapture = function () {
    // no-op
  }
}

// Polyfill scrollIntoView (used by Radix UI Select)
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function () {
    // no-op
  }
}

// Mock ResizeObserver (used by some UI components)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// Mock Prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    reptile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    weight: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    feeding: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    shed: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
  default: {},
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// Mock IndexedDB (Dexie)
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}
vi.stubGlobal('indexedDB', indexedDB)

// Mock URL.createObjectURL and URL.revokeObjectURL for image picker tests
// These need to be in the global setup because React cleanup effects run
// asynchronously after individual test afterEach hooks
if (!URL.createObjectURL || URL.createObjectURL.toString().includes('native code')) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (!URL.revokeObjectURL || URL.revokeObjectURL.toString().includes('native code')) {
  URL.revokeObjectURL = vi.fn()
}
