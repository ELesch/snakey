'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUploadPhoto } from '@/hooks/use-photos'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import type { PhotoCategory } from '@/validations/photo'

interface PhotoUploadProps {
  reptileId: string
  open: boolean
  onClose: () => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function PhotoUpload({ reptileId, open, onClose }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState<PhotoCategory>('GENERAL')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useUploadPhoto(reptileId)

  // Clean up object URLs to prevent memory leaks
  // This runs when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  const resetForm = useCallback(() => {
    // Revoke object URL before clearing to prevent memory leak
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview(null)
    setCaption('')
    setCategory('GENERAL')
    setProgress(0)
    setError(null)
  }, [preview])

  const handleClose = useCallback(() => {
    if (!uploadMutation.isPending) {
      resetForm()
      onClose()
    }
  }, [uploadMutation.isPending, resetForm, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    try {
      await uploadMutation.mutateAsync({
        file,
        data: {
          caption: caption || undefined,
          category,
          takenAt: new Date(),
          isPrimary: false,
        },
        onProgress: setProgress,
      })
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogDescription>
            Add a new photo to your reptile&apos;s gallery
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!file ? (
            <DropZone onDrop={handleDrop} onInputChange={handleInputChange} />
          ) : (
            <PreviewArea
              preview={preview!}
              onRemove={() => {
                // Revoke object URL before clearing to prevent memory leak
                if (preview) {
                  URL.revokeObjectURL(preview)
                }
                setFile(null)
                setPreview(null)
              }}
            />
          )}

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="photo-caption" className="sr-only">
                Caption
              </label>
              <Input
                id="photo-caption"
                placeholder="Add a caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                disabled={uploadMutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="photo-category" className="sr-only">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as PhotoCategory)}
                disabled={uploadMutation.isPending}
              >
                <SelectTrigger id="photo-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="MORPH">Morph</SelectItem>
                  <SelectItem value="SHED">Shed</SelectItem>
                  <SelectItem value="VET">Vet</SelectItem>
                  <SelectItem value="ENCLOSURE">Enclosure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {uploadMutation.isPending && <ProgressBar progress={progress} />}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file || uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DropZoneProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function DropZone({ onDrop, onInputChange }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      aria-label="Upload image. Press Enter or Space to select a file, or drag and drop an image."
      className="border-2 border-dashed border-warm-300 rounded-lg p-8 text-center hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer"
    >
      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-warm-400 dark:text-warm-500" aria-hidden="true" />
      <p className="text-warm-700 dark:text-warm-300 mb-2">Drag and drop an image here</p>
      <p className="text-sm text-warm-700 dark:text-warm-300 mb-4">or</p>
      <span className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md pointer-events-none">
        Choose File
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onInputChange}
        className="sr-only"
        aria-hidden="true"
      />
      <p className="text-xs text-warm-700 dark:text-warm-300 mt-4">
        JPEG, PNG, WebP, or HEIC up to 10MB
      </p>
    </div>
  )
}

interface PreviewAreaProps {
  preview: string
  onRemove: () => void
}

function PreviewArea({ preview, onRemove }: PreviewAreaProps) {
  return (
    <div className="relative">
      <img
        src={preview}
        alt="Preview"
        className="w-full max-h-64 object-contain rounded-lg bg-warm-100 dark:bg-warm-800"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        aria-label="Remove image"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ProgressBarProps {
  progress: number
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-warm-700 dark:text-warm-300 text-right">{progress}%</p>
    </div>
  )
}
