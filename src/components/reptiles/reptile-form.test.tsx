// Reptile Form Component Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReptileForm } from './reptile-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock URL.createObjectURL and URL.revokeObjectURL for ImagePicker
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Mock the hooks
const mockCreateReptileMutateAsync = vi.fn()
const mockUpdateReptileMutateAsync = vi.fn()
const mockUploadPhotoMutateAsync = vi.fn()

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

vi.mock('@/hooks/use-photos', () => ({
  useUploadPhoto: () => ({
    mutateAsync: mockUploadPhotoMutateAsync,
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

// Mock the measurements config
vi.mock('@/lib/species/measurements', () => ({
  getMeasurementTypesForSpecies: (species: string) => {
    const map: Record<string, string[]> = {
      ball_python: ['WEIGHT', 'LENGTH'],
      corn_snake: ['WEIGHT', 'LENGTH'],
      leopard_gecko: ['WEIGHT', 'LENGTH', 'SNOUT_TO_VENT'],
    }
    return map[species] || ['WEIGHT', 'LENGTH']
  },
  MEASUREMENT_LABELS: {
    WEIGHT: 'Weight',
    LENGTH: 'Length',
    SHELL_LENGTH: 'Shell Length',
    SHELL_WIDTH: 'Shell Width',
    SNOUT_TO_VENT: 'Snout-to-Vent',
    TAIL_LENGTH: 'Tail Length',
  },
  MEASUREMENT_UNITS: {
    WEIGHT: 'g',
    LENGTH: 'cm',
    SHELL_LENGTH: 'cm',
    SHELL_WIDTH: 'cm',
    SNOUT_TO_VENT: 'cm',
    TAIL_LENGTH: 'cm',
  },
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
    // Reset fetch mock for photo/weight API calls
    global.fetch = vi.fn()
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

    it('should render Save button in edit mode', () => {
      renderWithProviders(
        <ReptileForm
          onSuccess={mockOnSuccess}
          reptileId="reptile-123"
          initialData={{ name: 'Monty' }}
        />
      )

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
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

    it('should validate acquisition date is required when cleared', async () => {
      // The acquisition date field defaults to today but is validated on submit
      // This test verifies validation behavior when the field is empty
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill name and species
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Monty')
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Clear the acquisition date field
      const acquisitionDateInput = screen.getByLabelText(/acquisition date/i)
      await user.clear(acquisitionDateInput)

      // Submit form
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/acquisition date is required/i)
      })
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
      await user.click(screen.getByRole('button', { name: /save/i }))

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

  describe('species-aware measurements section', () => {
    it('should not show measurements section when no species is selected', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      expect(screen.queryByText(/initial measurements/i)).not.toBeInTheDocument()
    })

    it('should show measurements section when species is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Select species
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
      })
    })

    it('should show weight and length fields for snakes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Select ball python
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Wait for measurements section to appear
      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
      })

      // Check for weight and length fields (initial)
      expect(screen.getByLabelText(/^Weight \(g\)$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Length \(cm\)$/i)).toBeInTheDocument()
    })

    it('should show snout-to-vent field for geckos', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Select leopard gecko
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Leopard Gecko' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Leopard Gecko' }))

      // Wait for measurements section to appear
      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
      })

      // Check for gecko-specific fields (initial)
      expect(screen.getByLabelText(/^Weight \(g\)$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Length \(cm\)$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Snout-to-Vent \(cm\)$/i)).toBeInTheDocument()
    })

    it('should accept numeric measurement values', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Select species first
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Wait for measurements section to appear
      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
      })

      const weightInput = screen.getByLabelText(/^Weight \(g\)$/i)
      await user.type(weightInput, '150')

      expect(weightInput).toHaveValue(150)
    })

    it('should show validation error for negative measurement value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill required fields
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Monty')
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Wait for measurements section to appear
      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
      })

      // Enter negative weight
      const weightInput = screen.getByLabelText(/^Weight \(g\)$/i)
      await user.type(weightInput, '-50')

      // Submit form
      await user.click(screen.getByRole('button', { name: /add reptile/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument()
      })
    })

    it('should allow empty measurements (optional)', async () => {
      const user = userEvent.setup()
      const mockReptile = {
        id: 'new-reptile-123',
        name: 'Monty',
        species: 'ball_python',
      }
      mockCreateReptileMutateAsync.mockResolvedValue(mockReptile)

      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Fill required fields only (no measurements)
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Monty')
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

    it('should not show current measurements section when acquisition date is today', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Select species (acquisition date defaults to today)
      const speciesTrigger = screen.getAllByRole('combobox')[0]
      await user.click(speciesTrigger)
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Ball Python' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: 'Ball Python' }))

      // Wait for initial measurements section to appear
      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
      })

      // Current measurements section should not be visible when acquisition date is today
      // The form defaults acquisitionDate to today, so we should only see "Initial Measurements"
      // and NOT "Current Measurements"
      expect(screen.queryByText(/^current measurements/i)).not.toBeInTheDocument()
    })

    it('should show current measurements section when acquisition date is in the past', async () => {
      const user = userEvent.setup()
      const initialData = {
        name: 'Monty',
        species: 'ball_python',
        acquisitionDate: new Date('2023-01-10'),
      }

      renderWithProviders(
        <ReptileForm
          onSuccess={mockOnSuccess}
          reptileId="reptile-123"
          initialData={initialData}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/initial measurements/i)).toBeInTheDocument()
        expect(screen.getByText(/current measurements/i)).toBeInTheDocument()
      })
    })
  })

  describe('profile photo (ImagePicker)', () => {
    it('should render ImagePicker component', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      expect(screen.getByText('Profile Photo')).toBeInTheDocument()
      expect(screen.getByText('Drag and drop an image here')).toBeInTheDocument()
    })

    it('should render ImagePicker with existing photo URL in edit mode', () => {
      const initialData = {
        name: 'Monty',
        species: 'ball_python',
        acquisitionDate: new Date('2023-01-10'),
      }

      renderWithProviders(
        <ReptileForm
          onSuccess={mockOnSuccess}
          reptileId="reptile-123"
          initialData={initialData}
          existingProfilePhotoUrl="https://example.com/photo.jpg"
        />
      )

      const img = screen.getByRole('img', { name: 'Preview' })
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    })

    it('should allow selecting a profile image', async () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        const img = screen.getByRole('img', { name: 'Preview' })
        expect(img).toHaveAttribute('src', 'blob:mock-url')
      })
    })

    it('should allow removing selected profile image', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      // Select an image first
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument()
      })

      // Remove the image
      await user.click(screen.getByRole('button', { name: 'Remove image' }))

      await waitFor(() => {
        expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument()
        expect(screen.getByText('Drag and drop an image here')).toBeInTheDocument()
      })
    })

    it('should show ImagePicker with accepted file types', () => {
      renderWithProviders(<ReptileForm onSuccess={mockOnSuccess} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/heic')
    })
  })
})
