// Error Fallback Component Tests - TDD Red Phase
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorFallback } from './error-fallback'

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message')
  const mockReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the default title when no title prop is provided', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} />)

      expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
    })

    it('should render custom title when provided', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} title="Custom Error Title" />)

      expect(screen.getByRole('heading', { name: /custom error title/i })).toBeInTheDocument()
    })

    it('should display the error message', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} />)

      expect(screen.getByText(/test error message/i)).toBeInTheDocument()
    })

    it('should render a try again button', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} />)

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should render a go to dashboard link by default', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} />)

      const link = screen.getByRole('link', { name: /go to dashboard/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('should render custom home link when homeHref and homeLabel are provided', () => {
      render(
        <ErrorFallback
          error={mockError}
          reset={mockReset}
          homeHref="/login"
          homeLabel="Back to Login"
        />
      )

      const link = screen.getByRole('link', { name: /back to login/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/login')
    })

    it('should hide home link when showHomeLink is false', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} showHomeLink={false} />)

      expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call reset function when try again button is clicked', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} />)

      fireEvent.click(screen.getByRole('button', { name: /try again/i }))

      expect(mockReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('should have appropriate ARIA attributes for error alert', () => {
      render(<ErrorFallback error={mockError} reset={mockReset} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
