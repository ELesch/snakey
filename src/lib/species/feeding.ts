// Centralized Feeding Interval Utilities
// Single source of truth for feeding intervals, used by dashboard service and other modules

import { SPECIES_DEFAULTS, getSpeciesConfig } from './defaults'

/**
 * Default feeding interval in days for unknown species
 */
export const DEFAULT_FEEDING_INTERVAL = 7

/**
 * Get the feeding interval for a species in days.
 * Uses species configuration from defaults.ts as the single source of truth.
 *
 * @param species - Species identifier (snake_case, e.g., 'ball_python')
 * @returns Feeding interval in days
 */
export function getFeedingInterval(species: string): number {
  const config = getSpeciesConfig(species)
  return config?.feedingInterval ?? DEFAULT_FEEDING_INTERVAL
}

/**
 * Build a SQL CASE statement for feeding intervals.
 * Used in raw SQL queries to avoid N+1 patterns.
 *
 * @param columnName - The SQL column reference (e.g., 'r.species')
 * @returns SQL CASE statement string
 *
 * @example
 * const sql = buildFeedingIntervalSqlCase('r.species')
 * // Returns: "CASE r.species WHEN 'ball_python' THEN 7 WHEN 'corn_snake' THEN 7 ... ELSE 7 END"
 */
export function buildFeedingIntervalSqlCase(columnName: string): string {
  const cases = SPECIES_DEFAULTS.map(
    (species) => `WHEN '${species.species}' THEN ${species.feedingInterval}`
  ).join(' ')

  return `CASE ${columnName} ${cases} ELSE ${DEFAULT_FEEDING_INTERVAL} END`
}

/**
 * Type for feeding interval lookup (species ID to interval days)
 */
export type FeedingIntervalMap = Record<string, number>

/**
 * Get all feeding intervals as a map for use in application code.
 * Useful when you need to look up multiple species without repeated function calls.
 *
 * @returns Map of species ID to feeding interval in days
 */
export function getFeedingIntervalsMap(): FeedingIntervalMap {
  const map: FeedingIntervalMap = {}
  for (const species of SPECIES_DEFAULTS) {
    map[species.species] = species.feedingInterval
  }
  return map
}
