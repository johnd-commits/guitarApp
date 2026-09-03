import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  defaultBeats,
  type BeatFlags,
  type Subdivision,
  type TimeSignature,
} from '../audio/timing'

export type MetronomeState = {
  timeSignature: TimeSignature
  subdivision: Subdivision
  swing: number
  beats: BeatFlags[]
  currentBeat: number | null
  currentSlot: number | null
  setTimeSignature: (signature: TimeSignature) => void
  setSubdivision: (subdivision: Subdivision) => void
  setSwing: (swing: number) => void
  toggleMute: (beatIndex: number) => void
  toggleAccent: (beatIndex: number) => void
  setBeatFlags: (beats: BeatFlags[]) => void
  setCurrentPulse: (beat: number | null, slot: number | null) => void
}

function resizeBeats(existing: BeatFlags[], signature: TimeSignature): BeatFlags[] {
  const next = defaultBeats(signature)
  for (let i = 0; i < Math.min(existing.length, next.length); i++) {
    next[i] = existing[i]
  }
  return next
}

export const useMetronomeStore = create<MetronomeState>()(
  persist(
    (set) => ({
      timeSignature: '4/4',
      subdivision: 'quarter',
      swing: 0,
      beats: defaultBeats('4/4'),
      currentBeat: null,
      currentSlot: null,
      setTimeSignature: (signature) =>
        set((s) => ({
          timeSignature: signature,
          beats: resizeBeats(s.beats, signature),
        })),
      setSubdivision: (subdivision) => set({ subdivision }),
      setSwing: (swing) => set({ swing: Math.min(100, Math.max(0, swing)) }),
      toggleMute: (beatIndex) =>
        set((s) => ({
          beats: s.beats.map((b, i) =>
            i === beatIndex ? { ...b, muted: !b.muted } : b,
          ),
        })),
      toggleAccent: (beatIndex) =>
        set((s) => ({
          beats: s.beats.map((b, i) =>
            i === beatIndex ? { ...b, accent: !b.accent } : b,
          ),
        })),
      setBeatFlags: (beats) => set({ beats }),
      setCurrentPulse: (beat, slot) => set({ currentBeat: beat, currentSlot: slot }),
    }),
    {
      name: 'fretwise-metronome',
      partialize: (state) => ({
        timeSignature: state.timeSignature,
        subdivision: state.subdivision,
        swing: state.swing,
        beats: state.beats,
      }),
    },
  ),
)
