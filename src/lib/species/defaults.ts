// Built-in Species Configuration Defaults
// These provide sensible defaults for common reptile species

export interface SpeciesConfig {
  species: string
  commonName: string
  tempHotMin: number
  tempHotMax: number
  tempCoolMin: number
  tempCoolMax: number
  humidityMin: number
  humidityMax: number
  feedingInterval: number // Days between feedings (typical adult)
  notes?: string
}

export const SPECIES_DEFAULTS: SpeciesConfig[] = [
  // SNAKES
  {
    species: 'ball_python',
    commonName: 'Ball Python',
    tempHotMin: 88,
    tempHotMax: 92,
    tempCoolMin: 75,
    tempCoolMax: 80,
    humidityMin: 50,
    humidityMax: 60,
    feedingInterval: 7,
    notes: 'May refuse food during breeding season or when in blue',
  },
  {
    species: 'corn_snake',
    commonName: 'Corn Snake',
    tempHotMin: 85,
    tempHotMax: 88,
    tempCoolMin: 72,
    tempCoolMax: 78,
    humidityMin: 40,
    humidityMax: 50,
    feedingInterval: 7,
    notes: 'Hardy species, good for beginners',
  },
  {
    species: 'boa_constrictor',
    commonName: 'Boa Constrictor',
    tempHotMin: 85,
    tempHotMax: 90,
    tempCoolMin: 75,
    tempCoolMax: 80,
    humidityMin: 60,
    humidityMax: 70,
    feedingInterval: 14,
    notes: 'Can grow large, adjust feeding based on size',
  },
  {
    species: 'kingsnake',
    commonName: 'Kingsnake',
    tempHotMin: 85,
    tempHotMax: 88,
    tempCoolMin: 72,
    tempCoolMax: 78,
    humidityMin: 40,
    humidityMax: 60,
    feedingInterval: 7,
    notes: 'Active feeders, ophiophagous (may eat other snakes)',
  },
  {
    species: 'milk_snake',
    commonName: 'Milk Snake',
    tempHotMin: 84,
    tempHotMax: 88,
    tempCoolMin: 70,
    tempCoolMax: 75,
    humidityMin: 40,
    humidityMax: 60,
    feedingInterval: 7,
    notes: 'Similar care to kingsnakes',
  },
  {
    species: 'hognose',
    commonName: 'Hognose Snake',
    tempHotMin: 85,
    tempHotMax: 90,
    tempCoolMin: 72,
    tempCoolMax: 78,
    humidityMin: 30,
    humidityMax: 50,
    feedingInterval: 7,
    notes: 'May require scenting for picky eaters',
  },
  {
    species: 'carpet_python',
    commonName: 'Carpet Python',
    tempHotMin: 86,
    tempHotMax: 90,
    tempCoolMin: 75,
    tempCoolMax: 80,
    humidityMin: 50,
    humidityMax: 70,
    feedingInterval: 10,
    notes: 'Arboreal, needs vertical space',
  },
  {
    species: 'reticulated_python',
    commonName: 'Reticulated Python',
    tempHotMin: 88,
    tempHotMax: 92,
    tempCoolMin: 78,
    tempCoolMax: 82,
    humidityMin: 60,
    humidityMax: 70,
    feedingInterval: 14,
    notes: 'Very large species, requires experienced keeper',
  },

  // LIZARDS
  {
    species: 'leopard_gecko',
    commonName: 'Leopard Gecko',
    tempHotMin: 88,
    tempHotMax: 92,
    tempCoolMin: 75,
    tempCoolMax: 80,
    humidityMin: 30,
    humidityMax: 40,
    feedingInterval: 2,
    notes: 'Crepuscular, needs belly heat',
  },
  {
    species: 'crested_gecko',
    commonName: 'Crested Gecko',
    tempHotMin: 72,
    tempHotMax: 78,
    tempCoolMin: 65,
    tempCoolMax: 72,
    humidityMin: 60,
    humidityMax: 80,
    feedingInterval: 2,
    notes: 'No supplemental heat usually needed, needs high humidity',
  },
  {
    species: 'bearded_dragon',
    commonName: 'Bearded Dragon',
    tempHotMin: 100,
    tempHotMax: 110,
    tempCoolMin: 75,
    tempCoolMax: 85,
    humidityMin: 30,
    humidityMax: 40,
    feedingInterval: 1,
    notes: 'Diurnal, needs UVB lighting',
  },
  {
    species: 'blue_tongue_skink',
    commonName: 'Blue Tongue Skink',
    tempHotMin: 95,
    tempHotMax: 100,
    tempCoolMin: 75,
    tempCoolMax: 80,
    humidityMin: 40,
    humidityMax: 60,
    feedingInterval: 2,
    notes: 'Omnivorous, needs varied diet',
  },
  {
    species: 'chameleon_veiled',
    commonName: 'Veiled Chameleon',
    tempHotMin: 85,
    tempHotMax: 95,
    tempCoolMin: 70,
    tempCoolMax: 75,
    humidityMin: 50,
    humidityMax: 70,
    feedingInterval: 1,
    notes: 'Needs screen enclosure, misting system',
  },

  // TORTOISES & TURTLES
  {
    species: 'red_eared_slider',
    commonName: 'Red-Eared Slider',
    tempHotMin: 85,
    tempHotMax: 90,
    tempCoolMin: 75,
    tempCoolMax: 80,
    humidityMin: 70,
    humidityMax: 90,
    feedingInterval: 1,
    notes: 'Aquatic, needs large water volume and basking area',
  },
  {
    species: 'russian_tortoise',
    commonName: 'Russian Tortoise',
    tempHotMin: 90,
    tempHotMax: 100,
    tempCoolMin: 70,
    tempCoolMax: 80,
    humidityMin: 40,
    humidityMax: 60,
    feedingInterval: 1,
    notes: 'Herbivorous, outdoor enclosure when weather permits',
  },
]

/**
 * Get species configuration by species ID
 */
export function getSpeciesConfig(species: string): SpeciesConfig | undefined {
  return SPECIES_DEFAULTS.find((s) => s.species === species)
}

/**
 * Get display name for a species (common name if known, formatted ID otherwise)
 */
export function getSpeciesDisplayName(species: string): string {
  const config = getSpeciesConfig(species)
  if (config) {
    return config.commonName
  }
  // Format unknown species: snake_case -> Title Case
  return species
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get all species as options for select
 */
export function getSpeciesOptions(): Array<{ value: string; label: string }> {
  return SPECIES_DEFAULTS.map((s) => ({
    value: s.species,
    label: s.commonName,
  }))
}

/**
 * Check if a temperature is within the safe range for a species
 */
export function isTemperatureSafe(
  species: string,
  temperature: number,
  location: 'hot' | 'cool'
): boolean {
  const config = getSpeciesConfig(species)
  if (!config) return true // Unknown species, assume safe

  if (location === 'hot') {
    return temperature >= config.tempHotMin && temperature <= config.tempHotMax
  } else {
    return temperature >= config.tempCoolMin && temperature <= config.tempCoolMax
  }
}

/**
 * Check if humidity is within the safe range for a species
 */
export function isHumiditySafe(species: string, humidity: number): boolean {
  const config = getSpeciesConfig(species)
  if (!config) return true // Unknown species, assume safe

  return humidity >= config.humidityMin && humidity <= config.humidityMax
}
