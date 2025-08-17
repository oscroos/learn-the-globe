// RightPanel.tsx
'use client'
import { auth, db, googleProvider, appleProvider } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useGame } from '@/lib/store/gameStore'
import type { SessionDoc } from '@/lib/types'

export default function RightPanel() {
    const [user, setUser] = useState<null | { uid: string; displayName: string | null; photoURL: string | null; email: string | null }>(null)
    const g = useGame()

    useEffect(() => {
        return onAuthStateChanged(auth, u => setUser(u ? { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, email: u.email } : null))
    }, [])

    // Persist finished session
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
    }, [g.status])


    const signInGoogle = async () => {
        await signInWithPopup(auth, googleProvider)
    }
    const signInApple = async () => {
        await signInWithPopup(auth, appleProvider)
    }


    return (
        <div className="fixed top-4 right-4 w-[280px] md:w-[320px] panel z-10">
            {!user ? (
                <div className="space-y-3">
                    <h2 className="h2 text-center">Profile</h2>
                    <p className="text-sm text-slate-600">Sign in to save your results.</p>
                    <button className="btn btn-secondary w-full" onClick={signInGoogle}>Sign in with Google</button>
                    <button className="btn btn-secondary w-full" onClick={signInApple}>Sign in with Apple</button>


                    <EmailAuth />
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="h2">Hello{user.displayName ? `, ${user.displayName}` : ''} 👋</h2>
                    <div className="text-sm text-slate-700">
                        <div><b>Email:</b> {user.email ?? '—'}</div>
                    </div>


                    <div className="mt-3 space-y-1 text-sm">
                        <div><b>Current mode:</b> {g.mode}</div>
                        <div><b>Progress:</b> {g.index}/{g.quiz.length}</div>
                        <div><b>Correct so far:</b> {g.correct.size}</div>
                    </div>


                    <button className="btn btn-ghost w-full" onClick={() => signOut(auth)}>Sign out</button>
                </div>
            )}
        </div>
    )
}


function EmailAuth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)


    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password)
        } else {
            await createUserWithEmailAndPassword(auth, email, password)
        }
    }


    return (
        <form onSubmit={submit} className="space-y-2 pt-2">
            <div className="grid gap-2">
                <input className="w-full rounded-xl border p-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="w-full rounded-xl border p-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full" type="submit">{isLogin ? 'Log in' : 'Create account'}</button>
            <button type="button" className="text-xs underline text-slate-600" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Need an account? Create one' : 'Have an account? Log in'}
            </button>
        </form>
    )
}