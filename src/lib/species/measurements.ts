// Species Measurement Configuration
// Defines which measurement types are applicable to each species category

import { MeasurementType } from '@/generated/prisma/client'

// Species categories for measurement assignment
export type SpeciesCategory = 'snake' | 'lizard' | 'gecko' | 'turtle' | 'tortoise' | 'other'

// Map species to their category
const SPECIES_CATEGORIES: Record<string, SpeciesCategory> = {
  // Snakes
  ball_python: 'snake',
  corn_snake: 'snake',
  boa_constrictor: 'snake',
  kingsnake: 'snake',
  milk_snake: 'snake',
  hognose: 'snake',
  carpet_python: 'snake',
  reticulated_python: 'snake',
  // Lizards
  bearded_dragon: 'lizard',
  blue_tongue_skink: 'lizard',
  chameleon_veiled: 'lizard',
  // Geckos
  leopard_gecko: 'gecko',
  crested_gecko: 'gecko',
  // Turtles
  red_eared_slider: 'turtle',
  // Tortoises
  russian_tortoise: 'tortoise',
}

// Measurement types by category
const MEASUREMENTS_BY_CATEGORY: Record<SpeciesCategory, MeasurementType[]> = {
  snake: ['WEIGHT', 'LENGTH'],
  lizard: ['WEIGHT', 'LENGTH', 'SNOUT_TO_VENT'],
  gecko: ['WEIGHT', 'LENGTH', 'SNOUT_TO_VENT'],
  turtle: ['WEIGHT', 'SHELL_LENGTH', 'SHELL_WIDTH'],
  tortoise: ['WEIGHT', 'SHELL_LENGTH', 'SHELL_WIDTH'],
  other: ['WEIGHT', 'LENGTH'],
}

/**
 * Default units for each measurement type
 */
export const MEASUREMENT_UNITS: Record<MeasurementType, string> = {
  WEIGHT: 'g',
  LENGTH: 'cm',
  SHELL_LENGTH: 'cm',
  SHELL_WIDTH: 'cm',
  SNOUT_TO_VENT: 'cm',
  TAIL_LENGTH: 'cm',
}

/**
 * Human-readable labels for each measurement type
 */
export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  WEIGHT: 'Weight',
  LENGTH: 'Length',
  SHELL_LENGTH: 'Shell Length',
  SHELL_WIDTH: 'Shell Width',
  SNOUT_TO_VENT: 'Snout-to-Vent',
  TAIL_LENGTH: 'Tail Length',
}

/**
 * Get the applicable measurement types for a given species
 *
 * @param species - The species ID (e.g., 'ball_python', 'leopard_gecko')
 * @returns Array of MeasurementType values applicable to the species
 *
 * @example
 * ```typescript
 * getMeasurementTypesForSpecies('ball_python')
 * // Returns: ['WEIGHT', 'LENGTH']
 *
 * getMeasurementTypesForSpecies('leopard_gecko')
 * // Returns: ['WEIGHT', 'LENGTH', 'SNOUT_TO_VENT']
 *
 * getMeasurementTypesForSpecies('russian_tortoise')
 * // Returns: ['WEIGHT', 'SHELL_LENGTH', 'SHELL_WIDTH']
 * ```
 */
export function getMeasurementTypesForSpecies(species: string): MeasurementType[] {
  const category = SPECIES_CATEGORIES[species] || 'other'
  return MEASUREMENTS_BY_CATEGORY[category]
}

/**
 * Get the category for a given species
 *
 * @param species - The species ID (e.g., 'ball_python', 'leopard_gecko')
 * @returns The SpeciesCategory for the species, or 'other' if unknown
 *
 * @example
 * ```typescript
 * getSpeciesCategory('ball_python')
 * // Returns: 'snake'
 *
 * getSpeciesCategory('unknown_species')
 * // Returns: 'other'
 * ```
 */
export function getSpeciesCategory(species: string): SpeciesCategory {
  return SPECIES_CATEGORIES[species] || 'other'
}

/**
 * Get all available measurement types
 *
 * @returns Array of all MeasurementType values
 */
export function getAllMeasurementTypes(): MeasurementType[] {
  return Object.keys(MEASUREMENT_UNITS) as MeasurementType[]
}

/**
 * Get the display label for a measurement type
 *
 * @param type - The MeasurementType to get the label for
 * @returns Human-readable label for the measurement type
 */
export function getMeasurementLabel(type: MeasurementType): string {
  return MEASUREMENT_LABELS[type]
}

/**
 * Get the default unit for a measurement type
 *
 * @param type - The MeasurementType to get the unit for
 * @returns Default unit string for the measurement type
 */
export function getMeasurementUnit(type: MeasurementType): string {
  return MEASUREMENT_UNITS[type]
}
