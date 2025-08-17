'use client'

import { useRef, useState } from 'react'
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

const CLOSE_DELAY = 220; // ms; tweak between 200–300 if you like

export default function RightDock() {
  // Open states (mutually exclusive)
  const [openProfile, setOpenProfile] = useState(false)
  const [openTrophy, setOpenTrophy] = useState(false)

  // Focus-inside states (keep open while typing/autofill)
  const [profileFocusWithin, setProfileFocusWithin] = useState(false)
  const [trophyFocusWithin, setTrophyFocusWithin] = useState(false)

  // Delay timers
  const profileTimer = useRef<number | null>(null)
  const trophyTimer = useRef<number | null>(null)

  // Panel refs for focus containment checks
  const profilePanelRef = useRef<HTMLDivElement | null>(null)
  const trophyPanelRef = useRef<HTMLDivElement | null>(null)

  const clearTimer = (ref: typeof profileTimer) => {
    if (ref.current) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }

  // PROFILE handlers
  const profileEnter = () => {
    clearTimer(profileTimer)
    setOpenProfile(true)
    setOpenTrophy(false) // keep only one open at a time
  }
  const profileLeave = () => {
    clearTimer(profileTimer)
    profileTimer.current = window.setTimeout(() => {
      if (!profileFocusWithin) setOpenProfile(false)
    }, CLOSE_DELAY)
  }
  const onProfileFocus = () => {
    setProfileFocusWithin(true)
    setOpenProfile(true)
  }
  const onProfileBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null
    if (profilePanelRef.current && next && profilePanelRef.current.contains(next)) return
    setProfileFocusWithin(false)
    profileLeave()
  }

  // TROPHY handlers
  const trophyEnter = () => {
    clearTimer(trophyTimer)
    setOpenTrophy(true)
    setOpenProfile(false)
  }
  const trophyLeave = () => {
    clearTimer(trophyTimer)
    trophyTimer.current = window.setTimeout(() => {
      if (!trophyFocusWithin) setOpenTrophy(false)
    }, CLOSE_DELAY)
  }
  const onTrophyFocus = () => {
    setTrophyFocusWithin(true)
    setOpenTrophy(true)
  }
  const onTrophyBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null
    if (trophyPanelRef.current && next && trophyPanelRef.current.contains(next)) return
    setTrophyFocusWithin(false)
    trophyLeave()
  }

  const panelBase =
    'absolute top-0 right-16 w-[320px] md:w-[380px] bg-white rounded-2xl border shadow-2xl p-4 md:p-5 ' +
    'origin-top-right transition-[opacity,transform] duration-150'

  return (
    <div className="fixed top-4 right-4 z-30 flex items-start gap-4">
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
          className={`${panelBase} ${
            openTrophy ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-1 scale-95 pointer-events-none'
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
        <div
          ref={profilePanelRef}
          tabIndex={-1}
          onMouseEnter={profileEnter}
          onMouseLeave={profileLeave}
          onFocusCapture={onProfileFocus}
          onBlurCapture={onProfileBlur}
          className={`${panelBase} ${
            openProfile ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-1 scale-95 pointer-events-none'
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
