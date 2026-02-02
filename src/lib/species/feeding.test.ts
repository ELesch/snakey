// Feeding Utilities Tests
import { describe, it, expect } from 'vitest'
import {
  getFeedingInterval,
  DEFAULT_FEEDING_INTERVAL,
  buildFeedingIntervalSqlCase,
  getFeedingIntervalsMap,
} from './feeding'

describe('getFeedingInterval', () => {
  it('returns correct interval for ball_python (snake_case)', () => {
    expect(getFeedingInterval('ball_python')).toBe(7)
  })

  it('returns correct interval for corn_snake', () => {
    expect(getFeedingInterval('corn_snake')).toBe(7)
  })

  it('returns correct interval for leopard_gecko', () => {
    expect(getFeedingInterval('leopard_gecko')).toBe(2)
  })

  it('returns correct interval for bearded_dragon', () => {
    expect(getFeedingInterval('bearded_dragon')).toBe(1)
  })

  it('returns correct interval for crested_gecko', () => {
    expect(getFeedingInterval('crested_gecko')).toBe(2)
  })

  it('returns correct interval for boa_constrictor (14 days)', () => {
    expect(getFeedingInterval('boa_constrictor')).toBe(14)
  })

  it('returns correct interval for carpet_python (10 days)', () => {
    expect(getFeedingInterval('carpet_python')).toBe(10)
  })

  it('returns default interval for unknown species', () => {
    expect(getFeedingInterval('unknown_species')).toBe(DEFAULT_FEEDING_INTERVAL)
  })

  it('returns default interval for empty string', () => {
    expect(getFeedingInterval('')).toBe(DEFAULT_FEEDING_INTERVAL)
  })
})

describe('buildFeedingIntervalSqlCase', () => {
  it('generates valid SQL CASE statement', () => {
    const sql = buildFeedingIntervalSqlCase('r.species')

    // Should start with CASE and end with END
    expect(sql).toMatch(/^CASE\s/)
    expect(sql).toMatch(/\sEND$/)

    // Should include known species
    expect(sql).toContain("WHEN 'ball_python' THEN 7")
    expect(sql).toContain("WHEN 'leopard_gecko' THEN 2")
    expect(sql).toContain("WHEN 'bearded_dragon' THEN 1")
    expect(sql).toContain("WHEN 'boa_constrictor' THEN 14")

    // Should include default (ELSE clause)
    expect(sql).toContain(`ELSE ${DEFAULT_FEEDING_INTERVAL}`)
  })

  it('uses provided column name', () => {
    const sql = buildFeedingIntervalSqlCase('reptile.species_type')
    expect(sql).toContain('CASE reptile.species_type')
  })
})

describe('DEFAULT_FEEDING_INTERVAL', () => {
  it('is a reasonable default value', () => {
    expect(DEFAULT_FEEDING_INTERVAL).toBe(7)
  })
})

describe('getFeedingIntervalsMap', () => {
  it('returns a map of species to feeding intervals', () => {
    const map = getFeedingIntervalsMap()

    // Should be an object
    expect(typeof map).toBe('object')

    // Should contain expected species
    expect(map.ball_python).toBe(7)
    expect(map.corn_snake).toBe(7)
    expect(map.leopard_gecko).toBe(2)
    expect(map.bearded_dragon).toBe(1)
    expect(map.boa_constrictor).toBe(14)
    expect(map.crested_gecko).toBe(2)
  })

  it('contains all species from SPECIES_DEFAULTS', () => {
    const map = getFeedingIntervalsMap()
    const speciesCount = Object.keys(map).length

    // Should have multiple species
    expect(speciesCount).toBeGreaterThan(5)
  })

  it('returns consistent values with getFeedingInterval', () => {
    const map = getFeedingIntervalsMap()

    // Values should match getFeedingInterval for each species
    for (const [species, interval] of Object.entries(map)) {
      expect(getFeedingInterval(species)).toBe(interval)
    }
  })
})
