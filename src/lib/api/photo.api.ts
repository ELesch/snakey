// Photo API Client - Handles HTTP requests to /api/reptiles/[id]/photos
import type { Photo } from '@/generated/prisma/client'
import type { PhotoCreate, PhotoUpdate, PhotoQuery } from '@/validations/photo'
import type { PaginatedResponse, SingleResponse } from './types'
import { ApiClientError, handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

// Upload URL response type
export interface UploadUrlResponse {
  uploadUrl: string
  storagePath: string
  thumbnailPath: string
}

/**
 * Fetch all photos for a reptile with optional filtering and pagination
 */
export async function fetchPhotos(
  reptileId: string,
  query: Partial<PhotoQuery> = {}
): Promise<PaginatedResponse<Photo>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/photos${queryString}`)
  return handleResponse<PaginatedResponse<Photo>>(response)
}

/**
 * Fetch a single photo by ID
 */
export async function fetchPhoto(photoId: string): Promise<Photo> {
  const response = await fetch(`/api/photos/${photoId}`)
  const result = await handleResponse<SingleResponse<Photo>>(response)
  return result.data
}

/**
 * Create a new photo record after upload
 */
export async function createPhoto(
  reptileId: string,
  data: PhotoCreate
): Promise<Photo> {
  const response = await fetch(`/api/reptiles/${reptileId}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Photo>>(response)
  return result.data
}

/**
 * Update an existing photo
 */
export async function updatePhoto(
  photoId: string,
  data: PhotoUpdate
): Promise<Photo> {
  const response = await fetch(`/api/photos/${photoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Photo>>(response)
  return result.data
}

/**
 * Delete a photo
 */
export async function deletePhoto(
  photoId: string
): Promise<{ id: string }> {
  const response = await fetch(`/api/photos/${photoId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string }>>(response)
  return result.data
}

/**
 * Get a signed upload URL for a new photo
 */
export async function getUploadUrl(
  reptileId: string,
  filename: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const response = await fetch('/api/photos/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reptileId, filename, contentType }),
  })
  const result = await handleResponse<SingleResponse<UploadUrlResponse>>(response)
  return result.data
}

/**
 * Upload file directly to storage using signed URL
 */
export async function uploadToStorage(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new ApiClientError('UPLOAD_FAILED', 'Failed to upload file', xhr.status, 'photo'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new ApiClientError('UPLOAD_FAILED', 'Network error during upload', 0, 'photo'))
    })

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
