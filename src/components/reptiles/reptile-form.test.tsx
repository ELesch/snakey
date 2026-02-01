// Reptile Form Component Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReptileForm } from './reptile-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the hooks
const mockCreateReptileMutateAsync = vi.fn()
const mockUpdateReptileMutateAsync = vi.fn()

vi.mock('@/hooks', () => ({
  useCreateReptile: () => ({
    mutateAsync: mockCreateReptileMutateAsync,
    isPending: false,
  }),
  useUpdateReptile: () => ({
    mutateAsync: mockUpdateReptileMutateAsync,
    isPending: false,
  }),
}))

// Mock the species defaults
vi.mock('@/lib/species/defaults', () => ({
  getSpeciesOptions: () => [
    { value: 'ball_python', label: 'Ball Python' },
    { value: 'corn_snake', label: 'Corn Snake' },
    { value: 'leopard_gecko', label: 'Leopard Gecko' },
  ],
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

describe('ReptileForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all form fields', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Check for required fields - use getByRole with name for labels or getAllByText for multiple matches
      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
      // Species label exists (use getAllByText since placeholder also contains 'species')
      expect(screen.getAllByText(/species/i).length).toBeGreaterThan(0)
      expect(screen.getByLabelText(/morph/i)).toBeInTheDocument()
      // Sex label exists
      expect(screen.getAllByText(/sex/i).length).toBeGreaterThan(0)
      expect(screen.getByLabelText(/birth.*date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/acquisition date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/make this reptile profile public/i)).toBeInTheDocument()
    })

    it('should render Add Reptile button for new reptile', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      expect(screen.getByRole('button', { name: /add reptile/i })).toBeInTheDocument()
    })

    it('should render Update Reptile button in edit mode', () => {
      renderWithProviders(
        <ReptileForm
          onSuccess={mockOnSuccess}
          reptileId="reptile-123"
          initialData={{ name: 'Monty' }}
        />
      )

      expect(screen.getByRole('button', { name: /update reptile/i })).toBeInTheDocument()
    })

    it('should render Cancel button', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('should populate fields with initial data', () => {
      const initialData = {
        name: 'Monty',
        species: 'ball_python',
        morph: 'Banana Pastel',
        sex: 'MALE' as const,
        notes: 'Friendly snake',
        isPublic: true,
        birthDate: new Date('2022-06-15'),
        acquisitionDate: new Date('2023-01-10'),
      }

      renderWithProviders(
        <ReptileForm
          onSuccess={mockOnSuccess}
          reptileId="reptile-123"
          initialData={initialData}
        />
      )

      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('Monty')
      expect(screen.getByLabelText(/morph/i)).toHaveValue('Banana Pastel')
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Friendly snake')
      expect(screen.getByLabelText(/make this reptile profile public/i)).toBeChecked()
      expect(screen.getByLabelText(/birth.*date/i)).toHaveValue('2022-06-15')
      expect(screen.getByLabelText(/acquisition date/i)).toHaveValue('2023-01-10')
    })
  })

  describe('validation', () => {
    it('should show error when name is only whitespace', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill name with only spaces (bypasses HTML5 required)
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      await user.type(nameInput, '   ')

      // Select species to pass species validation
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Submit form
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i)
      })
    })

    it('should show error when species is not selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill name to pass name validation
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Monty')

      // Submit form - species not selected
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/species is required/i)
      })
    })

    it('should require acquisition date field', () => {
      // The acquisition date field has HTML5 required attribute
      // This test verifies the field is marked as required
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      const acquisitionDateInput = screen.getByLabelText(/acquisition date/i)
      expect(acquisitionDateInput).toBeRequired()
    })
  })

  describe('submission', () => {
    it('should call onSuccess with created reptile on successful submission', async () => {
      const user = userEvent.setup()
      const mockReptile = {
        id: 'new-reptile-123',
        name: 'Monty',
        species: 'ball_python',
        morph: null,
        sex: 'UNKNOWN',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockCreateReptileMutateAsync.mockResolvedValue(mockReptile)

      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill in the form
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Monty')

      // Select species
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Submit form
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(mockCreateReptileMutateAsync).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalledWith(mockReptile)
      })
    })

    it('should call updateMutation in edit mode', async () => {
      const user = userEvent.setup()
      const initialData = {
        name: 'Monty',
        species: 'ball_python',
        acquisitionDate: new Date('2023-01-10'),
      }
      const mockReptile = {
        id: 'reptile-123',
        name: 'Monty Updated',
        species: 'ball_python',
      }
      mockUpdateReptileMutateAsync.mockResolvedValue(mockReptile)

      renderWithProviders(
        <ReptileForm
          onSuccess={mockOnSuccess}
          reptileId="reptile-123"
          initialData={initialData}
        />
      )

      // Update name
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Monty Updated')

      // Submit form
      await user.click(screen.getByRole('button', { name: /update reptile/i }))

      await waitFor(() => {
        expect(mockUpdateReptileMutateAsync).toHaveBeenCalledWith({
          id: 'reptile-123',
          data: expect.objectContaining({
            name: 'Monty Updated',
          }),
        })
        expect(mockOnSuccess).toHaveBeenCalledWith(mockReptile)
      })
    })

    it('should display error message on submission failure', async () => {
      const user = userEvent.setup()
      mockCreateReptileMutateAsync.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill in the form
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Monty')

      // Select species
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Submit form
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
      })
    })
  })

  describe('cancel button', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should call window.history.back when no onCancel provided', async () => {
      const user = userEvent.setup()
      const mockHistoryBack = vi.fn()
      const originalBack = window.history.back
      window.history.back = mockHistoryBack

      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockHistoryBack).toHaveBeenCalledTimes(1)

      window.history.back = originalBack
    })
  })

  describe('species selection', () => {
    it('should display species options in dropdown', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Open species dropdown
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Corn Snake' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Leopard Gecko' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have accessible labels for all form fields', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Verify all inputs have accessible labels
      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/morph/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birth.*date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/acquisition date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/make this reptile profile public/i)).toBeInTheDocument()
    })

    it('should have role="alert" for error messages', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill name with spaces and submit to trigger validation error
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      await user.type(nameInput, '   ')

      // Select species
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Submit to trigger validation
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
