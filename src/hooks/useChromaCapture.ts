import { useEffect, useRef } from 'react'
import { currentMicOptions, describeMicError } from '../audio/micOptions'
import { micCapture } from '../audio/micCapture'
import { metronomeEngine } from '../audio/metronomeEngine'
import { micGainFromSensitivity } from '../audio/micGain'
import { useOnsetStore } from '../stores/onsetStore'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * Opens the onset worklet for chromagrams only — no transport, no timing
 * report. Used by the "name this chord" listener.
 */
export function useChromaCapture(enabled: boolean, generation = 0) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const sensitivity = useSettingsStore((s) => s.micSensitivity)

  useEffect(() => {
    micCapture.setInputGain(micGainFromSensitivity(sensitivity))
  }, [sensitivity])

  useEffect(() => {
    if (!enabled) {
      useOnsetStore.getState().setListening(false)
      return
    }

    useSettingsStore.getState().setPlaying(false)
    useSettingsStore.getState().setMicError(null)
    metronomeEngine.stop()

    let cancelled = false
    useOnsetStore.getState().clear()

    void (async () => {
      try {
        await micCapture.start(
          {
            chroma: (chroma, energy) => {
              if (cancelled || !enabledRef.current) return
              useOnsetStore.getState().setChroma(chroma, energy)
            },
            onset: () => {
              // Worklet is registered because chroma shares the onset processor.
            },
          },
          currentMicOptions(),
        )
        if (cancelled) {
          micCapture.stop()
          return
        }
        useOnsetStore.getState().setListening(true)
        useSettingsStore.getState().setMicPermissionState('granted')
        useSettingsStore.getState().setMicError(null)
      } catch (error) {
        if (!cancelled) {
          useOnsetStore.getState().setListening(false)
          useSettingsStore.getState().setMicPermissionState('denied')
          useSettingsStore.getState().setMicError(describeMicError(error))
        }
      }
    })()

    return () => {
      cancelled = true
      useOnsetStore.getState().setListening(false)
      useOnsetStore.getState().clear()
      micCapture.stop()
    }
  }, [enabled, generation])
}
