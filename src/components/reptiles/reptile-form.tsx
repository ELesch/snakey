'use client'

import { useState, useEffect, useCallback } from 'react'
import { useFormState } from '@/hooks/use-form-state'
import { Button } from '@/components/ui/button'
import { FormField, FormTextarea, FormCheckbox, FormSelect, FormError } from '@/components/ui/form-field'
import { ImagePicker } from '@/components/ui/image-picker'
import { getSpeciesOptions } from '@/lib/species/defaults'
import { useCreateReptile, useUpdateReptile } from '@/hooks'
import { useUploadPhoto } from '@/hooks/use-photos'
import { Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import type { Reptile } from '@/generated/prisma/client'

/**
 * ReptileForm component for creating and editing reptile profiles.
 *
 * When editing an existing reptile, the parent component should:
 * 1. Fetch the reptile's primary photo URL (e.g., from the photos array where isPrimary === true)
 * 2. Pass it to `existingProfilePhotoUrl` to display the current profile image
 * 3. If the user selects a new image, it will be uploaded as the new primary photo
 *
 * Example parent usage:
 * ```tsx
 * const reptile = await getReptile(id)
 * const primaryPhoto = reptile.photos?.find(p => p.isPrimary)
 * const photoUrl = primaryPhoto ? getPhotoUrl(primaryPhoto.storagePath) : undefined
 *
 * <ReptileForm
 *   reptileId={reptile.id}
 *   initialData={reptile}
 *   existingProfilePhotoUrl={photoUrl}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
interface ReptileFormProps {
  onSuccess?: (reptile: Reptile) => void
  onCancel?: () => void
  initialData?: Partial<Reptile>
  reptileId?: string
  /** URL of the existing profile photo to display when editing */
  existingProfilePhotoUrl?: string
}

interface ReptileFormValues extends Record<string, unknown> {
  name: string
  species: string
  morph: string
  sex: string
  birthDate: string
  acquisitionDate: string
  currentWeight: string
  addToWeightHistory: boolean
  notes: string
  isPublic: boolean
}

const SEX_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'UNKNOWN', label: 'Unknown' },
]

function getInitialValues(initialData?: Partial<Reptile>): ReptileFormValues {
  const today = new Date().toISOString().split('T')[0]
  const currentWeight = initialData?.currentWeight
  return {
    name: initialData?.name || '',
    species: initialData?.species || '',
    morph: initialData?.morph || '',
    sex: initialData?.sex || 'UNKNOWN',
    birthDate: initialData?.birthDate
      ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    acquisitionDate: initialData?.acquisitionDate
      ? new Date(initialData.acquisitionDate).toISOString().split('T')[0] : today,
    currentWeight: currentWeight != null ? String(currentWeight) : '',
    addToWeightHistory: true,
    notes: initialData?.notes || '',
    isPublic: initialData?.isPublic || false,
  }
}

function validateReptileForm(
  values: ReptileFormValues
): Partial<Record<keyof ReptileFormValues, string>> {
  const errors: Partial<Record<keyof ReptileFormValues, string>> = {}
  if (!values.name.trim()) errors.name = 'Name is required'
  if (!values.species) errors.species = 'Species is required'
  if (!values.acquisitionDate) errors.acquisitionDate = 'Acquisition date is required'
  if (values.currentWeight) {
    const weight = parseFloat(values.currentWeight)
    if (isNaN(weight) || weight <= 0) {
      errors.currentWeight = 'Weight must be a positive number'
    }
  }
  return errors
}

