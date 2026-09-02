import { useEffect } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'

export function useMetronomeClock() {
  const tempo = useSettingsStore((s) => s.tempo)
  const metronomeEnabled = useSettingsStore((s) => s.metronomeEnabled)
  const countInBars = useSettingsStore((s) => s.countInBars)
  const isPlaying = useSettingsStore((s) => s.isPlaying)

  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const subdivision = useMetronomeStore((s) => s.subdivision)
  const swing = useMetronomeStore((s) => s.swing)
  const beats = useMetronomeStore((s) => s.beats)

  useEffect(() => {
    metronomeEngine.setOnBeat((event) => {
      useMetronomeStore.getState().setCurrentPulse(event.beat, event.slot)
    })
    return () => metronomeEngine.setOnBeat(null)
  }, [])

  useEffect(() => {
    metronomeEngine.setConfig({
      tempo,
      timeSignature,
      subdivision,
      swing,
      beats,
      countInBars,
      metronomeEnabled,
    })
  }, [tempo, timeSignature, subdivision, swing, beats, countInBars, metronomeEnabled])

  useEffect(() => {
    if (!isPlaying) {
      metronomeEngine.stop()
      useMetronomeStore.getState().setCurrentPulse(null, null)
      return
    }
    void metronomeEngine.start()
    return () => {
      metronomeEngine.stop()
      useMetronomeStore.getState().setCurrentPulse(null, null)
    }
  }, [isPlaying])
}
