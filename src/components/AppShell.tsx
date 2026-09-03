import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { BottomNav } from './BottomNav'
import { TransportBar } from './TransportBar'
import { useMetronomeClock } from '../hooks/useMetronomeClock'
import { useSessionClock } from '../hooks/useAttemptSession'
import { useAuthStore } from '../sync/authStore'

export function AppShell() {
  useMetronomeClock()
  useSessionClock()
  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])
  return (
    <div className="flex min-h-dvh flex-col text-ink">
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
