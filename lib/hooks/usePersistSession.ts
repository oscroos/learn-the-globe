'use client'

import { useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useGame } from '@/lib/store/gameStore'
import type { SessionDoc } from '@/lib/types'

type MiniUser = { uid: string } | null

export default function usePersistSession(user: MiniUser) {
  const g = useGame()
  useEffect(() => {
    if (g.status !== 'finished' || !user) return
    const started = g.startedAt ?? Date.now()
    const payload: SessionDoc = {
      createdAt: Date.now(),
      mode: g.mode,
      regions: g.regions,
      count: g.quiz.length,
      correct: g.correct.size,
      errors: g.errors,
      skipped: g.skipped,
      durationMs: Date.now() - started,
    }
    addDoc(collection(db, 'users', user.uid, 'sessions'), payload).catch(console.error)
  }, [g.status, user])
}
