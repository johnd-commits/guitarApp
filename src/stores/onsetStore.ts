import { create } from 'zustand'
import type { DetectedOnset } from '../audio/onset'
import type { TimingReport } from '../audio/timingAnalyser'

const MAX_ONSETS = 256

type OnsetState = {
  onsets: DetectedOnset[]
  report: TimingReport | null
  listening: boolean
  lastOnset: DetectedOnset | null
  chroma: Float64Array | null
  chromaEnergy: number
  pushOnset: (onset: DetectedOnset) => void
  setReport: (report: TimingReport | null) => void
  setListening: (listening: boolean) => void
  setChroma: (chroma: Float64Array | null, energy?: number) => void
  clear: () => void
}

export const useOnsetStore = create<OnsetState>()((set) => ({
  onsets: [],
  report: null,
  listening: false,
  lastOnset: null,
  chroma: null,
  chromaEnergy: 0,
  pushOnset: (onset) =>
    set((s) => {
      const next = [...s.onsets, onset]
      return {
        lastOnset: onset,
        onsets: next.length > MAX_ONSETS ? next.slice(next.length - MAX_ONSETS) : next,
      }
    }),
  setReport: (report) => set({ report }),
  setListening: (listening) => set({ listening }),
  setChroma: (chroma, energy = 0) => set({ chroma, chromaEnergy: chroma ? energy : 0 }),
  clear: () =>
    set({ onsets: [], report: null, lastOnset: null, chroma: null, chromaEnergy: 0 }),
}))
