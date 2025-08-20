'use client'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { getConsent } from '@/lib/consent'
import { GA_ID, ADS_CLIENT } from '@/lib/constants'

export default function ThirdPartyScripts() {
  const [consent, setConsent] = useState<{ads:boolean;analytics:boolean} | null>(null)
  useEffect(() => setConsent(getConsent()), [])

  return (
    <>
      {/* Consent Mode defaults (denied) – runs even before consent */}
      <Script id="consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments)}
          gtag('consent','default',{
            ad_user_data:'denied',ad_personalization:'denied',
            ad_storage:'denied',analytics_storage:'denied'
          });`}
      </Script>

      {/* GA4 after consent */}
      {GA_ID && consent?.analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive"/>
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments)}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      )}

      {/* AdSense after ads consent */}
      {ADS_CLIENT && consent?.ads && (
        <Script
          id="adsense"
          strategy="afterInteractive"
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`}
        />
      )}
    </>
  )
}
