import { beforeEach, describe, expect, it } from 'vitest'
import { clampTempo, DEFAULT_TEMPO, MAX_TEMPO, MIN_TEMPO, useSettingsStore } from './settingsStore'

describe('clampTempo', () => {
  it('keeps values inside 40–200 BPM', () => {
    expect(clampTempo(90)).toBe(90)
    expect(clampTempo(MIN_TEMPO)).toBe(40)
    expect(clampTempo(MAX_TEMPO)).toBe(200)
    expect(clampTempo(12)).toBe(40)
    expect(clampTempo(400)).toBe(200)
  })

  it('rounds and rejects non-finite input', () => {
    expect(clampTempo(72.4)).toBe(72)
    expect(clampTempo(Number.NaN)).toBe(DEFAULT_TEMPO)
  })
})

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({
      tempo: DEFAULT_TEMPO,
      metronomeEnabled: true,
      countInBars: 1,
      capoPosition: 0,
      micPermissionState: 'unknown',
      isPlaying: false,
    })
  })

  it('updates the displayed tempo and nothing else', () => {
    useSettingsStore.getState().setTempo(112)
    expect(useSettingsStore.getState().tempo).toBe(112)
    expect(useSettingsStore.getState().isPlaying).toBe(false)
  })

  it('toggles play state without changing tempo', () => {
    useSettingsStore.getState().setTempo(60)
    useSettingsStore.getState().togglePlaying()
    expect(useSettingsStore.getState().isPlaying).toBe(true)
    expect(useSettingsStore.getState().tempo).toBe(60)
  })
})
