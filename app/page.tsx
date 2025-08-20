import GlobeScene from '@/components/GlobeScene'
import LeftPanel from '@/components/LeftPanel'
import RightDock from '@/components/RightDock'

export const metadata = {
  title: 'Learn the Globe',
  description: 'Play country, capital, and flag quizzes on a 3D globe.',
  alternates: { canonical: '/' },
}

export default function Page() {
  return (
    <main className="h-dvh w-dvw">
      <GlobeScene />
      <LeftPanel />
      <RightDock />
    </main>
  )
}