'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFormState } from '@/hooks/use-form-state'
import { Button } from '@/components/ui/button'
import { FormField, FormTextarea, FormCheckbox, FormSelect, FormError } from '@/components/ui/form-field'
import { ImagePicker } from '@/components/ui/image-picker'
import { getSpeciesOptions } from '@/lib/species/defaults'
import {
  getMeasurementTypesForSpecies,
  MEASUREMENT_LABELS,
  MEASUREMENT_UNITS,
} from '@/lib/species/measurements'
import { useCreateReptile, useUpdateReptile } from '@/hooks'
import { Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import { processImage } from '@/lib/image-utils'
import type { Reptile } from '@/generated/prisma/client'
import type { MeasurementType } from '@/generated/prisma/client'

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
  initialMeasurements: Record<string, string>
  currentMeasurements: Record<string, string>
  notes: string
  isPublic: boolean
}

const SEX_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'UNKNOWN', label: 'Unknown' },
]

/**
 * MeasurementsSection - Renders species-aware measurement fields
 */
interface MeasurementsSectionProps {
  species: string
  acquisitionDate: string
  initialMeasurements: Record<string, string>
  currentMeasurements: Record<string, string>
  onInitialChange: (type: string, value: string) => void
  onCurrentChange: (type: string, value: string) => void
  disabled: boolean
  errors?: { initial?: string; current?: string }
}

function MeasurementsSection({
  species,
  acquisitionDate,
  initialMeasurements,
  currentMeasurements,
  onInitialChange,
  onCurrentChange,
  disabled,
  errors,
}: MeasurementsSectionProps) {
  const measurementTypes = useMemo(
    () => getMeasurementTypesForSpecies(species),
    [species]
  )

  // Determine if acquisition date is today
  // Compare just the date strings to avoid timezone issues
  const todayStr = new Date().toISOString().split('T')[0]
  const showCurrentSection = acquisitionDate !== todayStr

  if (measurementTypes.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Initial Measurements Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-warm-700 dark:text-warm-200">
          Initial Measurements (at acquisition)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {measurementTypes.map((type) => (
            <FormField
              key={`initial-${type}`}
              id={`initial-${type}`}
              name={`initial-${type}`}
              label={`${MEASUREMENT_LABELS[type]} (${MEASUREMENT_UNITS[type]})`}
              type="number"
              placeholder={`Enter ${MEASUREMENT_LABELS[type].toLowerCase()}`}
              value={initialMeasurements[type] || ''}
              onChange={(e) => onInitialChange(type, e.target.value)}
              disabled={disabled}
            />
          ))}
        </div>
        {errors?.initial && (
          <p className="text-sm text-destructive">{errors.initial}</p>
        )}
      </div>

      {/* Current Measurements Section (only if acquisition date is not today) */}
      {showCurrentSection && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-warm-700 dark:text-warm-200">
            Current Measurements (optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {measurementTypes.map((type) => (
              <FormField
                key={`current-${type}`}
                id={`current-${type}`}
                name={`current-${type}`}
                label={`${MEASUREMENT_LABELS[type]} (${MEASUREMENT_UNITS[type]})`}
                type="number"
                placeholder={`Enter current ${MEASUREMENT_LABELS[type].toLowerCase()}`}
                value={currentMeasurements[type] || ''}
                onChange={(e) => onCurrentChange(type, e.target.value)}
                disabled={disabled}
              />
            ))}
          </div>
          {errors?.current && (
            <p className="text-sm text-destructive">{errors.current}</p>
          )}
        </div>
      )}
    </div>
  )
}

