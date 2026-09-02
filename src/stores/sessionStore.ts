import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SessionState = {
  micOnboarded: boolean
  practiceGateOpen: boolean
  setMicOnboarded: (value: boolean) => void
  openPracticeGate: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      micOnboarded: false,
      practiceGateOpen: false,
      setMicOnboarded: (value) => set({ micOnboarded: value }),
      openPracticeGate: () => set({ practiceGateOpen: true }),
    }),
    {
      name: 'fretwise-session',
      partialize: (state) => ({
        micOnboarded: state.micOnboarded,
      }),
    },
  ),
)
