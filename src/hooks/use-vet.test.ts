// Tests for use-vet hooks (VetVisits and Medications)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the API module
const mockFetchVetVisits = vi.fn()
const mockFetchVetVisit = vi.fn()
const mockCreateVetVisit = vi.fn()
const mockUpdateVetVisit = vi.fn()
const mockDeleteVetVisit = vi.fn()
const mockFetchMedications = vi.fn()
const mockFetchMedication = vi.fn()
const mockCreateMedication = vi.fn()
const mockUpdateMedication = vi.fn()
const mockDeleteMedication = vi.fn()

vi.mock('@/lib/api/vet.api', () => ({
  fetchVetVisits: (...args: unknown[]) => mockFetchVetVisits(...args),
  fetchVetVisit: (...args: unknown[]) => mockFetchVetVisit(...args),
  createVetVisit: (...args: unknown[]) => mockCreateVetVisit(...args),
  updateVetVisit: (...args: unknown[]) => mockUpdateVetVisit(...args),
  deleteVetVisit: (...args: unknown[]) => mockDeleteVetVisit(...args),
  fetchMedications: (...args: unknown[]) => mockFetchMedications(...args),
  fetchMedication: (...args: unknown[]) => mockFetchMedication(...args),
  createMedication: (...args: unknown[]) => mockCreateMedication(...args),
  updateMedication: (...args: unknown[]) => mockUpdateMedication(...args),
  deleteMedication: (...args: unknown[]) => mockDeleteMedication(...args),
}))

import {
  useVetVisits,
  useVetVisit,
  useCreateVetVisit,
  useUpdateVetVisit,
  useDeleteVetVisit,
  useMedications,
  useMedication,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  vetKeys,
} from './use-vet'

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

describe('vetKeys', () => {
  it('should generate correct all key', () => {
    expect(vetKeys.all).toEqual(['vet'])
  })

  it('should generate correct visits key', () => {
    expect(vetKeys.visits()).toEqual(['vet', 'visits'])
  })

  it('should generate correct visitList key', () => {
    expect(vetKeys.visitList('reptile-123')).toEqual([
      'vet',
      'visits',
      'list',
      'reptile-123',
      {},
    ])
  })

  it('should generate correct visitList key with filters', () => {
    expect(vetKeys.visitList('reptile-123', { limit: 10 })).toEqual([
      'vet',
      'visits',
      'list',
      'reptile-123',
      { limit: 10 },
    ])
  })

  it('should generate correct visitDetail key', () => {
    expect(vetKeys.visitDetail('visit-456')).toEqual([
      'vet',
      'visits',
      'detail',
      'visit-456',
    ])
  })

  it('should generate correct medications key', () => {
    expect(vetKeys.medications()).toEqual(['vet', 'medications'])
  })

  it('should generate correct medicationList key', () => {
    expect(vetKeys.medicationList('reptile-123')).toEqual([
      'vet',
      'medications',
      'list',
      'reptile-123',
      {},
    ])
  })

  it('should generate correct medicationDetail key', () => {
    expect(vetKeys.medicationDetail('med-456')).toEqual([
      'vet',
      'medications',
      'detail',
      'med-456',
    ])
  })
})

// ============================================================================
// VET VISIT HOOKS
// ============================================================================

describe('useVetVisits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch vet visits', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-123', reason: 'Checkup', date: new Date().toISOString() },
        { id: '2', reptileId: 'reptile-123', reason: 'Illness', date: new Date().toISOString() },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    mockFetchVetVisits.mockResolvedValue(mockData)

    const { result } = renderHook(() => useVetVisits('reptile-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.visits).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(mockFetchVetVisits).toHaveBeenCalledWith('reptile-123', {})
  })

  it('should pass query parameters', async () => {
    mockFetchVetVisits.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })
    const query = { limit: 10 }

    const { result } = renderHook(() => useVetVisits('reptile-123', query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchVetVisits).toHaveBeenCalledWith('reptile-123', query)
  })

  it('should not fetch when reptileId is empty', async () => {
    const { result } = renderHook(() => useVetVisits(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchVetVisits).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('should handle fetch errors', async () => {
    mockFetchVetVisits.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useVetVisits('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return empty array when no visits', async () => {
    mockFetchVetVisits.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })

    const { result } = renderHook(() => useVetVisits('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.visits).toEqual([])
  })
})

describe('useVetVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch a single vet visit', async () => {
    const mockVisit = { id: 'visit-123', reason: 'Checkup', date: new Date().toISOString() }
    mockFetchVetVisit.mockResolvedValue(mockVisit)

    const { result } = renderHook(() => useVetVisit('visit-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockVisit)
    expect(mockFetchVetVisit).toHaveBeenCalledWith('visit-123')
  })

  it('should not fetch when visitId is empty', async () => {
    const { result } = renderHook(() => useVetVisit(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchVetVisit).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })
})

describe('useCreateVetVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a vet visit', async () => {
    const newVisit = {
      id: 'new-visit',
      reptileId: 'reptile-123',
      reason: 'Annual checkup',
      date: new Date().toISOString(),
      veterinarian: 'Dr. Smith',
    }
    mockCreateVetVisit.mockResolvedValue(newVisit)

    const { result } = renderHook(() => useCreateVetVisit('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const created = await result.current.mutateAsync({
        reason: 'Annual checkup',
        date: new Date().toISOString(),
        veterinarian: 'Dr. Smith',
      })
      expect(created).toEqual(newVisit)
    })

    expect(mockCreateVetVisit).toHaveBeenCalledWith('reptile-123', expect.objectContaining({
      reason: 'Annual checkup',
      veterinarian: 'Dr. Smith',
    }))
  })

  it('should handle creation errors', async () => {
    mockCreateVetVisit.mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateVetVisit('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          reason: '',
          date: new Date().toISOString(),
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Validation error')
      }
    })
  })
})

