// TrophyDock.tsx
'use client'
import { useEffect, useState, useMemo } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useGame } from '@/lib/store/gameStore'
import useUserProfile from '@/lib/hooks/useUserProfile'
import { GEOGRAPHIES, MODES, regionsFor, type Mode } from '@/lib/constants'
import type { AchievementKey } from '@/lib/types'
import { gaEvent } from '@/lib/analytics'

export default function TrophyDock() {
    const [isAuthed, setIsAuthed] = useState(!!auth.currentUser)
    useEffect(() => onAuthStateChanged(auth, u => setIsAuthed(!!u)), [])

    // Live user profile (includes achievements sparse map)
    const { profile } = useUserProfile(auth.currentUser as any)
    const unlockedSet = useMemo(
        () => new Set<AchievementKey>(profile?.achievements ?? []),
        [profile?.achievements]
    )

    const g = useGame()

    function startAchievement(mode: Mode, geo: typeof GEOGRAPHIES[number]) {
        g.setMode(mode)
        g.setMaxCount('All')
        g.setRegions(regionsFor(geo))
        const all = useGame.getState().all
        useGame.getState().setCountries(all)
        g.start()
        document.dispatchEvent(new Event('ltg:close-docks'))
        
        // Log to GA4
        gaEvent('quiz_start_from_trophy_panel', { mode: mode, regions: geo })
    }

    function goToLogin() {
        document.dispatchEvent(new Event('ltg:open-profile-dock'))
    }

    return (
        <div>
            <h2 className="h2 mb-2">Achievements</h2>
            <p className="text-xs text-slate-600 mb-3">
                Achievements are unlocked by answering all countries in a geography without a single mistake or skip.
                Choose a mode and region(s), and set number of questions to &quot;all&quot; to play for an achievement.
            </p>

            {/* Content wrapper so we can overlay a login prompt */}
            <div className="relative">
                <div className={`max-h-[60vh] overflow-y-auto -mx-1 px-1 ${!isAuthed ? 'opacity-40 pointer-events-none' : ''}`}>
                    <table className="w-full text-sm table-auto border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-1 pr-8 md:pr-12 lg:pr-16">Geography</th>
                                {MODES.map(m => (
                                    <th key={m} className="py-1 w-24 text-center capitalize whitespace-nowrap">{m}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {GEOGRAPHIES.map(geo => (
                                <tr key={geo} className="bg-slate-50">
                                    <td className="py-2 px-2 pr-8 md:pr-12 lg:pr-16 font-medium">{geo}</td>

                                    {MODES.map(m => {
                                        const key = `${m}:${geo}` as AchievementKey
                                        const isOn = unlockedSet.has(key)
                                        const canPlay = !isOn && isAuthed
                                        return (
                                            <td key={key} className="py-2 w-24">
                                                <div className="relative group flex items-center justify-center">
                                                    <span className="inline-flex items-center justify-center w-5 h-5">
                                                        {isOn ? <GreenCheck /> : <GreyDot />}
                                                    </span>
                                                    {canPlay && (
                                                        <button
                                                            data-dock-close="true"
                                                            onClick={() => startAchievement(m, geo)}
                                                            aria-label={`Play ${m} – ${geo}`}
                                                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                                                        >
                                                            <span className="btn px-2 py-1 text-xs" style={{ backgroundColor: 'rgb(22 163 74)', color: '#fff' }}>Play</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!isAuthed && (
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="bg-white rounded-2xl border shadow-2xl p-4 md:p-5 text-center w-[88%] max-w-[360px]">
                            <h3 className="font-semibold mb-1">Log in to unlock achievements</h3>
                            <p className="text-xs text-slate-600 mb-3">Track progress, earn badges, and save your best runs.</p>
                            <button onClick={goToLogin} className="btn btn-primary w-full">
                                Go to login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function GreyDot() {
    return (
        <span
            className={`inline-block h-3 w-3 rounded-full bg-slate-300`}
            aria-label={'Locked'}
            title={'Locked'}
        />
    )
}

function GreenCheck() {
    return (
        <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full"
            style={{ backgroundColor: 'rgb(22 163 74)', color: '#fff' }}
            aria-hidden="true"
        >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
                <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}

function StatusMark({ on }: { on: boolean }) {
    return (
        <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${on ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                }`}
            aria-label={on ? 'Unlocked' : 'Locked'}
            title={on ? 'Unlocked' : 'Locked'}
        >
            {on ? (
                // green check
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                // subtle grey ring
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="7" strokeWidth="2" />
                </svg>
            )}
        </span>
    )
}
