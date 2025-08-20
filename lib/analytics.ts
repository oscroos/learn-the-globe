import { GA_ID } from '@/lib/constants'

export function gaEvent(name: string, params: Record<string, any> = {}) {
  if (!GA_ID || typeof window === 'undefined' || !(window as any).gtag) return
  ;(window as any).gtag('event', name, params)
}
