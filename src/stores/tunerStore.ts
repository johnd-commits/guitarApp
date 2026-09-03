import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emptyLocks, type StringLock } from '../tuner/lock'
import type { TuningId } from '../tuner/notes'

export type TunerLive = {
  frequency: number | null
  cents: number | null
  rms: number
  clarity: number
  detectedString: number | null
}

type TunerState = {
  tuningId: TuningId
  locks: StringLock[]
  live: TunerLive
  setTuningId: (id: TuningId) => void
  setLocks: (locks: StringLock[]) => void
  setLive: (live: TunerLive) => void
  resetLocks: () => void
}

export const useTunerStore = create<TunerState>()(
  persist(
    (set) => ({
      tuningId: 'standard',
      locks: emptyLocks(),
      live: { frequency: null, cents: null, rms: 0, clarity: 0, detectedString: null },
      setTuningId: (id) => set({ tuningId: id, locks: emptyLocks() }),
      setLocks: (locks) => set({ locks }),
      setLive: (live) => set({ live }),
      resetLocks: () =>
        set({
          locks: emptyLocks(),
          live: { frequency: null, cents: null, rms: 0, clarity: 0, detectedString: null },
        }),
    }),
    {
      name: 'fretwise-tuner',
      partialize: (state) => ({ tuningId: state.tuningId }),
    },
  ),
)
