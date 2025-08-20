// RightDock.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import ProfileDock from './ProfileDock'
import TrophyDock from './TrophyDock'

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
    </svg>
)
const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m6-16h2a2 2 0 0 1 2 2 6 6 0 0 1-6 6H8a6 6 0 0 1-6-6 2 2 0 0 1 2-2h2" />
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M8 5V3h8v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4Z" />
    </svg>
)

const CLOSE_DELAY = 220 // ms

export default function RightDock() {
    const containerRef = useRef<HTMLDivElement | null>(null)

    // Open states (mutually exclusive)
    const [openProfile, setOpenProfile] = useState(false)
    const [openTrophy, setOpenTrophy] = useState(false)

    // Focus-inside states (keep open while typing/autofill)
    const [profileFocusWithin, setProfileFocusWithin] = useState(false)
    const [trophyFocusWithin, setTrophyFocusWithin] = useState(false)

    // Delay timers
    const profileTimer = useRef<number | null>(null)
    const trophyTimer = useRef<number | null>(null)

    // Panel refs
    const profilePanelRef = useRef<HTMLDivElement | null>(null)
    const trophyPanelRef = useRef<HTMLDivElement | null>(null)

    // Auth + login nudge bubble
    const [isAuthed, setIsAuthed] = useState(!!auth.currentUser)
    const [showNudge, setShowNudge] = useState(!auth.currentUser) // reappears on refresh if signed out

    useEffect(() => {
        return onAuthStateChanged(auth, u => {
            setIsAuthed(!!u)
            setShowNudge(!u) // show hint whenever signed out; hide when signed in
        })
    }, [])

    const dismissNudge = () => setShowNudge(false) // no persistence → returns on refresh if still signed out

    const clearTimer = (ref: typeof profileTimer) => {
        if (ref.current) { window.clearTimeout(ref.current); ref.current = null }
    }

    /** Immediately hide both panels and clear timers/flags */
    const forceClose = () => {
        clearTimer(profileTimer)
        clearTimer(trophyTimer)
        setProfileFocusWithin(false)
        setTrophyFocusWithin(false)
        setOpenProfile(false)
        setOpenTrophy(false)
    }

    // Outside click, Esc, and custom events
    useEffect(() => {
        const handleDocMouseDown = (e: MouseEvent) => {
            const root = containerRef.current
            if (!root) return
            if (!root.contains(e.target as Node)) forceClose()
        }
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') forceClose() }

        // Open Profile dock via custom event (from TrophyDock or elsewhere)
        const handleOpenProfile = () => {
            clearTimer(profileTimer); clearTimer(trophyTimer)
            setOpenTrophy(false)
            setOpenProfile(true)
            setTrophyFocusWithin(false)
            setProfileFocusWithin(false)
            requestAnimationFrame(() => profilePanelRef.current?.focus())
        }

        const handleHideNudge = () => {
            setShowNudge(false)
        }

        const handleClose = () => forceClose()

        document.addEventListener('mousedown', handleDocMouseDown)
        document.addEventListener('keydown', handleKey)
        document.addEventListener('ltg:open-profile-dock' as any, handleOpenProfile as EventListener)
        document.addEventListener('ltg:close-docks' as any, handleClose as EventListener)
        document.addEventListener('ltg:hide-login-nudge' as any, handleHideNudge as EventListener)

        return () => {
            document.removeEventListener('mousedown', handleDocMouseDown)
            document.removeEventListener('keydown', handleKey)
            document.removeEventListener('ltg:open-profile-dock' as any, handleOpenProfile as EventListener)
            document.removeEventListener('ltg:close-docks' as any, handleClose as EventListener)
            document.removeEventListener('ltg:hide-login-nudge' as any, handleHideNudge as EventListener)
        }
    }, [])

    // PROFILE hover/focus intent
    const profileEnter = () => { clearTimer(profileTimer); setOpenProfile(true); setOpenTrophy(false) }
    const profileLeave = () => {
        clearTimer(profileTimer)
        profileTimer.current = window.setTimeout(() => { if (!profileFocusWithin) setOpenProfile(false) }, CLOSE_DELAY)
    }
    const onProfileFocus = () => { setProfileFocusWithin(true); setOpenProfile(true) }
    const onProfileBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const next = e.relatedTarget as Node | null
        if (profilePanelRef.current && next && profilePanelRef.current.contains(next)) return
        setProfileFocusWithin(false); profileLeave()
    }

    // TROPHY hover/focus intent
    const trophyEnter = () => { clearTimer(trophyTimer); setOpenTrophy(true); setOpenProfile(false) }
    const trophyLeave = () => {
        clearTimer(trophyTimer)
        trophyTimer.current = window.setTimeout(() => { if (!trophyFocusWithin) setOpenTrophy(false) }, CLOSE_DELAY)
    }
    const onTrophyFocus = () => { setTrophyFocusWithin(true); setOpenTrophy(true) }
    const onTrophyBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const next = e.relatedTarget as Node | null
        if (trophyPanelRef.current && next && trophyPanelRef.current.contains(next)) return
        setTrophyFocusWithin(false); trophyLeave()
    }

    const panelBase =
        'absolute top-0 right-16 w-[320px] md:w-[380px] bg-white rounded-2xl border shadow-2xl p-4 md:p-5 ' +
        'origin-top-right transition-[opacity,transform] duration-150'

    return (
        <div ref={containerRef} className="fixed top-4 right-4 z-30 flex items-start gap-4">
            {/* Trophy */}
            <div className="relative">
                <button
                    aria-label="Achievements"
                    onMouseEnter={trophyEnter}
                    onMouseLeave={trophyLeave}
                    className="btn btn-secondary w-14 h-14 rounded-full p-0 shadow-xl"
                >
                    <TrophyIcon className="w-7 h-7" />
                </button>
                <div
                    ref={trophyPanelRef}
                    tabIndex={-1}
                    onMouseEnter={trophyEnter}
                    onMouseLeave={trophyLeave}
                    onFocusCapture={onTrophyFocus}
                    onBlurCapture={onTrophyBlur}
                    onClickCapture={(e) => {
                        const target = (e.target as HTMLElement)
                        if (target.closest('[data-dock-close="true"]')) {
                            setTimeout(() => forceClose(), 0)
                        }
                    }}
                    className={`${panelBase} ${openTrophy ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                        : 'opacity-0 translate-x-1 scale-95 pointer-events-none'
                        }`}
                    role="dialog"
                    aria-label="Achievements"
                >
                    <TrophyDock />
                </div>
            </div>

            {/* Profile */}
            <div className="relative">
                <button
                    aria-label="Profile"
                    onMouseEnter={profileEnter}
                    onMouseLeave={profileLeave}
                    className="btn btn-secondary w-14 h-14 rounded-full p-0 shadow-xl"
                >
                    <UserIcon className="w-7 h-7" />
                </button>

                {/* Login nudge bubble — under icons, anchored right so it extends left */}
                {!isAuthed && showNudge && (
                    <div className="absolute right-0 top-full mt-2 z-40">
                        <div className="relative bg-white rounded-xl border shadow-2xl p-4 w-56 max-w-[90vw]">
                            {/* arrow near the right edge, pointing up to the Profile icon */}
                            <div className="absolute -top-1 right-4 w-3 h-3 bg-white border-l border-t rotate-45"></div>

                            {/* CLOSE: upper-left corner, on the border, with cursor + hover color */}
                            <button
                                aria-label="Dismiss login hint"
                                onClick={dismissNudge}
                                className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-white border shadow hover:bg-slate-100 text-slate-600 flex items-center justify-center transition"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>

                            {/* larger text for readability */}
                            <p className="text-base text-slate-800 pr-1">
                                Log in to track progress
                            </p>

                            <div className="mt-3">
                                <button
                                    className="btn btn-primary px-3 py-1.5 text-sm w-full"
                                    onClick={() => {
                                        setOpenProfile(true)
                                        setOpenTrophy(false)
                                        requestAnimationFrame(() => profilePanelRef.current?.focus())
                                        setShowNudge(false)
                                    }}
                                >
                                    Go to login
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    ref={profilePanelRef}
                    tabIndex={-1}
                    onMouseEnter={profileEnter}
                    onMouseLeave={profileLeave}
                    onFocusCapture={onProfileFocus}
                    onBlurCapture={onProfileBlur}
                    className={`${panelBase} ${openProfile ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                        : 'opacity-0 translate-x-1 scale-95 pointer-events-none'
                        }`}
                    role="dialog"
                    aria-label="Profile"
                >
                    <ProfileDock />
                </div>
            </div>
        </div>
    )
}
