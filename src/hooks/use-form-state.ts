'use client'

import { useState, useCallback, useMemo } from 'react'

type FormErrors<T> = Partial<Record<keyof T, string>>

interface UseFormStateOptions<T extends Record<string, unknown>> {
  /** Initial form values */
  initialValues: T
  /** Optional validation function - returns errors object */
  validate?: (values: T) => FormErrors<T>
  /** Optional callback when form is successfully submitted */
  onSubmit?: (values: T) => void | Promise<void>
}

interface UseFormStateReturn<T extends Record<string, unknown>> {
  /** Current form values */
  values: T
  /** Current validation errors */
  errors: FormErrors<T>
  /** Whether the form is currently submitting */
  isSubmitting: boolean
  /** Whether the form has been modified from initial values */
  isDirty: boolean
  /** Handle input change events */
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  /** Set a specific field value programmatically */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  /** Set a specific field error */
  setFieldError: (field: keyof T, error: string) => void
  /** Set multiple errors at once */
  setErrors: (errors: FormErrors<T>) => void
  /** Reset form to initial values */
  resetForm: () => void
  /** Clear all errors */
  clearErrors: () => void
  /** Handle form submission with validation */
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

/**
 * A reusable hook for managing form state, validation, and submission.
 * Eliminates duplicate form state management patterns across components.
 *
 * @example
 * ```tsx
 * const { values, handleChange, handleSubmit, errors } = useFormState({
 *   initialValues: {
 *     date: new Date().toISOString().split('T')[0],
 *     weight: '',
 *     notes: '',
 *   },
 *   validate: (values) => {
 *     const errors: Partial<Record<string, string>> = {}
 *     if (!values.date) errors.date = 'Date is required'
 *     if (!values.weight) errors.weight = 'Weight is required'
 *     return errors
 *   },
 *   onSubmit: async (values) => {
 *     await saveWeight(values)
 *   },
 * })
 * ```
 */
export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T>
): UseFormStateReturn<T> {
  const { initialValues, validate, onSubmit } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track if form has been modified
  const isDirty = useMemo(() => {
    return Object.keys(initialValues).some(
      (key) => values[key as keyof T] !== initialValues[key as keyof T]
    )
  }, [values, initialValues])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const newValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

      setValues((prev) => ({ ...prev, [name]: newValue }))

      // Clear error for this field when it changes
      if (errors[name as keyof T]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[name as keyof T]
          return next
        })
      }
    },
    [errors]
  )

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }, [errors])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setIsSubmitting(false)
  }, [initialValues])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Run validation if provided
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          return
        }
      }

      // Call onSubmit if provided
      if (onSubmit) {
        setIsSubmitting(true)
        try {
          await onSubmit(values)
        } finally {
          setIsSubmitting(false)
        }
      }
    },
    [values, validate, onSubmit]
  )

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    setFieldValue,
    setFieldError,
    setErrors,
    resetForm,
    clearErrors,
    handleSubmit,
  }
}
