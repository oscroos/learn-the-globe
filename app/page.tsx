import GlobeScene from '@/components/GlobeScene'
import LeftPanel from '@/components/LeftPanel'
import RightPanel from '@/components/RightPanel'


export default function Page() {
  return (
    <main className="h-dvh w-dvw">
      <GlobeScene />
      <LeftPanel />
      <RightPanel />
    </main>
  )
}