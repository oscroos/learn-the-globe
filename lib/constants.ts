// lib/constants.ts
/** Build-time flag (safe in client code). */
export const IS_DEV = process.env.NODE_ENV !== 'production'

/** Game modes */
export const MODES = ['country', 'capital', 'flag'] as const
export type Mode = typeof MODES[number]

/** Base regions */
export const CONTINENTS = [
  'Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America',
] as const

/** Rows used in the achievements table */
export const GEOGRAPHIES = [
  ...CONTINENTS,
  'World', 'Americas', 'Eurasia',
] as const

export type Continent  = typeof CONTINENTS[number]
export type Geography  = typeof GEOGRAPHIES[number]

/** Map an achievements geography to the regions list for a game run */
export function regionsFor(geo: Geography): readonly Continent[] {
  if (geo === 'World')    return CONTINENTS
  if (geo === 'Americas') return ['North America', 'South America']
  if (geo === 'Eurasia')  return ['Europe', 'Asia']
  return [geo]
}

export const TOTAL_ACHIEVEMENTS = MODES.length * GEOGRAPHIES.length // 27
