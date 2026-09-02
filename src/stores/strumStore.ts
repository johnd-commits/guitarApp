import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_PATTERN_ID, patternById } from '../strum/library'
import { cycleSlotKind, type StrumPattern } from '../strum/types'

export type StrumState = {
  patternId: string
  customPattern: StrumPattern | null
  setPatternId: (id: string) => void
  cycleSlot: (index: number) => void
  toggleSlotAccent: (index: number) => void
}

function workingPattern(state: Pick<StrumState, 'patternId' | 'customPattern'>): StrumPattern {
  if (state.customPattern && state.customPattern.id === state.patternId) {
    return state.customPattern
  }
  return patternById(state.patternId)
}

export const useStrumStore = create<StrumState>()(
  persist(
    (set, get) => ({
      patternId: DEFAULT_PATTERN_ID,
      customPattern: null,
      setPatternId: (id) => set({ patternId: id }),
      cycleSlot: (index) => {
        const current = workingPattern(get())
        const slots = current.slots.map((s, i) =>
          i === index ? { ...s, kind: cycleSlotKind(s.kind) } : s,
        )
        set({
          patternId: 'custom',
          customPattern: { id: 'custom', name: 'Custom', resolution: current.resolution, slots },
        })
      },
      toggleSlotAccent: (index) => {
        const current = workingPattern(get())
        const slots = current.slots.map((s, i) =>
          i === index ? { ...s, accent: !s.accent } : s,
        )
        set({
          patternId: 'custom',
          customPattern: { id: 'custom', name: 'Custom', resolution: current.resolution, slots },
        })
      },
    }),
    {
      name: 'fretwise-strum',
      partialize: (state) => ({
        patternId: state.patternId,
        customPattern: state.customPattern,
      }),
    },
  ),
)

export function selectActivePattern(state: StrumState): StrumPattern {
  if (state.patternId === 'custom' && state.customPattern) return state.customPattern
  return patternById(state.patternId)
}
