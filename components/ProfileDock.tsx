// ProfileDock.tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { flagUrl } from '@/lib/utils'
import { auth, googleProvider, db } from '@/lib/firebase'
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    linkWithCredential,
    OAuthCredential,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import * as isoCountries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import usePersistSession from '@/lib/hooks/usePersistSession'
import useUserProfile from '@/lib/hooks/useUserProfile'
import { ensureUserDoc, setHomeCountryOnce } from '@/lib/user'
import type { UserProfile } from '@/lib/types'
import { TOTAL_ACHIEVEMENTS } from '@/lib/constants'

isoCountries.registerLocale(enLocale as any)

type MiniUser = { uid: string; displayName: string | null; photoURL: string | null; email: string | null }

export default function ProfileDock() {
    const [user, setUser] = useState<MiniUser | null>(null)

    useEffect(() =>
        onAuthStateChanged(auth, (u) =>
            setUser(u ? { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, email: u.email } : null)
        ),
        [])

    usePersistSession(user)

    const { profile, loading: profileLoading } = useUserProfile(auth.currentUser)

    if (!user) return <SignedOut />
    if (profileLoading || !profile) return <ProfileLoading />   // ⬅️ wait for Firestore doc

    return <SignedIn authUser={user} profile={profile} />
}

/* ----------------------- SIGNED OUT ----------------------- */

function SignedOut() {
    const [linkInfo, setLinkInfo] = useState<{ email: string; cred: OAuthCredential } | null>(null)
    const [linkMsg, setLinkMsg] = useState<string | null>(null)
    const [isLogin, setIsLogin] = useState(true)
    const [googleLoading, setGoogleLoading] = useState(false) // To show spinning wheel

    const signInGoogle = async () => {
        try {
            setGoogleLoading(true)
            await signInWithPopup(auth, googleProvider)
        } catch (e: any) {
            if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
                await signInWithRedirect(auth, googleProvider)
                return
            }
            if (e?.code === 'auth/account-exists-with-different-credential') {
                const email = e?.customData?.email as string | undefined
                const cred = GoogleAuthProvider.credentialFromError(e) as OAuthCredential | null
                if (email && cred) {
                    const methods = await fetchSignInMethodsForEmail(auth, email)
                    if (methods.includes('password')) {
                        setLinkInfo({ email, cred })
                        setLinkMsg('This email already has a password-based account. Please log in below to link Google.')
                        setIsLogin(true)
                        return
                    }
                }
            }
            console.error('Google sign-in error', e)
        } finally {
            setGoogleLoading(false)
        }
    }

    const googleLabel = !linkInfo && !isLogin ? 'Sign up with Google' : 'Sign in with Google'

    return (
        <div className="space-y-3">
            <h2 className="h2 text-center">Profile</h2>
            {/*<p className="text-sm text-slate-600">Sign in to save your results.</p>*/}

            <button
                className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:pointer-events-none"
                onClick={signInGoogle}
                aria-label={googleLabel}
                disabled={googleLoading}
            >
                {googleLoading ? (
                    <span className="w-[1lh] h-[1lh] rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                ) : (
                    <>
                        <Image src="/google_logo.png" alt="" width={20} height={20} />
                        <span>{googleLabel}</span>
                    </>
                )}
            </button>

            {linkMsg && <div className="text-xs text-amber-600">{linkMsg}</div>}

            <EmailAuth
                linkInfo={linkInfo}
                onLinked={() => { setLinkInfo(null); setLinkMsg(null) }}
                isLogin={isLogin}
                setIsLogin={setIsLogin}
            />
        </div>
    )
}

/* ----------------------- SIGNED IN ----------------------- */

