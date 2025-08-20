// app/robots.ts
import { IS_DEV } from '@/lib/constants'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const isProd = !IS_DEV
  return isProd
    ? {
        rules: [{ userAgent: '*', allow: '/' }],
        sitemap: 'https://learntheglobe.com/sitemap.xml',
      }
    : {
        // Prevent indexing on preview/dev
        rules: [{ userAgent: '*', disallow: '/' }],
      }
}
