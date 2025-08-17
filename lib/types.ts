export type Mode = 'country' | 'capital' | 'flag'


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