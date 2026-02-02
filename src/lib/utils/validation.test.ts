// Tests for validation utility functions
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validateSchema, safeValidateSchema } from './validation'
import { ValidationError } from '@/lib/errors'

// Test schema with multiple fields
const TestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0, 'Age must be positive').max(150, 'Age is too high'),
})

describe('validateSchema', () => {
  it('should return validated data for valid input', () => {
    const validData = { name: 'John', email: 'john@example.com', age: 30 }
    const result = validateSchema(TestSchema, validData)

    expect(result).toEqual(validData)
  })

  it('should throw ValidationError with fieldErrors for single invalid field', () => {
    const invalidData = { name: '', email: 'john@example.com', age: 30 }

    expect(() => validateSchema(TestSchema, invalidData)).toThrow(ValidationError)

    try {
      validateSchema(TestSchema, invalidData)
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      const validationError = error as ValidationError
      expect(validationError.message).toBe('Validation failed')
      expect(validationError.fieldErrors).toBeDefined()
      expect(validationError.fieldErrors!['name']).toContain('Name is required')
    }
  })

  it('should collect ALL field errors, not just the first', () => {
    const invalidData = { name: '', email: 'invalid-email', age: -5 }

    try {
      validateSchema(TestSchema, invalidData)
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      const validationError = error as ValidationError
      expect(validationError.fieldErrors).toBeDefined()

      // Should have errors for all three invalid fields
      expect(validationError.fieldErrors!['name']).toContain('Name is required')
      expect(validationError.fieldErrors!['email']).toContain('Invalid email format')
      expect(validationError.fieldErrors!['age']).toContain('Age must be positive')
    }
  })

  it('should handle nested object paths', () => {
    const NestedSchema = z.object({
      user: z.object({
        profile: z.object({
          firstName: z.string().min(1, 'First name is required'),
        }),
      }),
    })

    const invalidData = { user: { profile: { firstName: '' } } }

    try {
      validateSchema(NestedSchema, invalidData)
    } catch (error) {
      const validationError = error as ValidationError
      expect(validationError.fieldErrors).toBeDefined()
      // Nested path should be joined with dots
      expect(validationError.fieldErrors!['user.profile.firstName']).toContain(
        'First name is required'
      )
    }
  })

  it('should handle array index paths', () => {
    const ArraySchema = z.object({
      items: z.array(
        z.object({
          name: z.string().min(1, 'Item name required'),
        })
      ),
    })

    const invalidData = { items: [{ name: 'valid' }, { name: '' }] }

    try {
      validateSchema(ArraySchema, invalidData)
    } catch (error) {
      const validationError = error as ValidationError
      expect(validationError.fieldErrors).toBeDefined()
      // Array index should be in the path
      expect(validationError.fieldErrors!['items.1.name']).toContain('Item name required')
    }
  })

  it('should handle multiple errors on the same field', () => {
    const MultiErrorSchema = z.object({
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter')
        .regex(/[0-9]/, 'Password must contain a number'),
    })

    const invalidData = { password: 'ab' } // Too short, no uppercase, no number

    try {
      validateSchema(MultiErrorSchema, invalidData)
    } catch (error) {
      const validationError = error as ValidationError
      expect(validationError.fieldErrors).toBeDefined()
      const passwordErrors = validationError.fieldErrors!['password']
      expect(passwordErrors.length).toBeGreaterThan(1)
      expect(passwordErrors).toContain('Password must be at least 8 characters')
    }
  })
})

describe('safeValidateSchema', () => {
  it('should return success with data for valid input', () => {
    const validData = { name: 'John', email: 'john@example.com', age: 30 }
    const result = safeValidateSchema(TestSchema, validData)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it('should return failure with ALL fieldErrors for invalid input', () => {
    const invalidData = { name: '', email: 'invalid', age: -1 }
    const result = safeValidateSchema(TestSchema, invalidData)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors['name']).toContain('Name is required')
      expect(result.fieldErrors['email']).toContain('Invalid email format')
      expect(result.fieldErrors['age']).toContain('Age must be positive')
    }
  })

  it('should not throw when validation fails', () => {
    const invalidData = { name: '', email: 'invalid', age: -1 }

    // Should not throw
    expect(() => safeValidateSchema(TestSchema, invalidData)).not.toThrow()
  })
})
