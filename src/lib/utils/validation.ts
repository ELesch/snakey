// Validation Utility Functions
// Centralized helpers for Zod schema validation with consistent error handling

import type { z } from 'zod'
import { ValidationError, type FieldErrors } from '@/lib/errors'

/**
 * Converts Zod error issues to a field errors object
 * Groups error messages by field path
 */
function zodIssuesToFieldErrors(issues: z.ZodIssue[]): FieldErrors {
  const fieldErrors: FieldErrors = {}

  for (const issue of issues) {
    // Build field path string (e.g., "user.address.street" or "items.0.name")
    const fieldPath = issue.path.length > 0 ? issue.path.join('.') : '_root'

    if (!fieldErrors[fieldPath]) {
      fieldErrors[fieldPath] = []
    }
    fieldErrors[fieldPath].push(issue.message)
  }

  return fieldErrors
}

/**
 * Validates data against a Zod schema and returns the validated result.
 * Throws a ValidationError with ALL error messages on validation failure.
 *
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails, includes all field errors
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
 * // Throws: ValidationError('Validation failed', { name: ['Name is required'], email: ['Invalid email'] })
 * ```
 */
export function validateSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const fieldErrors = zodIssuesToFieldErrors(result.error.issues)
    throw new ValidationError('Validation failed', fieldErrors)
  }

  return result.data
}

/**
 * Validates data against a Zod schema and returns a result object.
 * Does not throw - returns success status and either data or errors.
 *
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to validate
 * @returns Object with success flag and either data or all field errors
 *
 * @example
 * ```typescript
 * const result = safeValidateSchema(UserSchema, userData)
 * if (result.success) {
 *   // result.data is typed
 * } else {
 *   // result.error is general message, result.fieldErrors has all field-level errors
 * }
 * ```
 */
export function safeValidateSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: string; fieldErrors: FieldErrors } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const fieldErrors = zodIssuesToFieldErrors(result.error.issues)
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  return { success: true, data: result.data }
}