describe('useUpdateVetVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update a vet visit', async () => {
    const updatedVisit = {
      id: 'visit-123',
      reason: 'Updated reason',
      notes: 'Some notes',
    }
    mockUpdateVetVisit.mockResolvedValue(updatedVisit)

    const { result } = renderHook(() => useUpdateVetVisit(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        visitId: 'visit-123',
        data: { reason: 'Updated reason', notes: 'Some notes' },
      })
      expect(updated).toEqual(updatedVisit)
    })

    expect(mockUpdateVetVisit).toHaveBeenCalledWith('visit-123', {
      reason: 'Updated reason',
      notes: 'Some notes',
    })
  })

  it('should handle update errors', async () => {
    mockUpdateVetVisit.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateVetVisit(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          visitId: 'visit-123',
          data: { reason: 'Test' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })
})

describe('useDeleteVetVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete a vet visit', async () => {
    const deleteResult = { id: 'visit-123', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeleteVetVisit.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeleteVetVisit(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('visit-123')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeleteVetVisit).toHaveBeenCalledWith('visit-123')
  })

  it('should handle delete errors', async () => {
    mockDeleteVetVisit.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteVetVisit(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('visit-123')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})

// ============================================================================
// MEDICATION HOOKS
// ============================================================================

describe('useMedications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch medications', async () => {
    const mockData = {
      data: [
        { id: '1', reptileId: 'reptile-123', name: 'Antibiotic', dosage: '10mg' },
        { id: '2', reptileId: 'reptile-123', name: 'Vitamin', dosage: '5mg' },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    mockFetchMedications.mockResolvedValue(mockData)

    const { result } = renderHook(() => useMedications('reptile-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.medications).toEqual(mockData.data)
    expect(result.current.meta).toEqual(mockData.meta)
    expect(mockFetchMedications).toHaveBeenCalledWith('reptile-123', {})
  })

  it('should pass query parameters', async () => {
    mockFetchMedications.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } })
    const query = { limit: 10 }

    const { result } = renderHook(() => useMedications('reptile-123', query), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockFetchMedications).toHaveBeenCalledWith('reptile-123', query)
  })

  it('should not fetch when reptileId is empty', async () => {
    const { result } = renderHook(() => useMedications(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchMedications).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('should handle fetch errors', async () => {
    mockFetchMedications.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useMedications('reptile-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch a single medication', async () => {
    const mockMedication = { id: 'med-123', name: 'Antibiotic', dosage: '10mg' }
    mockFetchMedication.mockResolvedValue(mockMedication)

    const { result } = renderHook(() => useMedication('med-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockMedication)
    expect(mockFetchMedication).toHaveBeenCalledWith('med-123')
  })

  it('should not fetch when medicationId is empty', async () => {
    const { result } = renderHook(() => useMedication(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFetchMedication).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })
})

describe('useCreateMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a medication', async () => {
    const newMedication = {
      id: 'new-med',
      reptileId: 'reptile-123',
      name: 'Antibiotic',
      dosage: '10mg',
      frequency: 'Twice daily',
      startDate: new Date().toISOString(),
    }
    mockCreateMedication.mockResolvedValue(newMedication)

    const { result } = renderHook(() => useCreateMedication('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const created = await result.current.mutateAsync({
        name: 'Antibiotic',
        dosage: '10mg',
        frequency: 'Twice daily',
        startDate: new Date().toISOString(),
      })
      expect(created).toEqual(newMedication)
    })

    expect(mockCreateMedication).toHaveBeenCalledWith('reptile-123', expect.objectContaining({
      name: 'Antibiotic',
      dosage: '10mg',
    }))
  })

  it('should handle creation errors', async () => {
    mockCreateMedication.mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateMedication('reptile-123'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          name: '',
          dosage: '10mg',
          startDate: new Date().toISOString(),
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Validation error')
      }
    })
  })
})

describe('useUpdateMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update a medication', async () => {
    const updatedMedication = {
      id: 'med-123',
      name: 'Updated Antibiotic',
      dosage: '15mg',
    }
    mockUpdateMedication.mockResolvedValue(updatedMedication)

    const { result } = renderHook(() => useUpdateMedication(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const updated = await result.current.mutateAsync({
        medicationId: 'med-123',
        data: { name: 'Updated Antibiotic', dosage: '15mg' },
      })
      expect(updated).toEqual(updatedMedication)
    })

    expect(mockUpdateMedication).toHaveBeenCalledWith('med-123', {
      name: 'Updated Antibiotic',
      dosage: '15mg',
    })
  })

  it('should handle update errors', async () => {
    mockUpdateMedication.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateMedication(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          medicationId: 'med-123',
          data: { name: 'Test' },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Update failed')
      }
    })
  })
})

describe('useDeleteMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete a medication', async () => {
    const deleteResult = { id: 'med-123', deletedAt: '2024-01-15T00:00:00.000Z' }
    mockDeleteMedication.mockResolvedValue(deleteResult)

    const { result } = renderHook(() => useDeleteMedication(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const deleted = await result.current.mutateAsync('med-123')
      expect(deleted).toEqual(deleteResult)
    })

    expect(mockDeleteMedication).toHaveBeenCalledWith('med-123')
  })

  it('should handle delete errors', async () => {
    mockDeleteMedication.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteMedication(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('med-123')
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed')
      }
    })
  })
})
