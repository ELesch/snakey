'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OfflinePhoto } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'
import {
  fetchPhotos,
  fetchPhoto,
  createPhoto,
  updatePhoto,
  deletePhoto,
  getUploadUrl,
  uploadToStorage,
  PhotoApiError,
} from '@/lib/api/photo.api'
import type { Photo } from '@/generated/prisma/client'
import type { PhotoCreate, PhotoUpdate, PhotoQuery } from '@/validations/photo'

// Query keys for cache management
export const photoKeys = {
  all: ['photos'] as const,
  lists: () => [...photoKeys.all, 'list'] as const,
  list: (reptileId: string, filters: Partial<PhotoQuery> = {}) =>
    [...photoKeys.lists(), reptileId, filters] as const,
  details: () => [...photoKeys.all, 'detail'] as const,
  detail: (photoId: string) => [...photoKeys.details(), photoId] as const,
}

// Convert API Photo to Offline format
function toOfflinePhoto(
  photo: Photo,
  syncStatus: 'synced' | 'pending' = 'synced'
): OfflinePhoto {
  return {
    id: photo.id,
    reptileId: photo.reptileId,
    storagePath: photo.storagePath,
    thumbnailPath: photo.thumbnailPath ?? undefined,
    caption: photo.caption ?? undefined,
    takenAt: new Date(photo.takenAt).getTime(),
    category: photo.category,
    createdAt: new Date(photo.createdAt).getTime(),
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  }
}

/**
 * Hook for fetching photos with offline support
 */
export function usePhotos(reptileId: string, query: Partial<PhotoQuery> = {}) {
  const isOnline = useOnlineStatus()

  // Offline data from Dexie
  const offlinePhotos = useLiveQuery(
    () =>
      offlineDb.photos
        .where('reptileId')
        .equals(reptileId)
        .reverse()
        .sortBy('takenAt'),
    [reptileId]
  )

  // Online data from API
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: photoKeys.list(reptileId, query),
    queryFn: async () => {
      const result = await fetchPhotos(reptileId, query)
      // Sync to offline DB
      const offlineRecords = result.data.map((p) => toOfflinePhoto(p))
      await offlineDb.photos.bulkPut(offlineRecords)
      return result
    },
    enabled: isOnline && !!reptileId,
    staleTime: 30 * 1000,
  })

  const photos = isOnline && apiData ? apiData.data : (offlinePhotos ?? [])
  const meta = apiData?.meta

  return {
    photos: photos as (Photo | OfflinePhoto)[],
    meta,
    isPending: isOnline ? isPending : offlinePhotos === undefined,
    isError,
    error: error as PhotoApiError | null,
    isOnline,
    isOfflineData: !isOnline || !apiData,
    refetch,
  }
}

/**
 * Hook for fetching a single photo
 */
export function usePhoto(photoId: string) {
  const isOnline = useOnlineStatus()

  return useQuery({
    queryKey: photoKeys.detail(photoId),
    queryFn: async () => {
      const photo = await fetchPhoto(photoId)
      // Cache in offline DB
      await offlineDb.photos.put(toOfflinePhoto(photo))
      return photo
    },
    enabled: isOnline && !!photoId,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook for uploading and creating a photo
 */
export function useUploadPhoto(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({
      file,
      data,
      onProgress,
    }: {
      file: File
      data: Omit<PhotoCreate, 'storagePath' | 'thumbnailPath'>
      onProgress?: (progress: number) => void
    }) => {
      if (!isOnline) {
        // Store locally for offline support
        const offlineId = crypto.randomUUID()
        const offlinePhoto: OfflinePhoto = {
          id: offlineId,
          reptileId,
          storagePath: `offline/${offlineId}`,
          thumbnailPath: undefined,
          caption: data.caption ?? undefined,
          takenAt: data.takenAt ? new Date(data.takenAt).getTime() : Date.now(),
          category: data.category ?? 'GENERAL',
          createdAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
          blob: file,
        }
        await offlineDb.photos.add(offlinePhoto)
        await offlineDb.syncQueue.add({
          operation: 'CREATE',
          table: 'photos',
          recordId: offlineId,
          payload: { reptileId, file, ...data },
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return offlinePhoto as unknown as Photo
      }

      // Get signed upload URL
      const { uploadUrl, storagePath, thumbnailPath } = await getUploadUrl(
        reptileId,
        file.name,
        file.type
      )

      // Upload to storage
      await uploadToStorage(uploadUrl, file, onProgress)

      // Create photo record
      return createPhoto(reptileId, {
        ...data,
        storagePath,
        thumbnailPath,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.lists() })
    },
  })
}

/**
 * Hook for updating a photo
 */
export function useUpdatePhoto() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({
      photoId,
      data,
    }: {
      photoId: string
      data: PhotoUpdate
    }) => {
      if (!isOnline) {
        const updateData: Partial<OfflinePhoto> = {
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        if (data.caption !== undefined)
          updateData.caption = data.caption ?? undefined
        if (data.category !== undefined) updateData.category = data.category

        await offlineDb.photos.update(photoId, updateData)
        await offlineDb.syncQueue.add({
          operation: 'UPDATE',
          table: 'photos',
          recordId: photoId,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return (await offlineDb.photos.get(photoId)) as unknown as Photo
      }
      return updatePhoto(photoId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all })
    },
  })
}

/**
 * Hook for deleting a photo
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (photoId: string) => {
      if (!isOnline) {
        await offlineDb.photos.delete(photoId)
        await offlineDb.syncQueue.add({
          operation: 'DELETE',
          table: 'photos',
          recordId: photoId,
          payload: null,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return { id: photoId }
      }
      return deletePhoto(photoId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all })
    },
  })
}
