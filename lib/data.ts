// lib/data.ts
import type { CountryFeature } from './types'

export interface CapitalMap { [key: string]: { capital: string } }

let _countries: CountryFeature[] = []
let _capitals: CapitalMap = {}

export async function loadCountries(): Promise<CountryFeature[]> {
    if (_countries.length) return _countries
    const res = await fetch('/data/countries.geojson')
    const gj = await res.json()
    _countries = (gj.features ?? [])
    return _countries
}

export async function loadCapitals(): Promise<CapitalMap> {
    if (Object.keys(_capitals).length) return _capitals
    const res = await fetch('/data/capitals.json')
    _capitals = await res.json()
    return _capitals
}

export function getCapitalFor(f: CountryFeature, capitals: CapitalMap) {
    const key = f.properties.ADM0_A3 ?? f.properties.ADMIN
    return capitals[key]?.capital
}