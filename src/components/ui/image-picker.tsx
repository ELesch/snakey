'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ImageIcon, X } from 'lucide-react'

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic'
const DEFAULT_MAX_SIZE_MB = 10

export interface ImagePickerProps {
  value: File | null
  preview: string | null
  onChange: (file: File | null, preview: string | null) => void
  existingImageUrl?: string
  disabled?: boolean
  accept?: string
  maxSizeMB?: number
  label?: string
  error?: string
  className?: string
}

export function ImagePicker({
  value,
  preview,
  onChange,
  existingImageUrl,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  label,
  error,
  className,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview && !preview.startsWith('http')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const acceptedTypes = accept.split(',').map((t) => t.trim())
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        const extensions = acceptedTypes
          .map((t) => t.split('/')[1]?.toUpperCase())
          .filter(Boolean)
          .join(', ')
        return `Please select a valid image file (${extensions})`
      }

      if (file.size > maxSizeBytes) {
        return `File size must be less than ${maxSizeMB}MB`
      }

      return null
    },
    [acceptedTypes, maxSizeBytes, maxSizeMB]
  )

  const handleFileSelect = useCallback(
    (file: File) => {
      setValidationError(null)

      const validationResult = validateFile(file)
      if (validationResult) {
        setValidationError(validationResult)
        return
      }

      // Revoke old preview URL if it exists and is a blob URL
      if (preview && !preview.startsWith('http')) {
        URL.revokeObjectURL(preview)
      }

      const newPreview = URL.createObjectURL(file)
      onChange(file, newPreview)
    },
    [validateFile, preview, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect, disabled]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
      // Reset input value so the same file can be selected again
      e.target.value = ''
    },
    [handleFileSelect]
  )

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault()
        inputRef.current?.click()
      }
    },
    [disabled]
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      // Revoke preview URL if it's a blob URL
      if (preview && !preview.startsWith('http')) {
        URL.revokeObjectURL(preview)
      }

      setValidationError(null)
      onChange(null, null)
    },
    [preview, onChange]
  )

  // Determine what image to display
  const displayImage = preview || (value ? null : existingImageUrl)
  const hasImage = !!displayImage

  // Display error from props or validation
  const displayError = error || validationError

  // Format accepted types for display
  const acceptedExtensions = acceptedTypes
    .map((t) => t.split('/')[1]?.toUpperCase())
    .filter(Boolean)
    .join(', ')

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label={
          hasImage
            ? 'Image selected. Press Enter or Space to change, or drag and drop a new image.'
            : 'Upload image. Press Enter or Space to select a file, or drag and drop an image.'
        }
        aria-disabled={disabled}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]',
          hasImage ? 'border-transparent' : 'border-[var(--color-warm-300)]',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/30',
          isDragging && !disabled && 'border-[var(--color-primary)] bg-[var(--color-muted)]/50',
          displayError && 'border-[var(--color-destructive)]'
        )}
      >
        {hasImage ? (
          <div className="relative aspect-video">
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className={cn(
                  'absolute top-2 right-2 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-full',
                  'bg-black/60 text-white',
                  'hover:bg-black/80 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/60'
                )}
                aria-label="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <ImageIcon
              className="h-12 w-12 mb-4 text-[var(--color-warm-400)]"
              aria-hidden="true"
            />
            <p className="text-[var(--color-warm-600)] mb-2">
              {isDragging ? 'Drop image here' : 'Drag and drop an image here'}
            </p>
            <p className="text-sm text-[var(--color-warm-500)] mb-4">or</p>
            <span className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md text-sm font-medium pointer-events-none">
              Choose File
            </span>
            <p className="text-xs text-[var(--color-warm-500)] mt-4">
              {acceptedExtensions} up to {maxSizeMB}MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {displayError && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-2 text-sm text-[var(--color-destructive)]"
        >
          {displayError}
        </p>
      )}
    </div>
  )
}
