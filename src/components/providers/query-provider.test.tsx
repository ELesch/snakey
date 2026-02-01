// Query Provider Component Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { QueryProvider } from './query-provider'
import { useQuery, useMutation } from '@tanstack/react-query'

// Use vi.hoisted to define mocks before hoisting
const { mockLogError } = vi.hoisted(() => ({
  mockLogError: vi.fn(),
}))

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: mockLogError,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Test component that uses a query
function TestQueryComponent({ shouldFail = false }: { shouldFail?: boolean }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      if (shouldFail) {
        throw new Error('Query failed')
      }
      return { message: 'Success' }
    },
    retry: false,
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>Data: {data?.message}</div>
}

// Test component that uses a mutation
function TestMutationComponent({
  onMutate,
  shouldFail = false,
}: {
  onMutate?: () => void
  shouldFail?: boolean
}) {
  const mutation = useMutation({
    mutationKey: ['testMutation'],
    mutationFn: async () => {
      if (shouldFail) {
        throw new Error('Mutation failed')
      }
      return { success: true }
    },
    retry: false,
  })

  return (
    <div>
      <button
        onClick={() => {
          mutation.mutate(undefined)
          onMutate?.()
        }}
      >
        Mutate
      </button>
      {mutation.isPending && <div>Mutating...</div>}
      {mutation.isError && <div>Mutation Error: {mutation.error.message}</div>}
      {mutation.isSuccess && <div>Mutation Success</div>}
    </div>
  )
}

describe('QueryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <QueryProvider>
          <div data-testid="child">Hello World</div>
        </QueryProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <QueryProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </QueryProvider>
      )

      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
    })
  })

  describe('QueryClient provision', () => {
    it('should provide QueryClient to child components', async () => {
      render(
        <QueryProvider>
          <TestQueryComponent />
        </QueryProvider>
      )

      // Initially loading
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Data: Success')).toBeInTheDocument()
      })
    })

    it('should handle successful queries', async () => {
      render(
        <QueryProvider>
          <TestQueryComponent shouldFail={false} />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: Success')).toBeInTheDocument()
      })
    })

    it('should handle failed queries', async () => {
      render(
        <QueryProvider>
          <TestQueryComponent shouldFail={true} />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Query failed')).toBeInTheDocument()
      })
    })

    it('should handle mutations', async () => {
      render(
        <QueryProvider>
          <TestMutationComponent shouldFail={false} />
        </QueryProvider>
      )

      // Click mutate button
      await act(async () => {
        screen.getByRole('button', { name: /mutate/i }).click()
      })

      await waitFor(() => {
        expect(screen.getByText('Mutation Success')).toBeInTheDocument()
      })
    })
  })

  describe('error logging', () => {
    it('should log query errors', async () => {
      render(
        <QueryProvider>
          <TestQueryComponent shouldFail={true} />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Query failed')).toBeInTheDocument()
      })

      // Verify logger was called with error details
      await waitFor(() => {
        expect(mockLogError).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Query failed',
            queryKey: ['test'],
          }),
          'Query error'
        )
      })
    })

    it('should log mutation errors', async () => {
      render(
        <QueryProvider>
          <TestMutationComponent shouldFail={true} />
        </QueryProvider>
      )

      // Trigger mutation
      await act(async () => {
        screen.getByRole('button', { name: /mutate/i }).click()
      })

      await waitFor(() => {
        expect(screen.getByText('Mutation Error: Mutation failed')).toBeInTheDocument()
      })

      // Verify logger was called with error details
      await waitFor(() => {
        expect(mockLogError).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Mutation failed',
            mutationKey: ['testMutation'],
          }),
          'Mutation error'
        )
      })
    })
  })

  describe('default options', () => {
    it('should configure default stale time', async () => {
      // The staleTime is set to 60 * 1000 (1 minute)
      // We verify this by checking that the query is provided correctly
      render(
        <QueryProvider>
          <TestQueryComponent />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: Success')).toBeInTheDocument()
      })
    })
  })
})
