// utils.ts
import type { CountryFeature } from './types'
import { geoCentroid } from 'd3-geo'

export const shuffle = <T,>(arr: T[]) => {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}


export const featureId = (f: CountryFeature) => f.properties.ADM0_A3 // Use ADMIN as the feature ID


export const centroid = (f: CountryFeature) => {
    const c = geoCentroid(f as any)
    return { lat: c[1], lng: c[0] }
}


export const flagUrl = (
    iso2?: string,
    size: '24x18' | '48x36' | '96x72' | '160x120' | '256x192' = '256x192'
) => (iso2 ? `https://flagcdn.com/${size}/${iso2.toLowerCase()}.png` : undefined)