// Shed Validation Schema Tests
import { describe, it, expect } from 'vitest'
import {
  ShedCreateSchema,
  ShedUpdateSchema,
  ShedQuerySchema,
  ShedQualityEnum,
} from './shed'

describe('ShedQualityEnum', () => {
  it('should accept valid quality values', () => {
    expect(ShedQualityEnum.parse('COMPLETE')).toBe('COMPLETE')
    expect(ShedQualityEnum.parse('PARTIAL')).toBe('PARTIAL')
    expect(ShedQualityEnum.parse('PROBLEMATIC')).toBe('PROBLEMATIC')
  })

  it('should reject invalid quality values', () => {
    expect(() => ShedQualityEnum.parse('INVALID')).toThrow()
    expect(() => ShedQualityEnum.parse('complete')).toThrow()
    expect(() => ShedQualityEnum.parse('')).toThrow()
  })
})

describe('ShedCreateSchema', () => {
  const validData = {
    completedDate: new Date('2024-01-15'),
    quality: 'COMPLETE',
  }

  it('should validate correct data', () => {
    const result = ShedCreateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should require completedDate', () => {
    const result = ShedCreateSchema.safeParse({ quality: 'COMPLETE' })
    expect(result.success).toBe(false)
  })

  it('should require quality', () => {
    const result = ShedCreateSchema.safeParse({
      completedDate: new Date(),
    })
    expect(result.success).toBe(false)
  })

  it('should reject future completedDate', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    const result = ShedCreateSchema.safeParse({
      ...validData,
      completedDate: futureDate,
    })
    expect(result.success).toBe(false)
  })

  it('should accept optional startDate', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      startDate: new Date('2024-01-10'),
    })
    expect(result.success).toBe(true)
  })

  it('should reject completedDate before startDate', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      startDate: new Date('2024-01-20'),
      completedDate: new Date('2024-01-15'),
    })
    expect(result.success).toBe(false)
  })

  it('should default isComplete to true', () => {
    const result = ShedCreateSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isComplete).toBe(true)
    }
  })

  it('should accept optional notes', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      notes: 'Clean shed in one piece',
    })
    expect(result.success).toBe(true)
  })

  it('should reject notes over 2000 characters', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      notes: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('should accept optional issues', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      issues: 'Retained eye caps',
    })
    expect(result.success).toBe(true)
  })

  it('should reject issues over 500 characters', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      issues: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('should accept optional id for offline-created records', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      id: 'clxxxxxxxxxxxxxxxxxx',
    })
    expect(result.success).toBe(true)
  })

  it('should coerce string dates to Date objects', () => {
    const result = ShedCreateSchema.safeParse({
      ...validData,
      completedDate: '2024-01-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.completedDate).toBeInstanceOf(Date)
    }
  })
})

describe('ShedUpdateSchema', () => {
  it('should accept empty updates', () => {
    const result = ShedUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept quality update', () => {
    const result = ShedUpdateSchema.safeParse({ quality: 'PARTIAL' })
    expect(result.success).toBe(true)
  })

  it('should accept notes update', () => {
    const result = ShedUpdateSchema.safeParse({ notes: 'Updated notes' })
    expect(result.success).toBe(true)
  })

  it('should accept completedDate update', () => {
    const result = ShedUpdateSchema.safeParse({
      completedDate: new Date('2024-01-20'),
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid quality', () => {
    const result = ShedUpdateSchema.safeParse({ quality: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should accept isComplete update', () => {
    const result = ShedUpdateSchema.safeParse({ isComplete: false })
    expect(result.success).toBe(true)
  })
})

describe('ShedQuerySchema', () => {
  it('should provide default values', () => {
    const result = ShedQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.sort).toBe('completedDate')
      expect(result.data.order).toBe('desc')
    }
  })

  it('should accept custom pagination', () => {
    const result = ShedQuerySchema.safeParse({ page: 3, limit: 50 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(50)
    }
  })

  it('should reject limit over 100', () => {
    const result = ShedQuerySchema.safeParse({ limit: 150 })
    expect(result.success).toBe(false)
  })

  it('should accept quality filter', () => {
    const result = ShedQuerySchema.safeParse({ quality: 'COMPLETE' })
    expect(result.success).toBe(true)
  })

  it('should accept date range filters', () => {
    const result = ShedQuerySchema.safeParse({
      startAfter: '2024-01-01',
      endBefore: '2024-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('should accept sort options', () => {
    const result = ShedQuerySchema.safeParse({
      sort: 'createdAt',
      order: 'asc',
    })
    expect(result.success).toBe(true)
  })

  it('should coerce string numbers to integers', () => {
    const result = ShedQuerySchema.safeParse({ page: '2', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(10)
    }
  })
})
