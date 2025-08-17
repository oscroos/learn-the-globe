'use client'

const GEOGRAPHIES = [
  'Africa','Asia','Europe','North America','Oceania','South America','World','Americas','Eurasia'
] as const

const MODES = ['country','capital','flag'] as const
type Mode = typeof MODES[number]

export default function TrophyDock() {
  // TODO: replace with real unlocked map from Firestore sessions
  const unlocked: Record<string, boolean> = {} // key: `${mode}:${geo}` → boolean

  return (
    <div>
      <h2 className="h2 mb-2">Achievements</h2>
      <p className="text-xs text-slate-600 mb-3">
        Achievements are unlocked by answering all countries in a geography without a single mistake or skip. 
        Choose a mode and region(s), and set maximum countries to "all" to play for an achievement.
      </p>

      <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 pr-2">Geography</th>
              {MODES.map(m => (
                <th key={m} className="py-1 text-center capitalize">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GEOGRAPHIES.map(geo => (
              <tr key={geo} className="bg-slate-50">
                <td className="py-2 px-2 font-medium">{geo}</td>
                {MODES.map(m => {
                  const key = `${m}:${geo}`
                  const isOn = !!unlocked[key]
                  return (
                    <td key={key} className="py-2">
                      <div className="flex justify-center">
                        <StatusDot on={isOn} />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${on ? 'bg-green-600' : 'bg-slate-300'}`}
      aria-label={on ? 'Unlocked' : 'Locked'}
      title={on ? 'Unlocked' : 'Locked'}
    />
  )
}
