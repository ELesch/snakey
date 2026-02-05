// Tests for RecentEvents component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecentEvents } from './recent-events'
import type { ActivityEvent } from '@/hooks/use-reptile-activity'

// Mock the useReptileActivity hook
const mockUseReptileActivity = vi.fn()

vi.mock('@/hooks/use-reptile-activity', () => ({
  useReptileActivity: (...args: unknown[]) => mockUseReptileActivity(...args),
}))

// Mock date-fns formatDistanceToNow
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    // Return predictable time strings for testing
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }),
}))

describe('RecentEvents', () => {
  const testReptileId = 'reptile-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    mockUseReptileActivity.mockReturnValue({
      activities: [],
      isPending: false,
    })
  })

  describe('loading state', () => {
    it('should render loading state when isPending is true', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [],
        isPending: true,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByText('Loading recent events...')).toBeInTheDocument()
    })

    it('should show loading spinner when isPending is true', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [],
        isPending: true,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      // Check for the spinner (Loader2 component creates an SVG with animate-spin class)
      const container = screen.getByText('Loading recent events...').parentElement
      expect(container?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should render empty state when no activities exist', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByText('No recent events logged')).toBeInTheDocument()
    })

    it('should not show activity list when no activities exist', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })
  })

  describe('activity list', () => {
    const mockActivities: ActivityEvent[] = [
      {
        id: 'feeding-1',
        type: 'feeding',
        date: new Date('2024-01-15'),
        description: 'Mouse (Adult)',
      },
      {
        id: 'shed-1',
        type: 'shed',
        date: new Date('2024-01-10'),
        description: 'good shed',
      },
    ]

    it('should render list of events', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: mockActivities,
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('should display Recent Activity heading', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: mockActivities,
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })

    it('should show Feeding label for feeding events', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [mockActivities[0]], // Just the feeding
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByText('Feeding')).toBeInTheDocument()
    })

    it('should show Shed label for shed events', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [mockActivities[1]], // Just the shed
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByText('Shed')).toBeInTheDocument()
    })

    it('should display event descriptions', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: mockActivities,
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByText('Mouse (Adult)')).toBeInTheDocument()
      expect(screen.getByText('good shed')).toBeInTheDocument()
    })

    it('should display formatted relative time', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [
          {
            id: 'feeding-1',
            type: 'feeding',
            date: new Date(), // Today
            description: 'Mouse (Adult)',
          },
        ],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      // The mocked formatDistanceToNow returns 'today' for same day
      expect(screen.getByText('today')).toBeInTheDocument()
    })

    it('should render time element with dateTime attribute', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [mockActivities[0]],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      const timeElement = screen.getByText(/ago|today/i).closest('time')
      expect(timeElement).toHaveAttribute('dateTime', mockActivities[0].date.toISOString())
    })
  })

  describe('icons', () => {
    it('should render correct icon for feeding events', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [
          {
            id: 'feeding-1',
            type: 'feeding',
            date: new Date(),
            description: 'Mouse (Adult)',
          },
        ],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      // The Utensils icon is rendered as an SVG inside the event item
      const listItem = screen.getByRole('listitem')
      const iconContainer = listItem.querySelector('[class*="rounded-full"]')
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render correct icon for shed events', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [
          {
            id: 'shed-1',
            type: 'shed',
            date: new Date(),
            description: 'good shed',
          },
        ],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      // The Sparkles icon is rendered as an SVG inside the event item
      const listItem = screen.getByRole('listitem')
      const iconContainer = listItem.querySelector('[class*="rounded-full"]')
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('hook integration', () => {
    it('should call useReptileActivity with reptileId and limit', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(mockUseReptileActivity).toHaveBeenCalledWith(testReptileId, 5)
    })
  })

  describe('accessibility', () => {
    it('should have role="list" on the activity list', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [
          {
            id: 'feeding-1',
            type: 'feeding',
            date: new Date(),
            description: 'Mouse (Adult)',
          },
        ],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should have aria-hidden on icons', () => {
      mockUseReptileActivity.mockReturnValue({
        activities: [
          {
            id: 'feeding-1',
            type: 'feeding',
            date: new Date(),
            description: 'Mouse (Adult)',
          },
        ],
        isPending: false,
      })

      render(<RecentEvents reptileId={testReptileId} />)

      // Icons should be hidden from screen readers
      const listItem = screen.getByRole('listitem')
      const svg = listItem.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
