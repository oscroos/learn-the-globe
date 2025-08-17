import GlobeScene from '@/components/GlobeScene'
import LeftPanel from '@/components/LeftPanel'
import RightDock from '@/components/RightDock'
import RightPanel from '@/components/RightDock'


export default function Page() {
  return (
    <main className="h-dvh w-dvw">
      <GlobeScene />
      <LeftPanel />
      <RightDock />
    </main>
  )
}