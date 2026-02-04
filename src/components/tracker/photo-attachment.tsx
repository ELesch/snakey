'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, X, Loader2 } from 'lucide-react'
import { useUploadPhoto } from '@/hooks'

interface PhotoAttachmentProps {
  reptileId: string
  category?: 'GENERAL' | 'MORPH' | 'SHED' | 'VET' | 'ENCLOSURE'
  onUploadComplete?: () => void
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function PhotoAttachment({
  reptileId,
  category = 'GENERAL',
  onUploadComplete,
}: PhotoAttachmentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const uploadMutation = useUploadPhoto(reptileId)

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or HEIC)')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  const handleRemove = useCallback(() => {
    setFile(null)
    setPreview(null)
    setError(null)
    setProgress(0)
  }, [])

  const handleUpload = async () => {
    if (!file) return

    try {
      await uploadMutation.mutateAsync({
        file,
        data: {
          category,
          takenAt: new Date(),
          isPrimary: false,
        },
        onProgress: setProgress,
      })
      handleRemove()
      onUploadComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  if (!file) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-warm-300 rounded-lg p-4 text-center hover:border-primary transition-colors"
      >
        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-warm-400" />
        <p className="text-sm text-warm-800 dark:text-warm-200 mb-2">Attach a photo (optional)</p>
        <label>
          <span className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-warm-100 dark:bg-warm-800 text-warm-900 dark:text-warm-100 rounded-md hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors text-sm">
            Choose File
          </span>
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleInputChange}
            className="sr-only"
          />
        </label>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="border border-warm-200 rounded-lg p-4 space-y-3">
      <div className="relative inline-block">
        <img
          src={preview!}
          alt="Preview"
          className="w-24 h-24 object-cover rounded-lg bg-warm-100 dark:bg-warm-800"
        />
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploadMutation.isPending}
          className="absolute -top-2 -right-2 p-1 bg-warm-600 rounded-full text-white hover:bg-warm-700 transition-colors disabled:opacity-50"
          aria-label="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uploadMutation.isPending && (
        <div className="space-y-1">
          <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-warm-700 dark:text-warm-300 text-right">{progress}%</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUpload}
        disabled={uploadMutation.isPending}
        className="w-full"
      >
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          'Upload Photo'
        )}
      </Button>
    </div>
  )
}
