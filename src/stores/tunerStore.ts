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
  /** Pinned string index, or null for auto-detect. */
  selectedString: number | null
  setTuningId: (id: TuningId) => void
  setLocks: (locks: StringLock[]) => void
  setLive: (live: TunerLive) => void
  setSelectedString: (index: number | null) => void
  resetLocks: () => void
}

export const useTunerStore = create<TunerState>()(
  persist(
    (set) => ({
      tuningId: 'standard',
      locks: emptyLocks(),
      live: { frequency: null, cents: null, rms: 0, clarity: 0, detectedString: null },
      selectedString: null,
      setTuningId: (id) =>
        set({
          tuningId: id,
          locks: emptyLocks(),
          selectedString: null,
          live: { frequency: null, cents: null, rms: 0, clarity: 0, detectedString: null },
        }),
      setLocks: (locks) => set({ locks }),
      setLive: (live) => set({ live }),
      setSelectedString: (index) =>
        set((s) => ({
          selectedString: index,
          live: { ...s.live, detectedString: index ?? s.live.detectedString },
        })),
      resetLocks: () =>
        set({
          locks: emptyLocks(),
          selectedString: null,
          live: { frequency: null, cents: null, rms: 0, clarity: 0, detectedString: null },
        }),
    }),
    {
      name: 'fretwise-tuner',
      partialize: (state) => ({ tuningId: state.tuningId }),
    },
  ),
)
