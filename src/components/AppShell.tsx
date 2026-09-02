import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TransportBar } from './TransportBar'
import { useMetronomeClock } from '../hooks/useMetronomeClock'

export function AppShell() {
  useMetronomeClock()
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <div className="sticky bottom-0 z-10">
        <TransportBar />
        <BottomNav />
      </div>
    </div>
  )
}
