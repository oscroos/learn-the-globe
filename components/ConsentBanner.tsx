'use client'
import { useEffect, useState } from 'react'
import { getConsent, setConsent, type Consent } from '@/lib/consent'

export default function ConsentBanner() {
  const [shown, setShown] = useState(false)
  useEffect(() => { if (!getConsent()) setShown(true) }, [])

  if (!shown) return null

  const choose = (c: Consent) => {
    setConsent(c)
    // Consent Mode v2 defaults -> granted
    // @ts-ignore
    window.gtag?.('consent', 'update', {
      ad_user_data: c.ads ? 'granted' : 'denied',
      ad_personalization: c.ads ? 'granted' : 'denied',
      ad_storage: c.ads ? 'granted' : 'denied',
      analytics_storage: c.analytics ? 'granted' : 'denied',
    })
    setShown(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] rounded-2xl border shadow-xl bg-white p-4 text-sm">
      <div className="mb-3">
        We use cookies for analytics and to show ads. Choose your preferences.
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn btn-ghost" onClick={() => choose({ ads:false, analytics:false })}>Reject all</button>
        <button className="btn btn-secondary" onClick={() => choose({ ads:false, analytics:true })}>Analytics only</button>
        <button className="btn btn-primary" onClick={() => choose({ ads:true, analytics:true })}>Accept all</button>
      </div>
    </div>
  )
}