export function ReptileForm({
  onSuccess,
  onCancel,
  initialData,
  reptileId,
  existingProfilePhotoUrl,
}: ReptileFormProps) {
  const isEditing = Boolean(reptileId)
  const createMutation = useCreateReptile()
  const updateMutation = useUpdateReptile()
  const speciesOptions = [...getSpeciesOptions(), { value: 'other', label: 'Other' }]

  // Profile image state
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  // Saving state for multi-step process
  const [savingStatus, setSavingStatus] = useState<string | null>(null)

  // Track if we have a temporary reptileId for photo upload (null until reptile is created)
  const [createdReptileId, setCreatedReptileId] = useState<string | null>(reptileId || null)

  // Upload hook - only create when we have a reptileId
  const uploadMutation = useUploadPhoto(createdReptileId || '')

  const isPending = createMutation.isPending || updateMutation.isPending ||
    uploadMutation.isPending || savingStatus !== null

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (profileImagePreview && !profileImagePreview.startsWith('http')) {
        URL.revokeObjectURL(profileImagePreview)
      }
    }
  }, [profileImagePreview])

  const handleImageChange = useCallback((file: File | null, preview: string | null) => {
    setProfileImage(file)
    setProfileImagePreview(preview)
  }, [])

  const { values, errors, handleChange, setFieldValue, setFieldError, handleSubmit } = useFormState({
    initialValues: getInitialValues(initialData),
    validate: validateReptileForm,
    onSubmit: async (formValues) => {
      const payload = {
        name: formValues.name.trim(),
        species: formValues.species,
        morph: formValues.morph.trim() || null,
        sex: formValues.sex as 'MALE' | 'FEMALE' | 'UNKNOWN',
        birthDate: formValues.birthDate ? new Date(formValues.birthDate) : null,
        acquisitionDate: new Date(formValues.acquisitionDate),
        notes: formValues.notes.trim() || null,
        isPublic: formValues.isPublic,
      }
      try {
        // Step 1: Create or update the reptile
        setSavingStatus(isEditing ? 'Updating reptile...' : 'Creating reptile...')
        let savedReptile: Reptile

        if (isEditing && reptileId) {
          savedReptile = await updateMutation.mutateAsync({ id: reptileId, data: payload })
        } else {
          savedReptile = await createMutation.mutateAsync(payload)
          // Set the created reptile ID for photo upload
          setCreatedReptileId(savedReptile.id)
        }

        // Step 2: Upload profile photo if selected
        if (profileImage) {
          setSavingStatus('Uploading photo...')
          try {
            await uploadPhotoToReptile(savedReptile.id, profileImage)
          } catch (photoErr) {
            // Photo upload failed but reptile was created successfully
            // Log error but don't fail the entire operation
            logger.error(
              { err: photoErr, reptileId: savedReptile.id },
              'Failed to upload profile photo'
            )
          }
        }

        // Step 3: Create weight record if requested
        const weightValue = parseFloat(formValues.currentWeight)
        if (formValues.addToWeightHistory && weightValue > 0) {
          setSavingStatus('Recording weight...')
          try {
            await createWeightRecord(savedReptile.id, weightValue)
          } catch (weightErr) {
            // Weight record failed but reptile was created successfully
            // Log error but don't fail the entire operation
            logger.error(
              { err: weightErr, reptileId: savedReptile.id },
              'Failed to create weight record'
            )
          }
        }

        setSavingStatus(null)
        onSuccess?.(savedReptile)
      } catch (err) {
        setSavingStatus(null)
        setFieldError('name', err instanceof Error ? err.message : 'Failed to save reptile')
      }
    },
  })

  // Upload photo to reptile using fetch (to use reptile ID directly)
  async function uploadPhotoToReptile(targetReptileId: string, file: File): Promise<void> {
    // Get signed upload URL
    const uploadUrlRes = await fetch(`/api/reptiles/${targetReptileId}/photos/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    })

    if (!uploadUrlRes.ok) {
      throw new Error('Failed to get upload URL')
    }

    const { uploadUrl, storagePath, thumbnailPath } = await uploadUrlRes.json()

    // Upload to storage
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to storage')
    }

    // Create photo record with isPrimary: true
    const createRes = await fetch(`/api/reptiles/${targetReptileId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storagePath,
        thumbnailPath,
        category: 'GENERAL',
        takenAt: new Date().toISOString(),
        isPrimary: true,
      }),
    })

    if (!createRes.ok) {
      throw new Error('Failed to create photo record')
    }
  }

  // Create weight record
  async function createWeightRecord(targetReptileId: string, weight: number): Promise<void> {
    const res = await fetch(`/api/reptiles/${targetReptileId}/weights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight,
        date: new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to create weight record')
    }
  }

  const formError = errors.name?.includes('Failed') ? errors.name : null
  const handleCancel = () => (onCancel ? onCancel() : window.history.back())

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={formError} />

      <ImagePicker
        value={profileImage}
        preview={profileImagePreview}
        onChange={handleImageChange}
        existingImageUrl={existingProfilePhotoUrl}
        disabled={isPending}
        label="Profile Photo"
      />

      <FormField id="name" name="name" label="Name" required placeholder="Enter reptile name"
        value={values.name} onChange={handleChange} disabled={isPending}
        error={formError ? undefined : errors.name} />

      <FormSelect id="species" label="Species" required placeholder="Select species"
        value={values.species} onValueChange={(v) => setFieldValue('species', v)}
        disabled={isPending} options={speciesOptions} error={errors.species} />

      <FormField id="morph" name="morph" label="Morph / Locale"
        placeholder="e.g., Banana, Pastel, Albino"
        value={values.morph} onChange={handleChange} disabled={isPending} />

      <FormSelect id="sex" label="Sex" placeholder="Select sex" value={values.sex}
        onValueChange={(v) => setFieldValue('sex', v)} disabled={isPending} options={SEX_OPTIONS} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="birthDate" name="birthDate" label="Birth/Hatch Date" type="date"
          value={values.birthDate} onChange={handleChange} disabled={isPending} />
        <FormField id="acquisitionDate" name="acquisitionDate" label="Acquisition Date"
          type="date" required value={values.acquisitionDate} onChange={handleChange}
          disabled={isPending} error={errors.acquisitionDate} />
      </div>

      <FormField id="currentWeight" name="currentWeight" label="Initial Weight (g)" type="number"
        placeholder="Enter weight in grams" value={values.currentWeight} onChange={handleChange}
        disabled={isPending} error={errors.currentWeight} />

      {parseFloat(values.currentWeight) > 0 && (
        <FormCheckbox id="addToWeightHistory" name="addToWeightHistory"
          label="Add to weight history"
          checked={values.addToWeightHistory as boolean} onChange={handleChange} disabled={isPending} />
      )}

      <FormTextarea id="notes" name="notes" label="Notes" rows={3}
        placeholder="Any additional notes..."
        value={values.notes} onChange={handleChange} disabled={isPending} />

      <FormCheckbox id="isPublic" name="isPublic"
        label="Make this reptile profile public (shareable)"
        checked={values.isPublic as boolean} onChange={handleChange} disabled={isPending} />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {savingStatus || (isEditing ? 'Update Reptile' : 'Add Reptile')}
        </Button>
      </div>
    </form>
  )
}
