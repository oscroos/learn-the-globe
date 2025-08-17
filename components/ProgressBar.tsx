'use client'


export default function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
    )
}