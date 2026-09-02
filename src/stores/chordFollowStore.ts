import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_PROGRESSION_ID } from '../chords/library'

type ChordFollowState = {
  progressionId: string
  setProgressionId: (id: string) => void
}

export const useChordFollowStore = create<ChordFollowState>()(
  persist(
    (set) => ({
      progressionId: DEFAULT_PROGRESSION_ID,
      setProgressionId: (id) => set({ progressionId: id }),
    }),
    { name: 'fretwise-chords', partialize: (s) => ({ progressionId: s.progressionId }) },
  ),
)
