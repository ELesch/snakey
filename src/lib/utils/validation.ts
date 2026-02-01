// Validation Utility Functions
// Centralized helpers for Zod schema validation with consistent error handling

import type { z } from 'zod'
import { ValidationError } from '@/lib/errors'

/**
 * Validates data against a Zod schema and returns the validated result.
 * Throws a ValidationError with the first error message on validation failure.
 *
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 *
 * const UserSchema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 * })
 *
 * const user = validateSchema(UserSchema, { name: 'John', email: 'john@example.com' })
 * // Returns: { name: 'John', email: 'john@example.com' }
 *
 * validateSchema(UserSchema, { name: '', email: 'invalid' })
 * // Throws: ValidationError('Name is required')
 * ```
 */
export function validateSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const errorMessage = firstIssue?.message || 'Validation failed'
    throw new ValidationError(errorMessage)
  }

  return result.data
}

/**
 * Validates data against a Zod schema and returns a result object.
 * Does not throw - returns success status and either data or error.
 *
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to validate
 * @returns Object with success flag and either data or error message
 *
 * @example
 * ```typescript
 * const result = safeValidateSchema(UserSchema, userData)
 * if (result.success) {
 *   // result.data is typed
 * } else {
 *   // result.error contains the error message
 * }
 * ```
 */
export function safeValidateSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const errorMessage = firstIssue?.message || 'Validation failed'
    return { success: false, error: errorMessage }
  }

  return { success: true, data: result.data }
}
