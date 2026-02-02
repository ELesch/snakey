// Shared Error Classes
// Centralized error types used across services

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Error thrown when access to a resource is forbidden
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Field-level validation errors mapping field names to error messages
 */
export type FieldErrors = Record<string, string[]>

/**
 * Error thrown when input validation fails
 * Supports both single message and multiple field-level errors
 */
export class ValidationError extends Error {
  /**
   * Field-level error messages (field name -> array of error messages)
   */
  public readonly fieldErrors?: FieldErrors

  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

/**
 * Error thrown during sync operations
 */
export class SyncValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncValidationError'
  }
}

export class SyncNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncNotFoundError'
  }
}

export class SyncForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncForbiddenError'
  }
}

export class SyncConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncConflictError'
  }
}

/**
 * Error thrown for storage-related failures (photos, files)
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}
