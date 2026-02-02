// Tests for useFormState hook
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFormState } from './use-form-state'

interface TestFormValues {
  name: string
  email: string
  age: string
  isActive: boolean
}

const defaultValues: TestFormValues = {
  name: '',
  email: '',
  age: '',
  isActive: false,
}

describe('useFormState', () => {
  describe('initialization', () => {
    it('should initialize with provided values', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      expect(result.current.values).toEqual(defaultValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.isDirty).toBe(false)
    })

    it('should initialize with custom initial values', () => {
      const customValues = {
        name: 'John',
        email: 'john@example.com',
        age: '30',
        isActive: true,
      }

      const { result } = renderHook(() =>
        useFormState({
          initialValues: customValues,
        })
      )

      expect(result.current.values).toEqual(customValues)
    })
  })

  describe('handleChange', () => {
    it('should update field value on input change', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.values.name).toBe('John')
    })

    it('should handle checkbox changes', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.handleChange({
          target: { name: 'isActive', value: '', type: 'checkbox', checked: true },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.values.isActive).toBe(true)
    })

    it('should clear field error when field is updated', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Set an error first
      act(() => {
        result.current.setFieldError('name', 'Name is required')
      })
      expect(result.current.errors.name).toBe('Name is required')

      // Change the field value
      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.name).toBeUndefined()
    })

    it('should mark form as dirty when values change', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      expect(result.current.isDirty).toBe(false)

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.isDirty).toBe(true)
    })
  })

  describe('setFieldValue', () => {
    it('should set specific field value programmatically', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.setFieldValue('name', 'Jane')
      })

      expect(result.current.values.name).toBe('Jane')
    })

    it('should clear error when field value is set', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Set an error
      act(() => {
        result.current.setFieldError('email', 'Invalid email')
      })
      expect(result.current.errors.email).toBe('Invalid email')

      // Set field value
      act(() => {
        result.current.setFieldValue('email', 'valid@example.com')
      })

      expect(result.current.errors.email).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should set field error with setFieldError', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.setFieldError('name', 'Name is required')
      })

      expect(result.current.errors.name).toBe('Name is required')
    })

    it('should set multiple errors with setErrors', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.setErrors({
          name: 'Name is required',
          email: 'Email is invalid',
        })
      })

      expect(result.current.errors.name).toBe('Name is required')
      expect(result.current.errors.email).toBe('Email is invalid')
    })

    it('should clear all errors with clearErrors', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Set some errors
      act(() => {
        result.current.setErrors({
          name: 'Error 1',
          email: 'Error 2',
        })
      })

      // Clear errors
      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.errors).toEqual({})
    })
  })

  describe('resetForm', () => {
    it('should reset values to initial values', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Modify values
      act(() => {
        result.current.setFieldValue('name', 'John')
        result.current.setFieldValue('email', 'john@example.com')
      })

      // Reset form
      act(() => {
        result.current.resetForm()
      })

      expect(result.current.values).toEqual(defaultValues)
    })

    it('should clear errors on reset', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Set errors
      act(() => {
        result.current.setFieldError('name', 'Error')
      })

      // Reset
      act(() => {
        result.current.resetForm()
      })

      expect(result.current.errors).toEqual({})
    })

    it('should reset isSubmitting to false', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Manually set isSubmitting would require async submit, so reset should handle it
      act(() => {
        result.current.resetForm()
      })

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('validation', () => {
    const validate = (values: TestFormValues) => {
      const errors: Partial<Record<keyof TestFormValues, string>> = {}
      if (!values.name) errors.name = 'Name is required'
      if (!values.email) errors.email = 'Email is required'
      if (!values.email.includes('@')) errors.email = 'Invalid email format'
      return errors
    }

    it('should run validation on submit and set errors', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
          validate,
          onSubmit,
        })
      )

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.name).toBe('Name is required')
      expect(result.current.errors.email).toBeDefined()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should not call onSubmit when validation fails', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
          validate,
          onSubmit,
        })
      )

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should call onSubmit when validation passes', async () => {
      const onSubmit = vi.fn()
      const validValues = {
        name: 'John',
        email: 'john@example.com',
        age: '30',
        isActive: true,
      }

      const { result } = renderHook(() =>
        useFormState({
          initialValues: validValues,
          validate,
          onSubmit,
        })
      )

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(onSubmit).toHaveBeenCalledWith(validValues)
    })
  })

  describe('submission', () => {
    it('should call preventDefault on form event', async () => {
      const preventDefault = vi.fn()
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      await act(async () => {
        await result.current.handleSubmit({ preventDefault } as unknown as React.FormEvent)
      })

      expect(preventDefault).toHaveBeenCalled()
    })

    it('should set isSubmitting to true during async submission', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      const onSubmit = vi.fn(() => submitPromise)

      const validValues = {
        name: 'John',
        email: 'john@example.com',
        age: '30',
        isActive: true,
      }

      const { result } = renderHook(() =>
        useFormState({
          initialValues: validValues,
          onSubmit,
        })
      )

      // Start submission
      let submitComplete = false
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent).then(() => {
          submitComplete = true
        })
      })

      // isSubmitting should be true while waiting
      expect(result.current.isSubmitting).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolveSubmit!()
        await submitPromise
      })

      // isSubmitting should be false after completion
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false)
      })
    })

    it('should set isSubmitting to false even if onSubmit throws', async () => {
      const onSubmit = vi.fn(() => Promise.reject(new Error('Submit failed')))
      const validValues = {
        name: 'John',
        email: 'john@example.com',
        age: '30',
        isActive: true,
      }

      const { result } = renderHook(() =>
        useFormState({
          initialValues: validValues,
          onSubmit,
        })
      )

      await act(async () => {
        try {
          await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isSubmitting).toBe(false)
    })

    it('should work without onSubmit callback', async () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      // Should not throw
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.isSubmitting).toBe(false)
    })

    it('should work without validate function', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
          onSubmit,
        })
      )

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(onSubmit).toHaveBeenCalledWith(defaultValues)
    })
  })

  describe('isDirty', () => {
    it('should be false when values match initial values', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      expect(result.current.isDirty).toBe(false)
    })

    it('should be true when any value differs from initial', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.setFieldValue('age', '25')
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('should become false again when values are reset', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.setFieldValue('name', 'John')
      })
      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.resetForm()
      })
      expect(result.current.isDirty).toBe(false)
    })

    it('should become false if value is changed back to initial', () => {
      const { result } = renderHook(() =>
        useFormState({
          initialValues: defaultValues,
        })
      )

      act(() => {
        result.current.setFieldValue('name', 'John')
      })
      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.setFieldValue('name', '')
      })
      expect(result.current.isDirty).toBe(false)
    })
  })
})