function getInitialValues(initialData?: Partial<Reptile>): ReptileFormValues {
  const today = new Date().toISOString().split('T')[0]
  return {
    name: initialData?.name || '',
    species: initialData?.species || '',
    morph: initialData?.morph || '',
    sex: initialData?.sex || 'UNKNOWN',
    birthDate: initialData?.birthDate
      ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    acquisitionDate: initialData?.acquisitionDate
      ? new Date(initialData.acquisitionDate).toISOString().split('T')[0] : today,
    initialMeasurements: {},
    currentMeasurements: {},
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

  // Validate initial measurements (all must be positive if provided)
  for (const [type, value] of Object.entries(values.initialMeasurements)) {
    if (value) {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        errors.initialMeasurements = `Initial ${type.toLowerCase().replace('_', ' ')} must be a positive number`
        break
      }
    }
  }

  // Validate current measurements (all must be positive if provided)
  for (const [type, value] of Object.entries(values.currentMeasurements)) {
    if (value) {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        errors.currentMeasurements = `Current ${type.toLowerCase().replace('_', ' ')} must be a positive number`
        break
      }
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

  const isPending = createMutation.isPending || updateMutation.isPending || savingStatus !== null

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
        }

        // Step 2: Process and save profile photo if selected
        if (profileImage) {
          setSavingStatus('Processing photo...')
          try {
            await uploadPhotoToReptile(savedReptile.id, profileImage)
          } catch (photoErr) {
            // Photo upload failed - show error to user and don't close the form
            logger.error(
              { err: photoErr, reptileId: savedReptile.id },
              'Failed to upload profile photo'
            )
            setSavingStatus(null)
            const errorMessage = photoErr instanceof Error ? photoErr.message : 'Failed to upload photo'
            setFieldError('name', `Reptile saved but photo upload failed: ${errorMessage}`)
            return // Don't close the form - let user retry or dismiss
          }
        }

        // Step 3: Create measurement records
        const acquisitionDate = new Date(formValues.acquisitionDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isAcquisitionToday = acquisitionDate.toDateString() === today.toDateString()

        // Get measurement types for species
        const measurementTypes = getMeasurementTypesForSpecies(formValues.species)

        // Create initial measurements (at acquisition date)
        const initialMeasurements = Object.entries(formValues.initialMeasurements)
          .filter(([type, value]) => value && measurementTypes.includes(type as MeasurementType))

        if (initialMeasurements.length > 0) {
          setSavingStatus('Recording initial measurements...')
          for (const [type, value] of initialMeasurements) {
            const numValue = parseFloat(value)
            if (numValue > 0) {
              try {
                await createMeasurement(
                  savedReptile.id,
                  type as MeasurementType,
                  numValue,
                  MEASUREMENT_UNITS[type as MeasurementType],
                  acquisitionDate
                )
              } catch (measureErr) {
                logger.error(
                  { err: measureErr, reptileId: savedReptile.id, type },
                  'Failed to create initial measurement'
                )
              }
            }
          }
        }

        // Create current measurements (only if acquisition date is not today and value differs)
        if (!isAcquisitionToday) {
          const currentMeasurements = Object.entries(formValues.currentMeasurements)
            .filter(([type, value]) => {
              if (!value || !measurementTypes.includes(type as MeasurementType)) return false
              // Only create if value differs from initial or no initial value
              const initialValue = formValues.initialMeasurements[type]
              return !initialValue || value !== initialValue
            })

          if (currentMeasurements.length > 0) {
            setSavingStatus('Recording current measurements...')
            for (const [type, value] of currentMeasurements) {
              const numValue = parseFloat(value)
              if (numValue > 0) {
                try {
                  await createMeasurement(
                    savedReptile.id,
                    type as MeasurementType,
                    numValue,
                    MEASUREMENT_UNITS[type as MeasurementType],
                    today
                  )
                } catch (measureErr) {
                  logger.error(
                    { err: measureErr, reptileId: savedReptile.id, type },
                    'Failed to create current measurement'
                  )
                }
              }
            }
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

  // Upload photo to reptile - processes image and stores in database
  async function uploadPhotoToReptile(targetReptileId: string, file: File): Promise<void> {
    // Process image: resize to 800x800 max, convert to JPEG, compress at 60%
    const imageData = await processImage(file)

    // Create photo record with imageData directly in database
    const createRes = await fetch(`/api/reptiles/${targetReptileId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData,
        category: 'GENERAL',
        takenAt: new Date().toISOString(),
        isPrimary: true,
      }),
    })

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Failed to save photo (${createRes.status})`)
    }
  }

  // Create measurement record
  async function createMeasurement(
    targetReptileId: string,
    type: MeasurementType,
    value: number,
    unit: string,
    date: Date
  ): Promise<void> {
    const res = await fetch(`/api/reptiles/${targetReptileId}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, unit, date: date.toISOString() }),
    })
    if (!res.ok) {
      throw new Error(`Failed to create ${type} measurement`)
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

      {/* Species-aware Measurements Section */}
      {values.species && (
        <MeasurementsSection
          species={values.species}
          acquisitionDate={values.acquisitionDate}
          initialMeasurements={values.initialMeasurements as Record<string, string>}
          currentMeasurements={values.currentMeasurements as Record<string, string>}
          onInitialChange={(type, value) => {
            setFieldValue('initialMeasurements', {
              ...values.initialMeasurements,
              [type]: value,
            })
          }}
          onCurrentChange={(type, value) => {
            setFieldValue('currentMeasurements', {
              ...values.currentMeasurements,
              [type]: value,
            })
          }}
          disabled={isPending}
          errors={{
            initial: errors.initialMeasurements as string | undefined,
            current: errors.currentMeasurements as string | undefined,
          }}
        />
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
          {savingStatus || (isEditing ? 'Save' : 'Add Reptile')}
        </Button>
      </div>
    </form>
  )
}
