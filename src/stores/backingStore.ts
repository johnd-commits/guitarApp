import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { backingEngine } from '../audio/backingEngine'
import type { BackingPart, BackingStyle } from '../audio/backing'

type BackingState = {
  enabled: boolean
  style: BackingStyle
  solo: boolean
  headphonesNoted: boolean
  setEnabled: (enabled: boolean) => void
  setStyle: (style: BackingStyle) => void
  setSolo: (solo: boolean) => void
  noteHeadphones: () => void
}

export const useBackingStore = create<BackingState>()(
  persist(
    (set) => ({
      enabled: false,
      style: 'straight-rock',
      solo: false,
      headphonesNoted: false,
      setEnabled: (enabled) => {
        backingEngine.setConfig({ enabled })
        set({ enabled })
      },
      setStyle: (style) => {
        backingEngine.setConfig({ style })
        set({ style })
      },
      setSolo: (solo) => {
        backingEngine.setConfig({ solo })
        set({ solo })
      },
      noteHeadphones: () => set({ headphonesNoted: true }),
    }),
    {
      name: 'fretwise-backing',
      partialize: (s) => ({
        enabled: s.enabled,
        style: s.style,
        solo: s.solo,
        headphonesNoted: s.headphonesNoted,
      }),
    },
  ),
)

export const BACKING_STYLES: Array<{ id: BackingStyle; name: string }> = [
  { id: 'straight-rock', name: 'Straight rock' },
  { id: 'shuffle-blues', name: 'Shuffle blues' },
  { id: 'one-drop', name: 'Reggae one-drop' },
  { id: 'folk', name: 'Folk / strum' },
]

export const BACKING_PARTS: BackingPart[] = ['kick', 'snare', 'hat', 'bass']
