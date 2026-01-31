// Species Configuration Types and Utilities
import type { SpeciesConfig } from '@/generated/prisma/client'

export interface SpeciesParameters {
  tempHotMin: number
  tempHotMax: number
  tempCoolMin: number
  tempCoolMax: number
  humidityMin: number
  humidityMax: number
  feedingInterval: number
}

/**
 * Merge user overrides with default species config
 */
export function mergeSpeciesConfig(
  defaults: SpeciesParameters,
  overrides?: Partial<SpeciesParameters>
): SpeciesParameters {
  return {
    ...defaults,
    ...overrides,
  }
}

/**
 * Format temperature for display
 */
export function formatTemperature(tempF: number): string {
  return `${tempF}°F`
}

/**
 * Format humidity for display
 */
export function formatHumidity(humidity: number): string {
  return `${humidity}%`
}

/**
 * Get temperature range string
 */
export function getTemperatureRange(min: number, max: number): string {
  return `${min}-${max}°F`
}

/**
 * Get humidity range string
 */
export function getHumidityRange(min: number, max: number): string {
  return `${min}-${max}%`
}

/**
 * Calculate feeding schedule message
 */
export function getFeedingScheduleMessage(intervalDays: number): string {
  if (intervalDays === 1) {
    return 'Daily'
  } else if (intervalDays === 7) {
    return 'Weekly'
  } else if (intervalDays === 14) {
    return 'Every 2 weeks'
  } else {
    return `Every ${intervalDays} days`
  }
}
