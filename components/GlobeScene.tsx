// GlobeScene.tsx
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '@/lib/store/gameStore'
import type { CountryFeature } from '@/lib/types'
import { featureId, centroid } from '@/lib/utils'
import { loadCountries } from '@/lib/data'


const Globe = dynamic(() => import('react-globe.gl'), { ssr: false }) as any


export default function GlobeScene() {
    const globeRef = useRef<any>(null)
    const [features, setFeatures] = useState<CountryFeature[]>([])
    const { setCountries, correct, wrong, hovered, setHovered, status, quiz, index, all, filtered } = useGame()

    // Guard Sets (prevents any chance of .has errors)
    const correctSet = correct instanceof Set ? correct : new Set<string>()
    const wrongSet = wrong instanceof Set ? wrong : new Set<string>()


    useEffect(() => {
        loadCountries().then(fs => {
            const filteredFs = fs.filter(f => (f.properties.ISO_A2 ?? '') !== 'AQ') // Exclude Antarctica
            setCountries(filteredFs)
        })
    }, [setCountries])

    // Your resize logic, adapted
    useEffect(() => {
        const handleResize = () => {
            if (!globeRef.current) return
            const width = window.innerWidth
            const height = window.innerHeight
            const renderer = globeRef.current.renderer?.()
            const camera = globeRef.current.camera?.()
            if (renderer && camera) {
                renderer.setSize(width, height)
                camera.aspect = width / height
                camera.updateProjectionMatrix()
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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


    useEffect(() => {
        if (!globeRef.current) return
        if (status === 'running' && quiz[index]) {
            const c = centroid(quiz[index])
            globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.5 }, 1000)
        }
        if (status === 'idle') {
            globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2 }, 1000)
        }
    }, [status, quiz, index])

    const polygons = filtered.length ? filtered : [];

    return (
        <div className="fixed inset-0 z-0">
            <Globe
                ref={globeRef}
                globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
                lineHoverPrecision={0}
                polygonsData={polygons}
                polygonAltitude={(d: CountryFeature) => (featureId(d) === hovered ? 0.04 : 0.01)}
                polygonCapColor={capColor}
                polygonSideColor={sideColor}
                polygonStrokeColor={() => 'black'}
                polygonsTransitionDuration={300}
                polygonLabel={(d: CountryFeature) => (status === 'running' ? '' : `<b>${d.properties.ADMIN}</b>`)}
                onPolygonHover={(f: CountryFeature | null) => setHovered(f ? featureId(f) : undefined)}
                onPolygonClick={(f: CountryFeature) => {
                    console.log('clicked:', f.properties.ADMIN); // ← shows in browser console
                    const id = featureId(f);
                    useGame.getState().click(id);
                }} />
        </div>
    )
}