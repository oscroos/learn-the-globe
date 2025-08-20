// lib/hooks/useUserProfile.ts
'use client'
import { useEffect, useState } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User as FirebaseUser } from 'firebase/auth'
import type { UserProfile } from '@/lib/types'
import { ensureUserDoc } from '@/lib/user'

export default function useUserProfile(user: FirebaseUser | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)

    // Ensure the doc exists (first login / Google sign-in)
    ensureUserDoc(user).catch(console.error)

    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null)
      setLoading(false)
    }, () => setLoading(false))

    return () => unsub()
  }, [user?.uid])

  return { profile, loading }
}
