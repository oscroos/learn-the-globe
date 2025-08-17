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
import { useGame } from '@/lib/store/gameStore'
import usePersistSession from '@/lib/hooks/usePersistSession'

type MiniUser = { uid: string; displayName: string | null; photoURL: string | null; email: string | null }

isoCountries.registerLocale(enLocale as any)

export default function ProfileDock() {
    const [user, setUser] = useState<MiniUser | null>(null)
    const g = useGame()

    useEffect(
        () =>
            onAuthStateChanged(auth, (u) =>
                setUser(u ? { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, email: u.email } : null)
            ),
        []
    )

    usePersistSession(user)

    return !user ? <SignedOut /> : <SignedIn user={user} g={g} />
}

function SignedOut() {
    const [linkInfo, setLinkInfo] = useState<{ email: string; cred: OAuthCredential } | null>(null)
    const [linkMsg, setLinkMsg] = useState<string | null>(null)

    const signInGoogle = async () => {
        try {
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
                        return
                    }
                }
            }
            console.error('Google sign-in error', e)
        }
    }

    return (
        <div className="space-y-3">
            <h2 className="h2 text-center">Profile</h2>
            <p className="text-sm text-slate-600">Sign in to save your results.</p>

            <button
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                onClick={signInGoogle}
                aria-label="Sign in with Google"
            >
                <Image src="/google_logo.png" alt="" width={20} height={20} />
                <span>Sign in with Google</span>
            </button>

            {linkMsg && <div className="text-xs text-amber-600">{linkMsg}</div>}

            <EmailAuth linkInfo={linkInfo} onLinked={() => { setLinkInfo(null); setLinkMsg(null) }} />
        </div>
    )
}

function SignedIn({ user, g }: { user: MiniUser; g: ReturnType<typeof useGame> }) {
    return (
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
    )
}

/** Email/password auth with:
 *  - Create account: first/last name, home country (from full list), confirm password
 *  - Login
 *  - Forgot password
 *  - Google-link completion when linkInfo is present
 *  - Disabled submit buttons until inputs valid
 */
function EmailAuth({
    linkInfo,
    onLinked
}: {
    linkInfo?: { email: string; cred: OAuthCredential } | null
    onLinked?: () => void
}) {
    const [email, setEmail] = useState(linkInfo?.email ?? '')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [homeCountryCode, setHomeCountryCode] = useState('')

    const [isLogin, setIsLogin] = useState(linkInfo ? true : true) // force login when linking
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)

    // Build sorted country list once
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
    }, [linkInfo])

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
                        provider: 'password',
                        createdAt: serverTimestamp(),
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
                code === 'auth/email-already-in-use' ? 'Email already in use.' :
                    code === 'auth/invalid-credential' ? 'Invalid email or password.' :
                        code === 'auth/wrong-password' ? 'Wrong password.' :
                            code === 'auth/user-not-found' ? 'No account found for this email.' :
                                code === 'auth/weak-password' ? 'Password too weak (min 6 chars).' :
                                    'Sign-in failed. Please try again.'
            )
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

                {/* Extra fields only when creating and not linking */}
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
                            {/* tiny flag left of the select text */}
                            {homeCountryCode && (
                                // decorative; using <img> avoids Next/Image domain config
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
                disabled={buttonDisabled}
            >
                {linkInfo ? 'Log in to link Google' : isLogin ? 'Log in' : 'Create account'}
            </button>

            {/* Bottom row:
          - Left: toggle login/create (only the phrase after ? is underlined & clickable)
          - Right: Forgot password (underlined & pointer)
       */}
            {!linkInfo && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                        {isLogin ? 'Need an account? ' : 'Have an account? '}
                        <button
                            type="button"
                            className="underline cursor-pointer"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError(null); setInfo(null)
                            }}
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
