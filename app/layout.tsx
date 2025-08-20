// layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from '@/components/Providers'
import Script from 'next/script';
import ConsentBanner from '@/components/ConsentBanner'
import ThirdPartyScripts from '@/components/ThirdPartyScripts'

export const metadata: Metadata = {
  metadataBase: new URL('https://learntheglobe.com'),
  title: {
    default: 'Learn the Globe',
    template: '%s · Learn the Globe', // used by pages below
  },
  description: 'Practice geography by clicking countries on a 3D globe',

  alternates: { canonical: '/' },
  openGraph: {
    title: 'Learn the Globe',
    description: 'Geography quizzes: countries, capitals, and flags.',
    url: 'https://learntheglobe.com',
    siteName: 'Learn the Globe',
    images: ['/og-image.jpg'], // 1200x630
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn the Globe',
    description: 'Geography quizzes: countries, capitals, and flags.',
    images: ['/og-image.jpg'],
  },
  other: { 'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_CLIENT },

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConsentBanner />
        <ThirdPartyScripts />

        <Providers>{children}</Providers>

        {/* JSON-LD can be in head or body; Google reads both */}
        <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Learn the Globe',
            url: 'https://learntheglobe.com',
            logo: 'https://learntheglobe.com/icon.png', // square PNG/JPG (not .ico)
          })}
        </Script>
      </body>
    </html>
  )
}


