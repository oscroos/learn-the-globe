'use client'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '@/lib/store/gameStore'
import { loadCapitals } from '@/lib/data'
import { flagUrl } from '@/lib/utils'
import ProgressBar from './ProgressBar'
import { playSkip, playComplete } from '@/lib/sfx'
import { MODES, CONTINENTS, GEOGRAPHIES } from '@/lib/constants'
import { type AchievementKey } from '@/lib/types'

// Firestore (sparse achievements merge)
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

// Icons
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>)
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" /></svg>)
}
function SkipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h8M13 5l7 7-7 7" /></svg>)
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><circle cx="12" cy="12" r="9" strokeWidth="2" /><path strokeWidth="2" strokeLinecap="round" d="M12 7v5l3 2" /></svg>)
}
// Trophy & lock for achievement row
function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m6-16h2a2 2 0 0 1 2 2 6 6 0 0 1-6 6H8a6 6 0 0 1-6-6 2 2 0 0 1 2-2h2" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 5V3h8v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4Z" /></svg>)
}
function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><rect x="4" y="10" width="16" height="10" rx="2" strokeWidth="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" strokeWidth="2" strokeLinecap="round" /></svg>)
}


// Infer which geography the selection represents
function inferGeography(regions: string[]): typeof GEOGRAPHIES[number] | null {
  const set = new Set(regions)
  const every = (xs: readonly string[]) => xs.every(x => set.has(x))

  if (regions.length === CONTINENTS.length && every(CONTINENTS)) return 'World'
  if (regions.length === 2 && every(['North America', 'South America'])) return 'Americas'
  if (regions.length === 2 && every(['Europe', 'Asia'])) return 'Eurasia'
  if (regions.length === 1 && (CONTINENTS as readonly string[]).includes(regions[0])) return regions[0] as any
  return null
}

