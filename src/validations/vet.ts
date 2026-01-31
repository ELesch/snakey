// Vet Validation Schemas - Zod 4
import { z } from 'zod'

// ============================================================================
// VET VISIT SCHEMAS
// ============================================================================

export const VetVisitCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  date: z.coerce.date(),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be 500 characters or less')
    .trim(),
  diagnosis: z
    .string()
    .max(2000, 'Diagnosis must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  treatment: z
    .string()
    .max(2000, 'Treatment must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  vetName: z
    .string()
    .max(200, 'Veterinarian name must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  vetClinic: z
    .string()
    .max(200, 'Clinic name must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  cost: z.coerce
    .number()
    .nonnegative('Cost must be non-negative')
    .optional()
    .nullable(),
  followUp: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type VetVisitCreate = z.infer<typeof VetVisitCreateSchema>

export const VetVisitUpdateSchema = z.object({
  date: z.coerce.date().optional(),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be 500 characters or less')
    .trim()
    .optional(),
  diagnosis: z
    .string()
    .max(2000, 'Diagnosis must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  treatment: z
    .string()
    .max(2000, 'Treatment must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  vetName: z
    .string()
    .max(200, 'Veterinarian name must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  vetClinic: z
    .string()
    .max(200, 'Clinic name must be 200 characters or less')
    .trim()
    .optional()
    .nullable(),
  cost: z.coerce
    .number()
    .nonnegative('Cost must be non-negative')
    .optional()
    .nullable(),
  followUp: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type VetVisitUpdate = z.infer<typeof VetVisitUpdateSchema>

// ============================================================================
// MEDICATION SCHEMAS
// ============================================================================

export const MedicationCreateSchema = z.object({
  id: z.string().cuid2().optional(), // For offline-created records
  name: z
    .string()
    .min(1, 'Medication name is required')
    .max(200, 'Medication name must be 200 characters or less')
    .trim(),
  dosage: z
    .string()
    .min(1, 'Dosage is required')
    .max(100, 'Dosage must be 100 characters or less')
    .trim(),
  frequency: z
    .string()
    .min(1, 'Frequency is required')
    .max(100, 'Frequency must be 100 characters or less')
    .trim(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  reminders: z.boolean().default(false),
})

export type MedicationCreate = z.infer<typeof MedicationCreateSchema>

export const MedicationUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Medication name is required')
    .max(200, 'Medication name must be 200 characters or less')
    .trim()
    .optional(),
  dosage: z
    .string()
    .min(1, 'Dosage is required')
    .max(100, 'Dosage must be 100 characters or less')
    .trim()
    .optional(),
  frequency: z
    .string()
    .min(1, 'Frequency is required')
    .max(100, 'Frequency must be 100 characters or less')
    .trim()
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  reminders: z.boolean().optional(),
})

export type MedicationUpdate = z.infer<typeof MedicationUpdateSchema>

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const VetQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['date', 'createdAt', 'reason', 'vetClinic']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type VetQuery = z.infer<typeof VetQuerySchema>

export const MedicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['startDate', 'endDate', 'name', 'createdAt']).default('startDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  activeOnly: z.coerce.boolean().optional(),
})

export type MedicationQuery = z.infer<typeof MedicationQuerySchema>