function SignedIn({ authUser, profile }: { authUser: MiniUser; profile: UserProfile | null }) {
    const [loggingOut, setLoggingOut] = useState(false) // For spinning wheel and other logic

    // Country selection (only shown if missing)
    const [homeCountryCode, setHomeCountryCode] = useState('')
    const countryOptions = useMemo(() => {
        const names = isoCountries.getNames('en', { select: 'official' }) as Record<string, string>
        return Object.entries(names)
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [])



    const unlockedCount = profile?.achievements?.length ?? 0;

    const pct = Math.round((unlockedCount / TOTAL_ACHIEVEMENTS) * 100)

    const homeCountryMissing = !profile?.homeCountryCode

    const saveHomeCountry = async () => {
        if (!auth.currentUser || !homeCountryCode) return
        const name = isoCountries.getName(homeCountryCode, 'en') || homeCountryCode

        const success = await setHomeCountryOnce(auth.currentUser.uid, homeCountryCode, name)
        if (!success) {
            alert('Home country is already set and cannot be changed.')
        }
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await signOut(auth)
            // Tell RightDock to hide the nudge bubble after logout
            document.dispatchEvent(new Event('ltg:hide-login-nudge'))
            // Optionally close docks as well:
            document.dispatchEvent(new Event('ltg:close-docks'))
        } finally {
            setLoggingOut(false)
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="h2">Hello{authUser.displayName ? `, ${authUser.displayName}` : ''} 👋</h2>

            <div className="text-sm text-slate-700 space-y-1">
                <div><b>Name:</b> {profile?.displayName ?? '—'}</div>
                <div><b>Email:</b> {profile?.email ?? '—'}</div>

                <div className="flex items-center gap-2">
                    <b>Home country:</b>
                    {homeCountryMissing ? (
                        <span className="text-amber-600">not set</span>
                    ) : (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {profile?.homeCountryCode && (
                                <img
                                    src={flagUrl(profile.homeCountryCode, '24x18')}
                                    alt=""
                                    className="h-4 w-auto rounded-sm shadow-sm"
                                />
                            )}
                            <span>{profile?.homeCountryName}</span>
                        </>
                    )}
                </div>
            </div>

            {/* One-time home country selection for users missing it (typical Google sign-in) */}
            {homeCountryMissing && (
                <div className="rounded-xl border p-3 bg-amber-50">
                    <div className="text-xs text-amber-800 mb-2">
                        Please set your home country. <b>This cannot be changed later.</b>
                    </div>
                    <div className="relative">
                        {homeCountryCode && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={flagUrl(homeCountryCode, '256x192')}
                                alt=""
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto rounded-sm shadow-sm pointer-events-none"
                            />
                        )}
                        <select
                            className="w-full rounded-xl border p-2 pl-10 bg-white"
                            value={homeCountryCode}
                            onChange={(e) => setHomeCountryCode(e.target.value)}
                        >
                            <option value="" disabled>Select your home country</option>
                            {countryOptions.map(c => (
                                <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary mt-2 w-full disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!homeCountryCode}
                        onClick={saveHomeCountry}
                    >
                        Save home country
                    </button>
                </div>
            )}

            {/* Achievements progress */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Achievements</span>
                    <span className="text-slate-600">{unlockedCount}/{TOTAL_ACHIEVEMENTS} ({pct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-600"
                        style={{ width: `${pct}%` }}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        role="progressbar"
                    />
                </div>
            </div>

            <button
                className="btn btn-danger w-full disabled:opacity-40"
                onClick={handleLogout}
                disabled={loggingOut}
            >
                {loggingOut ? (
                    <span className="inline-flex items-center gap-2">
                        <span className="w-[1lh] h-[1lh] rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                    </span>
                ) : (
                    'Log out'
                )}
            </button>
        </div>
    )
}

/* ----------------------- EMAIL AUTH ----------------------- */

function EmailAuth({
    linkInfo,
    onLinked,
    isLogin,
    setIsLogin,
}: {
    linkInfo?: { email: string; cred: OAuthCredential } | null
    onLinked?: () => void
    isLogin: boolean
    setIsLogin: (v: boolean) => void
}) {
    const [email, setEmail] = useState(linkInfo?.email ?? '')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [homeCountryCode, setHomeCountryCode] = useState('')

    const [submitting, setSubmitting] = useState(false)

    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)

    const countryOptions = useMemo(() => {
        const names = isoCountries.getNames('en', { select: 'official' }) as Record<string, string>
        return Object.entries(names)
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [])

    useEffect(() => {
        if (linkInfo?.email) {
            setEmail(linkInfo.email)
            setIsLogin(true)
        }
    }, [linkInfo, setIsLogin])

    const emailOk = /\S+@\S+\.\S+/.test(email)
    const passOk = password.length >= 6
    const confirmOk = isLogin || linkInfo ? true : (confirm === password)
    const createFieldsOk = isLogin || linkInfo ? true : (firstName.trim() !== '' && lastName.trim() !== '' && homeCountryCode !== '')
    const loginValid = emailOk && passOk
    const createValid = emailOk && passOk && confirmOk && createFieldsOk
    const buttonDisabled = linkInfo ? !loginValid : (isLogin ? !loginValid : !createValid)

    const handleResetPassword = async () => {
        setError(null); setInfo(null)
        if (!emailOk) {
            setError('Enter a valid email to receive a reset link.')
            return
        }
        try {
            await sendPasswordResetEmail(auth, email)
            setInfo('Password reset email sent. Please check your inbox.')
        } catch (err: any) {
            const code = err?.code as string | undefined
            setError(
                code === 'auth/invalid-email' ? 'Invalid email address.' :
                    code === 'auth/user-not-found' ? 'No account found for this email.' :
                        'Could not send reset email. Please try again.'
            )
        }
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null); setInfo(null)
        setSubmitting(true)

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password)
            } else {
                if (!createValid) return
                const cred = await createUserWithEmailAndPassword(auth, email, password)
                const user = cred.user

                const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()
                await updateProfile(user, { displayName })

                const homeCountryName = isoCountries.getName(homeCountryCode, 'en') || homeCountryCode
                await setDoc(
                    doc(db, 'users', user.uid),
                    {
                        email: user.email,
                        displayName,
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        homeCountryCode,
                        homeCountryName,
                        achievements: [],           // ⬅️ initialize
                        provider: 'password',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                )
            }

            if (linkInfo && auth.currentUser) {
                try {
                    await linkWithCredential(auth.currentUser, linkInfo.cred)
                    onLinked?.()
                    setInfo('Google has been linked to your account.')
                } catch (err) {
                    console.error('Failed to link Google credential:', err)
                    setError('Signed in, but failed to link Google to this account.')
                }
            }
        } catch (err: any) {
            const code = err?.code as string | undefined
            setError(
                code === 'auth/email-already-in-use' ? 'Email already in use. Log in instead.' :
                    code === 'auth/invalid-credential' ? 'Invalid email or password.' :
                        code === 'auth/wrong-password' ? 'Wrong password.' :
                            code === 'auth/user-not-found' ? 'No account found for this email.' :
                                code === 'auth/weak-password' ? 'Password too weak (min 6 chars).' :
                                    'Sign-in failed. Please try again.'
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={submit} className="space-y-2 pt-2">
            <div className="grid gap-2">
                <input
                    className="w-full rounded-xl border p-2"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!linkInfo}
                />

                {!isLogin && !linkInfo && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="rounded-xl border p-2"
                                placeholder="First name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <input
                                className="rounded-xl border p-2"
                                placeholder="Last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative">
                            {homeCountryCode && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={flagUrl(homeCountryCode, '256x192')}
                                    alt=""
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto rounded-sm shadow-sm pointer-events-none"
                                />
                            )}
                            <select
                                className="w-full rounded-xl border p-2 pl-10 bg-white"
                                value={homeCountryCode}
                                onChange={(e) => setHomeCountryCode(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select your home country</option>
                                {countryOptions.map(c => (
                                    <option key={c.code} value={c.code}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <input
                    className="w-full rounded-xl border p-2"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                />

                {!isLogin && !linkInfo && (
                    <input
                        className="w-full rounded-xl border p-2"
                        placeholder="Confirm password"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        minLength={6}
                        required
                    />
                )}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {info && <div className="text-sm text-green-600">{info}</div>}

            <button
                className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:pointer-events-none"
                type="submit"
                disabled={submitting || (linkInfo ? !(email && password) : (isLogin ? !(email && password) : !(email && password && confirm === password && firstName && lastName && homeCountryCode)))}
            >
                {submitting ? (
                    <span className="inline-flex items-center gap-2">
                        <span className="w-[1lh] h-[1lh] rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                    </span>
                ) : (
                    linkInfo ? 'Log in to link Google' : isLogin ? 'Log in' : 'Create account'
                )}
            </button>

            {!linkInfo && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                        {isLogin ? 'Need an account? ' : 'Have an account? '}
                        <button
                            type="button"
                            className="underline cursor-pointer"
                            onClick={() => { setIsLogin(!isLogin); setError(null); setInfo(null) }}
                        >
                            {isLogin ? 'Create one' : 'Log in'}
                        </button>
                    </span>

                    {isLogin && (
                        <button
                            type="button"
                            className="underline cursor-pointer"
                            onClick={handleResetPassword}
                        >
                            Forgot password?
                        </button>
                    )}
                </div>
            )}
        </form>
    )
}

function ProfileLoading() {
    return (
        <div className="py-8 grid place-items-center text-slate-600">
            <span className="w-5 h-5 rounded-full border-2 border-slate-400/70 border-t-transparent animate-spin" />
            <div className="text-xs mt-2">Loading your profile…</div>
        </div>
    )
}