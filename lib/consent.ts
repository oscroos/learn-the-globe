export type Consent = { ads: boolean; analytics: boolean };
const KEY = 'ltg-consent:v1';

export function getConsent(): Consent | null {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function setConsent(c: Consent) { localStorage.setItem(KEY, JSON.stringify(c)); }
