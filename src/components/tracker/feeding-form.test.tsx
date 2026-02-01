// Feeding Form Component Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedingForm } from './feeding-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the hooks
const mockCreateFeedingMutateAsync = vi.fn()

vi.mock('@/hooks', () => ({
  useCreateFeeding: () => ({
    mutateAsync: mockCreateFeedingMutateAsync,
    isPending: false,
  }),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('FeedingForm', () => {
  const mockOnSuccess = vi.fn()
  const testReptileId = 'reptile-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all form fields', () => {
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Check for all fields - use getAllByText for labels that may have duplicates
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getAllByText(/prey type/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/prey size/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/prey source/i).length).toBeGreaterThan(0)
      expect(screen.getByLabelText(/accepted/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/refused/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/regurgitated/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('should render Log Feeding submit button', () => {
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByRole('button', { name: /log feeding/i })).toBeInTheDocument()
    })

    it('should have accepted checkbox checked by default', () => {
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByLabelText(/accepted/i)).toBeChecked()
    })

    it('should have refused and regurgitated checkboxes unchecked by default', () => {
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByLabelText(/refused/i)).not.toBeChecked()
      expect(screen.getByLabelText(/regurgitated/i)).not.toBeChecked()
    })

    it('should have date field pre-filled with today', () => {
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const dateInput = screen.getByLabelText(/date/i)
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput).toHaveValue(today)
    })
  })

  describe('validation', () => {
    it('should show error when date is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Clear the date
      const dateInput = screen.getByLabelText(/date/i)
      await user.clear(dateInput)

      // Submit form
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(screen.getByText(/date is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when prey type is not selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Submit without selecting prey type
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(screen.getByText(/prey type is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when prey size is not selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Select prey type but not size
      const preyTypeTrigger = screen.getAllByRole('combobox')[0]
      await user.click(preyTypeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Mouse' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Mouse' }))

      // Submit
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(screen.getByText(/prey size is required/i)).toBeInTheDocument()
      })
    })

    it('should clear error when field is filled', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Submit to trigger validation errors
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(screen.getByText(/prey type is required/i)).toBeInTheDocument()
      })

      // Select prey type - should clear error
      const preyTypeTrigger = screen.getAllByRole('combobox')[0]
      await user.click(preyTypeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Mouse' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Mouse' }))

      await waitFor(() => {
        expect(screen.queryByText(/prey type is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('submission', () => {
    it('should call onSuccess after successful submission', async () => {
      const user = userEvent.setup()
      mockCreateFeedingMutateAsync.mockResolvedValue({ id: 'feeding-123' })

      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Fill in required fields
      // Prey type
      const preyTypeTrigger = screen.getAllByRole('combobox')[0]
      await user.click(preyTypeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Mouse' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Mouse' }))

      // Prey size
      const preySizeTrigger = screen.getAllByRole('combobox')[1]
      await user.click(preySizeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Adult' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Adult' }))

      // Submit
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(mockCreateFeedingMutateAsync).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should submit with correct payload', async () => {
      const user = userEvent.setup()
      mockCreateFeedingMutateAsync.mockResolvedValue({ id: 'feeding-123' })

      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Fill in fields
      // Prey type
      const preyTypeTrigger = screen.getAllByRole('combobox')[0]
      await user.click(preyTypeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Mouse' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Mouse' }))

      // Prey size
      const preySizeTrigger = screen.getAllByRole('combobox')[1]
      await user.click(preySizeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Adult' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Adult' }))

      // Uncheck accepted, check refused
      await user.click(screen.getByLabelText(/accepted/i))
      await user.click(screen.getByLabelText(/refused/i))

      // Submit
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(mockCreateFeedingMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            preyType: 'Mouse',
            preySize: 'Adult',
            preySource: 'FROZEN_THAWED',
            accepted: false,
            refused: true,
            regurgitated: false,
          })
        )
      })
    }, 10000) // Increase timeout for this complex test

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      mockCreateFeedingMutateAsync.mockResolvedValue({ id: 'feeding-123' })

      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Fill in required fields
      const preyTypeTrigger = screen.getAllByRole('combobox')[0]
      await user.click(preyTypeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Mouse' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Mouse' }))

      const preySizeTrigger = screen.getAllByRole('combobox')[1]
      await user.click(preySizeTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Adult' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Adult' }))

      await user.type(screen.getByLabelText(/notes/i), 'Test note')

      // Submit
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })

      // Verify form is reset
      await waitFor(() => {
        expect(screen.getByLabelText(/notes/i)).toHaveValue('')
        expect(screen.getByLabelText(/accepted/i)).toBeChecked()
      })
    })
  })

  describe('prey options', () => {
    it('should display all prey type options', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const preyTypeTrigger = screen.getAllByRole('combobox')[0]
      await user.click(preyTypeTrigger)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Mouse' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Rat' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Chick' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Quail' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Rabbit' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Guinea Pig' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Insects' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Fish' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument()
      })
    })

    it('should display all prey size options', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const preySizeTrigger = screen.getAllByRole('combobox')[1]
      await user.click(preySizeTrigger)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Pinky' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Fuzzy' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Hopper' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Weaning' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Adult' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Small' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Large' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Extra Large' })).toBeInTheDocument()
      })
    })

    it('should display all prey source options', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const preySourceTrigger = screen.getAllByRole('combobox')[2]
      await user.click(preySourceTrigger)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Frozen/Thawed' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Live' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Pre-killed' })).toBeInTheDocument()
      })
    })
  })

  describe('checkbox interactions', () => {
    it('should toggle accepted checkbox', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const acceptedCheckbox = screen.getByLabelText(/accepted/i)
      expect(acceptedCheckbox).toBeChecked()

      await user.click(acceptedCheckbox)
      expect(acceptedCheckbox).not.toBeChecked()

      await user.click(acceptedCheckbox)
      expect(acceptedCheckbox).toBeChecked()
    })

    it('should toggle refused checkbox', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const refusedCheckbox = screen.getByLabelText(/refused/i)
      expect(refusedCheckbox).not.toBeChecked()

      await user.click(refusedCheckbox)
      expect(refusedCheckbox).toBeChecked()
    })

    it('should toggle regurgitated checkbox', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      const regurgitatedCheckbox = screen.getByLabelText(/regurgitated/i)
      expect(regurgitatedCheckbox).not.toBeChecked()

      await user.click(regurgitatedCheckbox)
      expect(regurgitatedCheckbox).toBeChecked()
    })
  })

  describe('accessibility', () => {
    it('should have accessible labels for form fields', () => {
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/accepted/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/refused/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/regurgitated/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('should have aria-invalid on fields with errors', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Clear date and submit
      const dateInput = screen.getByLabelText(/date/i)
      await user.clear(dateInput)
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        expect(dateInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have role="alert" on error messages', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedingForm reptileId={testReptileId} onSuccess={mockOnSuccess} />
      )

      // Submit to trigger validation
      await user.click(screen.getByRole('button', { name: /log feeding/i }))

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        expect(alerts.length).toBeGreaterThan(0)
      })
    })
  })
})
