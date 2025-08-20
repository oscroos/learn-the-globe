// GlobeScene.tsx
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/lib/store/gameStore'
import type { CountryFeature } from '@/lib/types'
import { featureId, centroid, flagUrl } from '@/lib/utils'
import { loadCountries, loadCapitals, getCapitalFor, type CapitalMap } from '@/lib/data'
import { playCorrect, playIncorrect, playComplete } from '@/lib/sfx'
import { IS_DEV } from '@/lib/constants'

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false }) as any

const GLOBE_IMG = '/globe/earth-night.jpg'
const BG_IMG = '/globe/night-sky.png'

// Simple window size hook
function useWindowSize() {
    const [size, setSize] = useState({ w: 0, h: 0 })
    useEffect(() => {
        const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])
    return size
}


export default function GlobeScene() {
    const globeRef = useRef<any>(null)
    const { setCountries, correct, wrong, hovered, setHovered, status, quiz, index, filtered } = useGame()

    // Guard Sets (prevents any chance of .has errors)
    const correctSet = correct instanceof Set ? correct : new Set<string>()
    const wrongSet = wrong instanceof Set ? wrong : new Set<string>()

    // Keep track of hovering to allow for performance enhancing measures
    const pendingHoverRef = useRef<string | undefined>(undefined)
    const rafRef = useRef<number | null>(null)

    // ⬅️ get live width/height and pass to Globe as props
    const { w, h } = useWindowSize()

    const [capitals, setCapitals] = useState<CapitalMap>({})

    useEffect(() => {
        loadCountries().then(fs => {
            const filteredFs = fs.filter(f => (f.properties.ISO_A2 ?? '') !== 'AQ') // Exclude Antarctica
            setCountries(filteredFs)
        })
        loadCapitals().then(setCapitals)
    }, [setCountries])

    const polygonAltitude = 0.01// (d: CountryFeature) => (hovered === featureId(d) ? 0.03 : 0.01)

    const capColor = (d: CountryFeature) => {
        const id = featureId(d)
        if (correctSet.has(id)) return 'green'
        if (wrongSet.has(id)) return 'red'
        if (hovered === id) return 'steelblue'
        return 'lightgray'
    }

    const sideColor = (d: CountryFeature) => {
        const id = featureId(d)
        if (correctSet.has(id)) return 'green'
        if (wrongSet.has(id)) return 'red'
        if (hovered === id) return 'steelblue'
        return 'rgba(0,100,0,0.15)'
    }

    // Performance enhancing measures
    const handleHover = (f: CountryFeature | null) => {
        // compute the next id
        pendingHoverRef.current = f ? featureId(f) : undefined;

        // throttle to 1 per animation frame
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const next = pendingHoverRef.current;
            const curr = useGame.getState().hovered; // read current from store
            if (next !== curr) {
                setHovered(next); // <-- pass the string (or undefined), not a function
            }
        });
    };

    // Performance enhancing measures
    useEffect(() => {
        if (!globeRef.current) return
        const controls = globeRef.current.controls()
        if (controls) {
            controls.enableDamping = true
            controls.dampingFactor = 0.08 // tweak 0.05–0.15
            controls.rotateSpeed = 0.5    // a touch lower feels smoother
            controls.zoomSpeed = 0.6
        }
    }, [])


    // Fly to current target / reset view
    useEffect(() => {
        if (!globeRef.current) return
        if (IS_DEV && status === 'running' && quiz[index]) {
            const c = centroid(quiz[index])
            globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.5 }, 1000)
        }
        if (status === 'idle') {
            globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2 }, 1000)
        }
    }, [status, quiz, index])

    const polygons = filtered.length ? filtered : [];

    const polygonLabel = (d: CountryFeature) => {
        if (status === 'running') return ''
        const name = d.properties.ADMIN
        const iso2 = d.properties.ISO_A2
        const capital = getCapitalFor(d, capitals)

        const flagSrc = iso2 && iso2 !== '-99' ? flagUrl(iso2, '24x18') : undefined
        const flagImg = flagSrc
            ? `<img src="${flagSrc}" alt="" style="width:18px;height:auto;border-radius:2px;box-shadow:0 0 2px rgba(0,0,0,.3);margin-right:6px;vertical-align:middle;" />`
            : ''

        const capPart = capital ? ` (${capital})` : ''
        return `<div style="display:flex;align-items:center;"><span>${flagImg}</span><span><b>${name}</b>${capPart}</span></div>`
    }

    return (
        <div className="fixed inset-0 z-0">
            <Globe
                ref={globeRef}
                width={w || undefined} // resize globe with size of browser window
                height={h || undefined} // resize globe with size of browser window
                rendererConfig={{ antialias: true,  logarithmicDepthBuffer: true }} // reduces z-fighting
                globeImageUrl={GLOBE_IMG}
                backgroundImageUrl={BG_IMG}
                lineHoverPrecision={0}
                polygonsData={polygons}
                polygonAltitude={polygonAltitude}
                polygonCapColor={capColor}
                polygonSideColor={sideColor}
                polygonStrokeColor={() => 'black'}
                polygonsTransitionDuration={300}
                polygonLabel={polygonLabel}
                onPolygonHover={handleHover}
                //onPolygonHover={(f: CountryFeature | null) => setHovered(f ? featureId(f) : undefined)}
                onPolygonClick={(f: CountryFeature) => {
                    const id = featureId(f)
                    const state = useGame.getState()

                    if (state.correct?.has?.(id)) return // Ignore clicks on countries already answered correctly (guarded in gameStore)

                    const target = state.quiz[state.index]
                    const isRunning = state.status === 'running'
                    const isLast = state.index === state.quiz.length - 1

                    if (isRunning && target) {
                        const tid = featureId(target)
                        // only play per-answer sounds if NOT last; end sound will play in LeftPanel
                        if (!isLast) {
                            if (id === tid) playCorrect()
                            else playIncorrect()
                        } else {
                            playComplete()
                        }
                    }

                    state.click(id)
                }} />

            {IS_DEV && (
                <div className="fixed bottom-4 left-4 z-10 pointer-events-none">
                    <span
                        className="inline-flex items-center rounded-md bg-amber-400 px-2 py-1 text-[11px] font-bold
                 text-slate-900 shadow ring-1 ring-amber-500/60"
                        aria-label="Development mode"
                        title="Development mode"
                    >
                        DEV
                    </span>
                </div>
            )}
        </div>
    )
}