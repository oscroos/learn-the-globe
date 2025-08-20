import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '@/lib/firebase'
import type { UserProfile } from './types'

export function userDocRef(uid: string) {
  return doc(db, 'users', uid)
}

/** Create a minimal user document if it doesn't exist. */
export async function ensureUserDoc(user: User) {
  const ref = userDocRef(user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  const providerId =
    user.providerData.find(p => p?.providerId)?.providerId ?? 'password'
  const provider: 'password' | 'google' =
    providerId.includes('google') ? 'google' : 'password'

  const payload: UserProfile = {
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    achievements: [],
    provider,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload, { merge: true })
}

/** Set home country once (no-op if already set). */
export async function setHomeCountryOnce(
  uid: string,
  code: string,
  name: string
) {
  const ref = userDocRef(uid)
  const snap = await getDoc(ref)
  const data = snap.data() as UserProfile | undefined
  if (data?.homeCountryCode) {
    // already set: don't overwrite
    return false
  }
  await setDoc(
    ref,
    { homeCountryCode: code, homeCountryName: name, updatedAt: serverTimestamp() },
    { merge: true }
  )
  return true
}
