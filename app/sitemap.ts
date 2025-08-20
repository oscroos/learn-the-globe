// app/sitemap.ts
import type { MetadataRoute } from 'next'
// If you have enums/constants:
import { MODES, GEOGRAPHIES } from '@/lib/constants'

// If your route slugs differ from labels, make sure to map/slugify them.
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-')

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://learntheglobe.com'
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/quiz`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const quizEntries: MetadataRoute.Sitemap = MODES.flatMap((m) =>
    GEOGRAPHIES.map((g) => ({
      url: `${base}/quiz/${slug(m)}/${slug(g)}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  )

  return [...staticEntries, ...quizEntries]
}
