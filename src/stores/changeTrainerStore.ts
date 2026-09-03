import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const OPEN_CHANGE_PAIRS = [
  ['G', 'C'],
  ['D', 'Dm'],
  ['E', 'Em'],
  ['A', 'Am'],
  ['C', 'Am'],
  ['G', 'Em'],
  ['D', 'A'],
] as const

type ChangeTrainerState = {
  fromId: string
  toId: string
  animSpeed: number
  noStrum: boolean
  minuteBest: number
  minuteLast: number
  setPair: (fromId: string, toId: string) => void
  setAnimSpeed: (speed: number) => void
  setNoStrum: (value: boolean) => void
  recordMinute: (count: number) => void
}

export const useChangeTrainerStore = create<ChangeTrainerState>()(
  persist(
    (set) => ({
      fromId: 'G',
      toId: 'C',
      animSpeed: 1,
      noStrum: false,
      minuteBest: 0,
      minuteLast: 0,
      setPair: (fromId, toId) => set({ fromId, toId }),
      setAnimSpeed: (speed) =>
        set({ animSpeed: Math.min(1, Math.max(0.25, speed)) }),
      setNoStrum: (noStrum) => set({ noStrum }),
      recordMinute: (count) =>
        set((s) => ({
          minuteLast: count,
          minuteBest: Math.max(s.minuteBest, count),
        })),
    }),
    {
      name: 'fretwise-changes',
      partialize: (s) => ({
        fromId: s.fromId,
        toId: s.toId,
        animSpeed: s.animSpeed,
        noStrum: s.noStrum,
        minuteBest: s.minuteBest,
        minuteLast: s.minuteLast,
      }),
    },
  ),
)
