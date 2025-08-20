// lib/types.ts
import type { Mode } from './constants'

export interface CountryFeature extends GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon> {
    properties: {
        ADMIN: string
        ISO_A2?: string
        ISO_A3?: string
        CONTINENT?: string
        LATITUDE?: number
        LONGITUDE?: number
        [k: string]: any
    }
}

export interface SessionDoc {
    createdAt: number
    mode: Mode
    regions: string[]
    count: number
    correct: number
    errors: number
    skipped: number
    durationMs: number
}

export type Geography =
  | 'Africa' | 'Asia' | 'Europe' | 'North America' | 'Oceania' | 'South America'
  | 'World' | 'Americas' | 'Eurasia';

export type AchievementKey = `${Mode}:${Geography}` // e.g. "country:Europe"

export interface UserProfile {
  displayName: string | null
  email: string | null
  homeCountryCode?: string        // ISO-2 (e.g. "NO")
  homeCountryName?: string
  achievements?: AchievementKey[] // e.g. ["country:Europe", "capital:Asia"]
  createdAt?: unknown
  updatedAt?: unknown
  provider?: 'password' | 'google'
}
