'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  /** Unique identifier for the field */
  id: string
  /** Field name (used for form state) */
  name: string
  /** Label text */
  label: string
  /** Whether the field is required */
  required?: boolean
  /** Error message to display */
  error?: string
  /** Additional class name for the container */
  className?: string
  /** Field type */
  type?: 'text' | 'date' | 'datetime-local' | 'number' | 'email' | 'password'
  /** Placeholder text */
  placeholder?: string
  /** Current value */
  value: string
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Whether the field is disabled */
  disabled?: boolean
  /** Additional input props */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'id' | 'name' | 'type' | 'value' | 'onChange' | 'disabled' | 'placeholder'
  >
}

export function FormField({
  id,
  name,
  label,
  required = false,
  error,
  className,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  inputProps,
}: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-1"
      >
        {label}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormTextareaProps {
  /** Unique identifier for the field */
  id: string
  /** Field name (used for form state) */
  name: string
  /** Label text */
  label: string
  /** Whether the field is required */
  required?: boolean
  /** Error message to display */
  error?: string
  /** Additional class name for the container */
  className?: string
  /** Number of rows */
  rows?: number
  /** Placeholder text */
  placeholder?: string
  /** Current value */
  value: string
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  /** Whether the field is disabled */
  disabled?: boolean
}

export function FormTextarea({
  id,
  name,
  label,
  required = false,
  error,
  className,
  rows = 3,
  placeholder,
  value,
  onChange,
  disabled,
}: FormTextareaProps) {
  const errorId = `${id}-error`

  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-1"
      >
        {label}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormCheckboxProps {
  /** Unique identifier for the field */
  id: string
  /** Field name (used for form state) */
  name: string
  /** Label text */
  label: string
  /** Whether the checkbox is checked */
  checked: boolean
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Whether the field is disabled */
  disabled?: boolean
  /** Additional class name for the container */
  className?: string
}

export function FormCheckbox({
  id,
  name,
  label,
  checked,
  onChange,
  disabled,
  className,
}: FormCheckboxProps) {
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-5 w-5 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  /** Unique identifier for the field */
  id: string
  /** Label text */
  label: string
  /** Whether the field is required */
  required?: boolean
  /** Error message to display */
  error?: string
  /** Additional class name for the container */
  className?: string
  /** Current value */
  value: string
  /** Change handler */
  onValueChange: (value: string) => void
  /** Whether the field is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Select options */
  options: SelectOption[]
}

export function FormSelect({
  id,
  label,
  required = false,
  error,
  className,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select...',
  options,
}: FormSelectProps) {
  const errorId = `${id}-error`

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormErrorProps {
  /** Error message to display */
  message: string | null | undefined
  /** Additional class name */
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        'bg-destructive-muted border border-destructive-border rounded-lg p-3 flex items-start gap-2 text-sm text-destructive',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
