// gameStore.ts
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CountryFeature, Mode } from '../types'
import { featureId, shuffle } from '../utils'


interface GameState {
    mode: Mode
    regions: string[]
    maxCount: number | 'All'

    all: CountryFeature[]
    filtered: CountryFeature[]
    quiz: CountryFeature[]

    status: 'idle' | 'running' | 'finished'
    index: number
    correct: Set<string>
    wrong: Set<string>
    hovered?: string
    errors: number
    skipped: number
    startedAt?: number

    setMode: (m: Mode) => void
    toggleRegion: (r: string) => void
    setRegions: (rs: string[]) => void
    setMaxCount: (n: number | 'All') => void
    setCountries: (features: CountryFeature[]) => void
    setHovered: (id?: string) => void

    start: () => void
    click: (id: string) => void
    skip: () => void
    reset: () => void
}

export const useGame = create<GameState>()(
    persist(
        (set, get) => ({
            mode: 'country',
            regions: [],
            maxCount: 10,
            all: [],
            filtered: [],
            quiz: [],
            status: 'idle',
            index: 0,
            correct: new Set(),
            wrong: new Set(),
            errors: 0,
            skipped: 0,


            setMode: (m) => set({ mode: m }),
            toggleRegion: (r) => set(s => {
                const regions = s.regions.includes(r)
                    ? s.regions.filter(x => x !== r)
                    : [...s.regions, r]
                const filtered = regions.length
                    ? s.all.filter(f => regions.includes(f.properties.CONTINENT ?? ''))
                    : []
                return { regions, filtered }
            }),
            setRegions: (rs) => set(s => {
                const filtered = rs.length
                    ? s.all.filter(f => rs.includes(f.properties.CONTINENT ?? ''))
                    : []
                return { regions: rs, filtered }
            }),
            setMaxCount: (n) => set({ maxCount: n }),


            setCountries: (features) => set(s => {
                const filtered = s.regions.length
                    ? features.filter(f => s.regions.includes(f.properties.CONTINENT ?? ''))
                    : [] // Empty to start with
                return { all: features, filtered }
            }),


            setHovered: (id) => set({ hovered: id }),


            start: () => set(s => {
                const pool = s.filtered
                if (!pool.length) return {}
                const shuffled = shuffle(pool);          // 🔁 always randomize order
                const take = s.maxCount === 'All'
                    ? shuffled.length
                    : Math.min(shuffled.length, Number(s.maxCount));

                return {
                    quiz: shuffled.slice(0, take),
                    status: 'running',
                    index: 0,
                    correct: new Set(),
                    wrong: new Set(),
                    errors: 0,
                    skipped: 0,
                    startedAt: Date.now(),
                }
            }),


            click: (id) => set(s => {
                if (s.status !== 'running') return {}
                const target = s.quiz[s.index]
                const tid = featureId(target)
                if (id === tid) {
                    const nextIndex = s.index + 1
                    const finished = nextIndex >= s.quiz.length
                    return {
                        correct: new Set([...s.correct, id]),
                        wrong: new Set(),
                        index: nextIndex,
                        status: finished ? 'finished' : 'running',
                    }
                } else {
                    return {
                        wrong: new Set([...s.wrong, id]),
                        errors: s.errors + 1,
                    }
                }
            }),


            skip: () => set(s => {
                if (s.status !== 'running') return {}
                const nextIndex = s.index + 1
                const finished = nextIndex >= s.quiz.length
                return {
                    index: nextIndex,
                    skipped: s.skipped + 1,
                    wrong: new Set(),
                    status: finished ? 'finished' : 'running',
                }
            }),


            reset: () => set({
                status: 'idle', index: 0, correct: new Set(), wrong: new Set(), errors: 0, skipped: 0, startedAt: undefined
            }),
        }),
        {
            name: 'ltg-store',
            storage: createJSONStorage(() => localStorage),

            // Persist only primitives we want to remember between sessions
            partialize: (s) => ({
                mode: s.mode,
                regions: s.regions,
                maxCount: s.maxCount,
            }),

            // Safety: if something slipped through, re-init Sets
            onRehydrateStorage: () => (state) => ({
                correct: state?.correct instanceof Set ? state.correct : new Set<string>(),
                wrong: state?.wrong instanceof Set ? state.wrong : new Set<string>(),
            }),
        }
    )
)