import { create } from 'zustand'

export type PracticeMode = 'follow' | 'changes' | 'lessons' | 'session'

type PracticeState = {
  mode: PracticeMode
  setMode: (mode: PracticeMode) => void
}

export const usePracticeStore = create<PracticeState>()((set) => ({
  mode: 'follow',
  setMode: (mode) => set({ mode }),
}))
