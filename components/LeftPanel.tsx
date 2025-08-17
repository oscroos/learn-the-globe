// LeftPanel.tsx
'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '@/lib/store/gameStore'
import type { Mode } from '@/lib/types'
import { loadCapitals } from '@/lib/data'
import { flagUrl } from '@/lib/utils'
import ProgressBar from './ProgressBar'

const CONTINENTS = ['Africa','Asia','Europe','North America','Oceania','South America']

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7"/></svg>)
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12"/></svg>)
}
function SkipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h8M13 5l7 7-7 7"/></svg>)
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><circle cx="12" cy="12" r="9" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" d="M12 7v5l3 2"/></svg>)
}

export default function LeftPanel() {
  const g = useGame()
  const [capitals, setCapitals] = useState<{[k:string]: { capital: string }}>({})
  const [finalMs, setFinalMs] = useState<number | null>(null)

  useEffect(() => { loadCapitals().then(setCapitals) }, [])

  // freeze time at finish
  useEffect(() => {
    if (g.status === 'finished' && finalMs === null) {
      setFinalMs(Date.now() - (g.startedAt ?? Date.now()))
    }
    if (g.status === 'idle') setFinalMs(null)
  }, [g.status, g.startedAt, finalMs])

  const target = g.quiz[g.index]
  const pct = g.quiz.length ? (g.index / g.quiz.length) * 100 : 0

  const questionText = useMemo(() => {
    if (!target) return ''
    const key = (target.properties as any).ADM0_A3 ?? target.properties.ADMIN
    if (g.mode === 'country') return target.properties.ADMIN
    if (g.mode === 'capital') return capitals[key]?.capital ?? '—'
    return ''
  }, [g.mode, target, capitals])

  const flag = target ? flagUrl(target.properties.ISO_A2) : undefined

  const canStart = g.filtered.length > 0
  const allSelected = CONTINENTS.every(c => g.regions.includes(c))

  const correctCount = g.correct.size
  const incorrectCount = g.errors
  const skippedCount = g.skipped
  const timeUsedLabel = formatDuration(finalMs ?? Math.max(0, Date.now() - (g.startedAt ?? Date.now())))

  return (
    <div className="fixed top-4 left-4 w-[280px] md:w-[320px] panel z-20">
      {g.status === 'idle' && (
        <div className="space-y-4">
          <section>
            <div className="label mb-2">Mode</div>
            <div className="grid grid-cols-3 gap-2">
              {(['country','capital','flag'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => g.setMode(m)}
                  className={`btn ${g.mode===m?'btn-secondary':'btn-ghost'}`}
                >
                  {m[0].toUpperCase()+m.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="label mb-2">Regions</div>
            <div className="grid grid-cols-2 gap-2">
              {CONTINENTS.map(c => (
                <button
                  key={c}
                  onClick={() => g.toggleRegion(c)}
                  className={`btn ${g.regions.includes(c)?'btn-secondary':'btn-ghost'}`}
                >
                  {c}
                </button>
              ))}
              <button
                className={`btn col-span-2 ${allSelected ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => allSelected ? g.setRegions([]) : g.setRegions(CONTINENTS)}
              >
                World (all continents)
              </button>
            </div>
          </section>

          <section>
            <div className="label mb-2">Maximum countries</div>
            <div className="grid grid-cols-5 gap-2">
              {[10,20,30,40].map(n => (
                <button
                  key={n}
                  className={`btn ${g.maxCount===n?'btn-secondary':'btn-ghost'}`}
                  onClick={() => g.setMaxCount(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className={`btn ${g.maxCount==='All'?'btn-secondary':'btn-ghost'}`}
                onClick={() => g.setMaxCount('All')}
              >
                All
              </button>
            </div>
          </section>

          <button
            className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:pointer-events-none"
            onClick={g.start}
            disabled={!canStart}
          >
            Start quiz
          </button>
        </div>
      )}

      {g.status !== 'idle' && (
        <div className="space-y-4">
          <h2 className="h2">{g.status === 'finished' ? 'Results' : 'Question'}</h2>

          {/* Show pill/flag + progress ONLY while running */}
          {g.status === 'running' && (
            <>
              {g.mode !== 'flag' ? (
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

          {/* In-round live stats (only while running) */}
          {g.status === 'running' && (
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
          {g.status === 'finished' && (
            <>
              <div className="mt-2 space-y-2 text-sm">
                <StatRow
                  colorClasses="text-green-700 bg-green-50"
                  icon={<CheckIcon className="w-4 h-4" />}
                  label="Correct"
                  value={`${correctCount} / ${g.quiz.length}`}
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
              </div>

              {/* Return to menu BELOW stats */}
              <div className="pt-2">
                <button className="btn btn-primary w-full" onClick={g.reset}>
                  Return to menu
                </button>
              </div>
            </>
          )}

          {/* Controls while running */}
          {g.status === 'running' && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="btn btn-warning" onClick={g.skip}>Skip</button>
              <button className="btn btn-ghost" onClick={g.reset}>New game</button>
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