export default function LeftPanel() {
  const game = useGame()
  const [capitals, setCapitals] = useState<{ [k: string]: { capital: string } }>({})
  const [finalMs, setFinalMs] = useState<number | null>(null)

  // Finish bookkeeping
  const savedFinishRef = useRef(false)
  const [achKey, setAchKey] = useState<AchievementKey | null>(null)
  const [achUnlocked, setAchUnlocked] = useState(false)

  useEffect(() => { loadCapitals().then(setCapitals) }, [])

  // Freeze time at finish + compute/store achievement + play complete sound
  useEffect(() => {
    if (game.status === 'finished') {
      if (finalMs === null) {
        setFinalMs(Date.now() - (game.startedAt ?? Date.now()))
      }
      if (!savedFinishRef.current) {
        savedFinishRef.current = true

        // 1) Finish sound
        playComplete()

        // 2) Achievement check
        const geo = inferGeography(game.regions)
        const perfect =
          game.maxCount === 'All' &&
          game.errors === 0 &&
          game.skipped === 0 &&
          game.correct.size === game.quiz.length &&
          !!geo

        const key: AchievementKey | null = perfect ? `${game.mode}:${geo!}` as AchievementKey : null
        setAchKey(key)
        setAchUnlocked(!!key)

        // 3) Persist (sparse) to Firestore if logged in
        if (key && auth.currentUser) {
          const ref = doc(db, 'users', auth.currentUser.uid)
          updateDoc(ref, {
            achievements: arrayUnion(`${key}`), // key is already a string like "country:Europe"
            updatedAt: serverTimestamp()
          }).catch(console.error)
        }
      }
    } else {
      // reset flags when leaving finished
      savedFinishRef.current = false
      setAchKey(null)
      setAchUnlocked(false)
      if (game.status === 'idle') setFinalMs(null)
    }
  }, [
    game.status, game.maxCount, game.errors, game.skipped,
    game.correct.size, game.quiz.length, game.mode, game.regions,
    game.startedAt, finalMs
  ])

  const target = game.quiz[game.index]
  const pct = game.quiz.length ? (game.index / game.quiz.length) * 100 : 0

  const questionText = useMemo(() => {
    if (!target) return ''
    const key = (target.properties as any).ADM0_A3 ?? target.properties.ADMIN
    if (game.mode === 'country') return target.properties.ADMIN
    if (game.mode === 'capital') return capitals[key]?.capital ?? '—'
    return ''
  }, [game.mode, target, capitals])

  const flag = target ? flagUrl(target.properties.ISO_A2) : undefined

  const canStart = game.filtered.length > 0
  const allSelected = CONTINENTS.every(c => game.regions.includes(c))

  const correctCount = game.correct.size
  const incorrectCount = game.errors
  const skippedCount = game.skipped
  const timeUsedLabel = formatDuration(finalMs ?? Math.max(0, Date.now() - (game.startedAt ?? Date.now())))

  return (
    <div className="fixed top-4 left-4 w-[280px] md:w-[320px] panel z-20">
      {game.status === 'idle' && (
        <div className="space-y-4">
          <section>
            <div className="label mb-2">Mode</div>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => game.setMode(mode)}
                  className={`btn ${game.mode === mode ? 'btn-secondary' : 'btn-ghost'}`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="label mb-2">Regions</div>
            <div className="grid grid-cols-2 gap-2">
              {CONTINENTS.map(continent => (
                <button
                  key={continent}
                  onClick={() => game.toggleRegion(continent)}
                  className={`btn ${game.regions.includes(continent) ? 'btn-secondary' : 'btn-ghost'}`}
                >
                  {continent}
                </button>
              ))}
              <button
                className={`btn col-span-2 ${allSelected ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => allSelected ? game.setRegions([]) : game.setRegions(CONTINENTS)}
              >
                World (all continents)
              </button>
            </div>
          </section>

          <section>
            <div className="label mb-2">Number of questions</div>
            <div className="grid grid-cols-5 gap-2">
              {[10, 20, 30, 40].map(n => (
                <button
                  key={n}
                  className={`btn ${game.maxCount === n ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => game.setMaxCount(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className={`btn ${game.maxCount === 'All' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => game.setMaxCount('All')}
              >
                All
              </button>
            </div>
          </section>

          <button
            className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:pointer-events-none"
            onClick={game.start}
            disabled={!canStart}
          >
            Start quiz
          </button>
        </div>
      )}

      {game.status !== 'idle' && (
        <div className="space-y-4">
          {/* Show pill/flag + progress ONLY while running */}
          {game.status === 'running' && (
            <>
              {game.mode !== 'flag' ? (
                <div className="rounded-xl bg-white text-slate-900 text-center text-xl font-semibold px-3 py-2 shadow">
                  {questionText}
                </div>
              ) : flag ? (
                <div className="flex items-center justify-center">
                  <Image src={flag} alt="flag" width={180} height={120} className="rounded-lg border" />
                </div>
              ) : null}

              <ProgressBar pct={pct} />
            </>
          )}

          {/* In-round live stats */}
          {game.status === 'running' && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center justify-center gap-1 rounded-lg bg-green-50 text-green-700 py-1">
                <CheckIcon className="w-4 h-4" />
                <span className="font-medium">{correctCount}</span>
              </div>
              <div className="flex items-center justify-center gap-1 rounded-lg bg-red-50 text-red-700 py-1">
                <XIcon className="w-4 h-4" />
                <span className="font-medium">{incorrectCount}</span>
              </div>
              <div className="flex items-center justify-center gap-1 rounded-lg bg-amber-50 text-amber-700 py-1">
                <SkipIcon className="w-4 h-4" />
                <span className="font-medium">{skippedCount}</span>
              </div>
            </div>
          )}

          {/* End-of-game stats (rows) */}
          {game.status === 'finished' && (
            <>
              <div className="mt-2 space-y-2 text-sm">
                <StatRow
                  colorClasses="text-green-700 bg-green-50"
                  icon={<CheckIcon className="w-4 h-4" />}
                  label="Correct"
                  value={`${correctCount} / ${game.quiz.length}`}
                />
                <StatRow
                  colorClasses="text-red-700 bg-red-50"
                  icon={<XIcon className="w-4 h-4" />}
                  label="Incorrect"
                  value={String(incorrectCount)}
                />
                <StatRow
                  colorClasses="text-amber-700 bg-amber-50"
                  icon={<SkipIcon className="w-4 h-4" />}
                  label="Skipped"
                  value={String(skippedCount)}
                />
                <StatRow
                  colorClasses="text-slate-700 bg-slate-100"
                  icon={<ClockIcon className="w-4 h-4" />}
                  label="Time used"
                  value={timeUsedLabel}
                />

                {/* NEW: Achievement result */}
                {achUnlocked ? (
                  <StatRow
                    colorClasses="text-green-800 bg-green-100"
                    icon={<TrophyIcon className="w-4 h-4" />}
                    value=""
                    label={auth.currentUser ? `Unlocked: ${achKey!.split(':')[1]} • ${achKey!.split(':')[0]}` : "Log in to unlock achievements"}
                  />
                ) : (
                  <StatRow
                    colorClasses="text-slate-700 bg-slate-100"
                    icon={<LockIcon className="w-4 h-4" />}
                    label={auth.currentUser ? "No achievement unlocked" : "Log in to unlock achievements"}
                    value=""
                  />
                )}
              </div>

              {/* Return to menu BELOW stats */}
              <div className="pt-2">
                <button className="btn btn-primary w-full" onClick={game.reset}>
                  Return to menu
                </button>
              </div>
            </>
          )}

          {/* Controls while running */}
          {game.status === 'running' && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="btn btn-warning" onClick={() => { playSkip(); game.skip(); }}>Skip</button>
              <button className="btn btn-danger" onClick={game.reset}>End game</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
  colorClasses,
}: {
  icon: React.ReactNode
  label: string
  value: string
  colorClasses: string
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${colorClasses}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
