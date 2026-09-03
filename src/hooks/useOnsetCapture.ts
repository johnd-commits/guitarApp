import { useEffect, useRef } from 'react'
import { micCapture } from '../audio/micCapture'
import { backingEngine } from '../audio/backingEngine'
import { metronomeEngine } from '../audio/metronomeEngine'
import { analyseTiming, expectedSlotsFromPattern } from '../audio/timingAnalyser'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useOnsetStore } from '../stores/onsetStore'
import { useSettingsStore } from '../stores/settingsStore'
import { selectActivePattern, useStrumStore } from '../stores/strumStore'

/**
 * Listens for onsets while the transport runs. Latency is subtracted in
 * the analyser, not in the worklet, so the raw AudioContext stamp stays
 * honest.
 */
export function useOnsetCapture(enabled: boolean) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) {
      useOnsetStore.getState().setListening(false)
      return
    }

    let cancelled = false
    useOnsetStore.getState().clear()

    void (async () => {
      try {
        await micCapture.start({
          onset: (onset) => {
            if (cancelled || !enabledRef.current) return
            if (backingEngine.recentHitTimes(onset.time).length > 0) return
            useOnsetStore.getState().pushOnset(onset)
          },
        })
        if (cancelled) {
          micCapture.stop()
          return
        }
        useOnsetStore.getState().setListening(true)
        useSettingsStore.getState().setMicPermissionState('granted')
      } catch {
        if (!cancelled) {
          useOnsetStore.getState().setListening(false)
          useSettingsStore.getState().setMicPermissionState('denied')
        }
      }
    })()

    return () => {
      cancelled = true
      useOnsetStore.getState().setListening(false)
      micCapture.stop()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      const onsets = useOnsetStore.getState().onsets
      if (pos && onsets.length > 0) {
        const pattern = selectActivePattern(useStrumStore.getState())
        const tempo = useSettingsStore.getState().tempo
        const timeSignature = useMetronomeStore.getState().timeSignature
        const swing = useMetronomeStore.getState().swing
        const latency = useSettingsStore.getState().latencyOffsetMs / 1000
        const elapsed = pos.currentTime - pos.originTime
        const beatLen = 60 / tempo
        const barLen = beatLen * (timeSignature === '3/4' ? 3 : 4)
        const bars = Math.max(1, Math.ceil(elapsed / barLen) + 1)
        const slots = expectedSlotsFromPattern(pos.originTime, bars, pattern, {
          tempo,
          timeSignature,
          swing: timeSignature === '12/8' ? 0 : swing,
        })
        useOnsetStore.getState().setReport(analyseTiming(onsets, slots, latency))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enabled])
}
