'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '@/lib/store/gameStore'
import type { Mode } from '@/lib/types'
import { loadCapitals } from '@/lib/data'
import { flagUrl } from '@/lib/utils'
import ProgressBar from './ProgressBar'

const CONTINENTS = ['Africa','Asia','Europe','North America','Oceania','South America']

export default function LeftPanel() {
  const g = useGame()
  const [capitals, setCapitals] = useState<{[k:string]: { capital: string }}>({})

  useEffect(() => { loadCapitals().then(setCapitals) }, [])

  const target = g.quiz[g.index]
  const pct = g.quiz.length ? (g.index / g.quiz.length) * 100 : 0

  const questionText = useMemo(() => {
    if (!target) return ''
    const key = target.properties.ADM0_A3 // Country ID
    if (g.mode === 'country') return `Click on: ${target.properties.ADMIN}`
    if (g.mode === 'capital') return `Click on the country of: ${capitals[key]?.capital ?? '—'}`
    return 'Which country has this flag?'
  }, [g.mode, target, capitals])

  const flag = target ? flagUrl(target.properties.ISO_A2) : undefined

  // ---- NEW: start button + world logic ----
  const canStart = g.filtered.length > 0
  const allSelected = CONTINENTS.every(c => g.regions.includes(c))

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
              {/* World toggle reflects + toggles all-selected state */}
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

          {/* Start: ghosted green when disabled, no hover change, unclickable */}
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
          <h2 className="h2">Question</h2>
          <ProgressBar pct={pct} />
          {g.mode !== 'flag' && (
            <p className="text-center text-lg">{questionText}</p>
          )}
          {g.mode === 'flag' && flag && (
            <div className="flex items-center justify-center">
              <Image src={flag} alt="flag" width={240} height={160} className="rounded-lg border" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button className="btn btn-warning" onClick={g.skip}>Skip</button>
            <button className="btn btn-ghost" onClick={g.reset}>New game</button>
          </div>

          {g.status === 'finished' && (
            <div className="mt-2 space-y-1 text-sm">
              <div>Correct: {g.correct.size} / {g.quiz.length}</div>
              <div>Errors: {g.errors}</div>
              <div>Skipped: {g.skipped}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
