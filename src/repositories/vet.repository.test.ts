// Vet Repository Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VetRepository } from './vet.repository'
import { prisma } from '@/lib/db/client'
import type { VetVisit, Medication } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    vetVisit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    medication: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock vet visit for testing
const mockVetVisit: VetVisit = {
  id: 'clvet123456789',
  reptileId: 'clreptile123456',
  date: new Date('2024-01-15'),
  reason: 'Annual checkup',
  diagnosis: 'Healthy',
  treatment: 'None needed',
  vetName: 'Dr. Smith',
  vetClinic: 'Exotic Animal Clinic',
  cost: new Prisma.Decimal(150.0),
  followUp: new Date('2025-01-15'),
  notes: 'Recommended annual checkup',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

const mockVetVisit2: VetVisit = {
  ...mockVetVisit,
  id: 'clvet123456790',
  date: new Date('2023-06-01'),
  reason: 'Respiratory infection',
  diagnosis: 'Mild RI',
  treatment: 'Antibiotics',
}

// Mock medication for testing
const mockMedication: Medication = {
  id: 'clmed123456789',
  reptileId: 'clreptile123456',
  name: 'Baytril',
  dosage: '0.1ml',
  frequency: 'Once daily',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-29'),
  notes: 'For respiratory infection',
  reminders: true,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

const mockActiveMedication: Medication = {
  ...mockMedication,
  id: 'clmed123456790',
  name: 'Vitamin supplement',
  endDate: null, // No end date - ongoing
}

describe('VetRepository', () => {
  let repository: VetRepository

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-20'))
    repository = new VetRepository()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==========================================================================
  // VET VISIT TESTS
  // ==========================================================================

  describe('Vet Visits', () => {
    describe('findManyVisits', () => {
      it('should return vet visits for a reptile with default options', async () => {
        vi.mocked(prisma.vetVisit.findMany).mockResolvedValue([mockVetVisit])

        const result = await repository.findManyVisits({ reptileId: 'clreptile123456' })

        expect(result).toEqual([mockVetVisit])
        expect(prisma.vetVisit.findMany).toHaveBeenCalledWith({
          where: {
            reptileId: 'clreptile123456',
          },
          skip: 0,
          take: 20,
          orderBy: { date: 'desc' },
        })
      })

      it('should apply pagination options', async () => {
        vi.mocked(prisma.vetVisit.findMany).mockResolvedValue([mockVetVisit])

        await repository.findManyVisits({ reptileId: 'clreptile123456', skip: 5, take: 10 })

        expect(prisma.vetVisit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 5,
            take: 10,
          })
        )
      })

      it('should apply custom orderBy', async () => {
        vi.mocked(prisma.vetVisit.findMany).mockResolvedValue([mockVetVisit])

        await repository.findManyVisits({
          reptileId: 'clreptile123456',
          orderBy: { cost: 'desc' },
        })

        expect(prisma.vetVisit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { cost: 'desc' },
          })
        )
      })

      it('should filter by date range (both dates)', async () => {
        vi.mocked(prisma.vetVisit.findMany).mockResolvedValue([mockVetVisit])
        const startDate = new Date('2024-01-01')
        const endDate = new Date('2024-01-31')

        await repository.findManyVisits({ reptileId: 'clreptile123456', startDate, endDate })

        expect(prisma.vetVisit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              date: { gte: startDate, lte: endDate },
            }),
          })
        )
      })

      it('should filter by startDate only', async () => {
        vi.mocked(prisma.vetVisit.findMany).mockResolvedValue([mockVetVisit])
        const startDate = new Date('2024-01-01')

        await repository.findManyVisits({ reptileId: 'clreptile123456', startDate })

        expect(prisma.vetVisit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              date: { gte: startDate },
            }),
          })
        )
      })

      it('should filter by endDate only', async () => {
        vi.mocked(prisma.vetVisit.findMany).mockResolvedValue([mockVetVisit])
        const endDate = new Date('2024-01-31')

        await repository.findManyVisits({ reptileId: 'clreptile123456', endDate })

        expect(prisma.vetVisit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              date: { lte: endDate },
            }),
          })
        )
      })
    })

    describe('countVisits', () => {
      it('should return count for a reptile', async () => {
        vi.mocked(prisma.vetVisit.count).mockResolvedValue(5)

        const result = await repository.countVisits({ reptileId: 'clreptile123456' })

        expect(result).toBe(5)
        expect(prisma.vetVisit.count).toHaveBeenCalledWith({
          where: {
            reptileId: 'clreptile123456',
          },
        })
      })

      it('should count with date range', async () => {
        vi.mocked(prisma.vetVisit.count).mockResolvedValue(2)
        const startDate = new Date('2024-01-01')
        const endDate = new Date('2024-01-31')

        await repository.countVisits({ reptileId: 'clreptile123456', startDate, endDate })

        expect(prisma.vetVisit.count).toHaveBeenCalledWith({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
          }),
        })
      })
    })

    describe('findVisitById', () => {
      it('should return vet visit by id', async () => {
        vi.mocked(prisma.vetVisit.findUnique).mockResolvedValue(mockVetVisit)

        const result = await repository.findVisitById('clvet123456789')

        expect(result).toEqual(mockVetVisit)
        expect(prisma.vetVisit.findUnique).toHaveBeenCalledWith({
          where: { id: 'clvet123456789' },
          include: undefined,
        })
      })

      it('should return null when vet visit not found', async () => {
        vi.mocked(prisma.vetVisit.findUnique).mockResolvedValue(null)

        const result = await repository.findVisitById('nonexistent')

        expect(result).toBeNull()
      })

      it('should include reptile when requested', async () => {
        const visitWithReptile = {
          ...mockVetVisit,
          reptile: { id: 'clreptile123456', userId: 'user-123', deletedAt: null },
        }
        vi.mocked(prisma.vetVisit.findUnique).mockResolvedValue(visitWithReptile)

        await repository.findVisitById('clvet123456789', { includeReptile: true })

        expect(prisma.vetVisit.findUnique).toHaveBeenCalledWith({
          where: { id: 'clvet123456789' },
          include: {
            reptile: {
              select: {
                id: true,
                userId: true,
                deletedAt: true,
              },
            },
          },
        })
      })
    })

    describe('createVisit', () => {
      it('should create a new vet visit with required fields', async () => {
        const createData = {
          reptileId: 'clreptile123456',
          date: new Date('2024-01-20'),
          reason: 'Emergency visit',
        }
        vi.mocked(prisma.vetVisit.create).mockResolvedValue({ ...mockVetVisit, ...createData })

        const result = await repository.createVisit(createData)

        expect(result.reason).toBe('Emergency visit')
        expect(prisma.vetVisit.create).toHaveBeenCalledWith({
          data: {
            reptileId: 'clreptile123456',
            date: createData.date,
            reason: 'Emergency visit',
            diagnosis: null,
            treatment: null,
            vetName: null,
            vetClinic: null,
            cost: null,
            followUp: null,
            notes: null,
          },
        })
      })

      it('should create vet visit with all optional fields', async () => {
        const createData = {
          reptileId: 'clreptile123456',
          date: new Date('2024-01-20'),
          reason: 'Scale rot',
          diagnosis: 'Bacterial infection',
          treatment: 'Topical antibiotics',
          vetName: 'Dr. Jones',
          vetClinic: 'Reptile Hospital',
          cost: 200.0,
          followUp: new Date('2024-02-20'),
          notes: 'Follow up in one month',
        }
        const createdVisit: VetVisit = {
          ...mockVetVisit,
          ...createData,
          cost: new Prisma.Decimal(200.0),
        }
        vi.mocked(prisma.vetVisit.create).mockResolvedValue(createdVisit)

        await repository.createVisit(createData)

        expect(prisma.vetVisit.create).toHaveBeenCalledWith({
          data: createData,
        })
      })

      it('should create vet visit with client-provided id', async () => {
        const createData = {
          id: 'custom-vet-id',
          reptileId: 'clreptile123456',
          date: new Date('2024-01-20'),
          reason: 'Checkup',
        }
        vi.mocked(prisma.vetVisit.create).mockResolvedValue({ ...mockVetVisit, ...createData })

        await repository.createVisit(createData)

        expect(prisma.vetVisit.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: 'custom-vet-id',
          }),
        })
      })
    })

    describe('updateVisit', () => {
      it('should update a vet visit', async () => {
        const updatedVisit = { ...mockVetVisit, diagnosis: 'Updated diagnosis' }
        vi.mocked(prisma.vetVisit.update).mockResolvedValue(updatedVisit)

        const result = await repository.updateVisit('clvet123456789', { diagnosis: 'Updated diagnosis' })

        expect(result.diagnosis).toBe('Updated diagnosis')
        expect(prisma.vetVisit.update).toHaveBeenCalledWith({
          where: { id: 'clvet123456789' },
          data: { diagnosis: 'Updated diagnosis' },
        })
      })

      it('should update cost', async () => {
        vi.mocked(prisma.vetVisit.update).mockResolvedValue({ ...mockVetVisit, cost: new Prisma.Decimal(250.0) })

        await repository.updateVisit('clvet123456789', { cost: 250.0 })

        expect(prisma.vetVisit.update).toHaveBeenCalledWith({
          where: { id: 'clvet123456789' },
          data: { cost: 250.0 },
        })
      })
    })

    describe('deleteVisit', () => {
      it('should delete a vet visit', async () => {
        vi.mocked(prisma.vetVisit.delete).mockResolvedValue(mockVetVisit)

        const result = await repository.deleteVisit('clvet123456789')

        expect(result).toEqual(mockVetVisit)
        expect(prisma.vetVisit.delete).toHaveBeenCalledWith({
          where: { id: 'clvet123456789' },
        })
      })
    })
  })

  // ==========================================================================
  // MEDICATION TESTS
  // ==========================================================================

  describe('Medications', () => {
    describe('findManyMedications', () => {
      it('should return medications for a reptile with default options', async () => {
        vi.mocked(prisma.medication.findMany).mockResolvedValue([mockMedication])

        const result = await repository.findManyMedications({ reptileId: 'clreptile123456' })

        expect(result).toEqual([mockMedication])
        expect(prisma.medication.findMany).toHaveBeenCalledWith({
          where: {
            reptileId: 'clreptile123456',
          },
          skip: 0,
          take: 20,
          orderBy: { startDate: 'desc' },
        })
      })

      it('should apply pagination options', async () => {
        vi.mocked(prisma.medication.findMany).mockResolvedValue([mockMedication])

        await repository.findManyMedications({ reptileId: 'clreptile123456', skip: 5, take: 10 })

        expect(prisma.medication.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 5,
            take: 10,
          })
        )
      })

      it('should filter active medications only', async () => {
        vi.mocked(prisma.medication.findMany).mockResolvedValue([mockActiveMedication])
        const now = new Date('2024-01-20')

        await repository.findManyMedications({ reptileId: 'clreptile123456', activeOnly: true })

        expect(prisma.medication.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              reptileId: 'clreptile123456',
              startDate: { lte: now },
              OR: [
                { endDate: null },
                { endDate: { gte: now } },
              ],
            },
          })
        )
      })
    })

    describe('countMedications', () => {
      it('should return count for a reptile', async () => {
        vi.mocked(prisma.medication.count).mockResolvedValue(3)

        const result = await repository.countMedications({ reptileId: 'clreptile123456' })

        expect(result).toBe(3)
        expect(prisma.medication.count).toHaveBeenCalledWith({
          where: {
            reptileId: 'clreptile123456',
          },
        })
      })

      it('should count active medications only', async () => {
        vi.mocked(prisma.medication.count).mockResolvedValue(1)
        const now = new Date('2024-01-20')

        await repository.countMedications({ reptileId: 'clreptile123456', activeOnly: true })

        expect(prisma.medication.count).toHaveBeenCalledWith({
          where: {
            reptileId: 'clreptile123456',
            startDate: { lte: now },
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        })
      })
    })

    describe('findMedicationById', () => {
      it('should return medication by id', async () => {
        vi.mocked(prisma.medication.findUnique).mockResolvedValue(mockMedication)

        const result = await repository.findMedicationById('clmed123456789')

        expect(result).toEqual(mockMedication)
        expect(prisma.medication.findUnique).toHaveBeenCalledWith({
          where: { id: 'clmed123456789' },
          include: undefined,
        })
      })

      it('should return null when medication not found', async () => {
        vi.mocked(prisma.medication.findUnique).mockResolvedValue(null)

        const result = await repository.findMedicationById('nonexistent')

        expect(result).toBeNull()
      })

      it('should include reptile when requested', async () => {
        const medWithReptile = {
          ...mockMedication,
          reptile: { id: 'clreptile123456', userId: 'user-123', deletedAt: null },
        }
        vi.mocked(prisma.medication.findUnique).mockResolvedValue(medWithReptile)

        await repository.findMedicationById('clmed123456789', { includeReptile: true })

        expect(prisma.medication.findUnique).toHaveBeenCalledWith({
          where: { id: 'clmed123456789' },
          include: {
            reptile: {
              select: {
                id: true,
                userId: true,
                deletedAt: true,
              },
            },
          },
        })
      })
    })

    describe('createMedication', () => {
      it('should create a new medication with required fields', async () => {
        const createData = {
          reptileId: 'clreptile123456',
          name: 'Antibiotic',
          dosage: '0.2ml',
          frequency: 'Twice daily',
          startDate: new Date('2024-01-20'),
        }
        vi.mocked(prisma.medication.create).mockResolvedValue({ ...mockMedication, ...createData })

        const result = await repository.createMedication(createData)

        expect(result.name).toBe('Antibiotic')
        expect(prisma.medication.create).toHaveBeenCalledWith({
          data: {
            reptileId: 'clreptile123456',
            name: 'Antibiotic',
            dosage: '0.2ml',
            frequency: 'Twice daily',
            startDate: createData.startDate,
            endDate: null,
            notes: null,
            reminders: false,
          },
        })
      })

      it('should create medication with all optional fields', async () => {
        const createData = {
          reptileId: 'clreptile123456',
          name: 'Pain relief',
          dosage: '0.1ml',
          frequency: 'Every 12 hours',
          startDate: new Date('2024-01-20'),
          endDate: new Date('2024-01-27'),
          notes: 'Post-surgery pain management',
          reminders: true,
        }
        vi.mocked(prisma.medication.create).mockResolvedValue({ ...mockMedication, ...createData })

        await repository.createMedication(createData)

        expect(prisma.medication.create).toHaveBeenCalledWith({
          data: createData,
        })
      })

      it('should create medication with client-provided id', async () => {
        const createData = {
          id: 'custom-med-id',
          reptileId: 'clreptile123456',
          name: 'Vitamin D',
          dosage: '1 drop',
          frequency: 'Weekly',
          startDate: new Date('2024-01-20'),
        }
        vi.mocked(prisma.medication.create).mockResolvedValue({ ...mockMedication, ...createData })

        await repository.createMedication(createData)

        expect(prisma.medication.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: 'custom-med-id',
          }),
        })
      })
    })

    describe('updateMedication', () => {
      it('should update a medication', async () => {
        const updatedMed = { ...mockMedication, dosage: '0.15ml' }
        vi.mocked(prisma.medication.update).mockResolvedValue(updatedMed)

        const result = await repository.updateMedication('clmed123456789', { dosage: '0.15ml' })

        expect(result.dosage).toBe('0.15ml')
        expect(prisma.medication.update).toHaveBeenCalledWith({
          where: { id: 'clmed123456789' },
          data: { dosage: '0.15ml' },
        })
      })

      it('should end a medication', async () => {
        const endDate = new Date('2024-01-25')
        vi.mocked(prisma.medication.update).mockResolvedValue({ ...mockMedication, endDate })

        await repository.updateMedication('clmed123456789', { endDate })

        expect(prisma.medication.update).toHaveBeenCalledWith({
          where: { id: 'clmed123456789' },
          data: { endDate },
        })
      })

      it('should toggle reminders', async () => {
        vi.mocked(prisma.medication.update).mockResolvedValue({ ...mockMedication, reminders: false })

        await repository.updateMedication('clmed123456789', { reminders: false })

        expect(prisma.medication.update).toHaveBeenCalledWith({
          where: { id: 'clmed123456789' },
          data: { reminders: false },
        })
      })
    })

    describe('deleteMedication', () => {
      it('should delete a medication', async () => {
        vi.mocked(prisma.medication.delete).mockResolvedValue(mockMedication)

        const result = await repository.deleteMedication('clmed123456789')

        expect(result).toEqual(mockMedication)
        expect(prisma.medication.delete).toHaveBeenCalledWith({
          where: { id: 'clmed123456789' },
        })
      })
    })

    describe('findActiveMedications', () => {
      it('should return only active medications', async () => {
        vi.mocked(prisma.medication.findMany).mockResolvedValue([mockActiveMedication])
        const now = new Date('2024-01-20')

        const result = await repository.findActiveMedications('clreptile123456')

        expect(result).toEqual([mockActiveMedication])
        expect(prisma.medication.findMany).toHaveBeenCalledWith({
          where: {
            reptileId: 'clreptile123456',
            startDate: { lte: now },
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
          orderBy: { startDate: 'asc' },
        })
      })
    })
  })
})
