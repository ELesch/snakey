// Species Chart Configuration
// Defines which chart types are applicable to each species category

import { getSpeciesCategory, type SpeciesCategory } from './measurements'

/**
 * Available chart types in the Reports page
 */
export type ChartType = 'feeding' | 'growth' | 'shedding' | 'environment'

/**
 * Charts applicable to each species category
 * Turtles and tortoises don't shed in the traditional sense that reptile owners track
 */
const CHARTS_BY_CATEGORY: Record<SpeciesCategory, ChartType[]> = {
  snake: ['feeding', 'growth', 'shedding', 'environment'],
  lizard: ['feeding', 'growth', 'shedding', 'environment'],
  gecko: ['feeding', 'growth', 'shedding', 'environment'],
  turtle: ['feeding', 'growth', 'environment'], // No shedding
  tortoise: ['feeding', 'growth', 'environment'], // No shedding
  other: ['feeding', 'growth', 'shedding', 'environment'],
}

/**
 * All available chart types (shown when "All Reptiles" is selected)
 */
const ALL_CHARTS: ChartType[] = ['feeding', 'growth', 'shedding', 'environment']

/**
 * Get the applicable chart types for a given species
 *
 * @param species - The species ID (e.g., 'ball_python', 'russian_tortoise')
 * @returns Array of ChartType values applicable to the species
 *
 * @example
 * ```typescript
 * getChartsForSpecies('ball_python')
 * // Returns: ['feeding', 'growth', 'shedding', 'environment']
 *
 * getChartsForSpecies('russian_tortoise')
 * // Returns: ['feeding', 'growth', 'environment']
 *
 * getChartsForSpecies() // No species (All Reptiles)
 * // Returns: ['feeding', 'growth', 'shedding', 'environment']
 * ```
 */
export function getChartsForSpecies(species?: string): ChartType[] {
  if (!species) {
    return ALL_CHARTS
  }
  const category = getSpeciesCategory(species)
  return CHARTS_BY_CATEGORY[category]
}
