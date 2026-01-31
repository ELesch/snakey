// Supabase Storage Helpers
import { supabase } from './client'

const BUCKET_NAME = 'photos'

interface UploadResult {
  path: string
  url: string
}

/**
 * Upload a photo to Supabase Storage
 */
export async function uploadPhoto(
  userId: string,
  file: File,
  category: 'originals' | 'thumbnails' = 'originals'
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${userId}/${category}/${fileName}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return {
    path: filePath,
    url: publicUrl,
  }
}

/**
 * Get a signed URL for a private photo
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error || !data) {
    throw new Error(`Failed to get signed URL: ${error?.message}`)
  }

  return data.signedUrl
}

/**
 * Delete a photo from storage
 */
export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) {
    throw new Error(`Failed to delete photo: ${error.message}`)
  }
}

/**
 * List photos for a user
 */
export async function listUserPhotos(
  userId: string,
  category: 'originals' | 'thumbnails' = 'originals'
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${userId}/${category}`)

  if (error) {
    throw new Error(`Failed to list photos: ${error.message}`)
  }

  return data.map((file) => `${userId}/${category}/${file.name}`)
}
