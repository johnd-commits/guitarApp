import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MicPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied'

export const MIN_TEMPO = 40
export const MAX_TEMPO = 200
export const DEFAULT_TEMPO = 80

export function clampTempo(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_TEMPO
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(bpm)))
}

export type SettingsState = {
  tempo: number
  metronomeEnabled: boolean
  countInBars: 1 | 2
  capoPosition: number
  micPermissionState: MicPermissionState
  isPlaying: boolean
  latencyOffsetMs: number
  setTempo: (bpm: number) => void
  setMetronomeEnabled: (enabled: boolean) => void
  setCountInBars: (bars: 1 | 2) => void
  setCapoPosition: (fret: number) => void
  setMicPermissionState: (state: MicPermissionState) => void
  setLatencyOffsetMs: (ms: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tempo: DEFAULT_TEMPO,
      metronomeEnabled: true,
      countInBars: 1,
      capoPosition: 0,
      micPermissionState: 'unknown',
      isPlaying: false,
      latencyOffsetMs: 0,
      setTempo: (bpm) => set({ tempo: clampTempo(bpm) }),
      setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
      setCountInBars: (bars) => set({ countInBars: bars }),
      setCapoPosition: (fret) =>
        set({ capoPosition: Math.min(12, Math.max(0, Math.round(fret))) }),
      setMicPermissionState: (state) => set({ micPermissionState: state }),
      setLatencyOffsetMs: (ms) =>
        set({ latencyOffsetMs: Math.min(120, Math.max(0, Math.round(ms))) }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
    }),
    {
      name: 'fretwise-settings',
      partialize: (state) => ({
        tempo: state.tempo,
        metronomeEnabled: state.metronomeEnabled,
        countInBars: state.countInBars,
        capoPosition: state.capoPosition,
        micPermissionState: state.micPermissionState,
        latencyOffsetMs: state.latencyOffsetMs,
      }),
    },
  ),
)
