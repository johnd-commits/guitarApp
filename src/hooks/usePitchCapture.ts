import { useEffect, useRef } from 'react'
import { micCapture, type PitchFrame } from '../audio/micCapture'
import { acceptPitch } from '../audio/pitchGate'
import { metronomeEngine } from '../audio/metronomeEngine'
import { allLocked, stepLock } from '../tuner/lock'
import { centsOff, detectString, stringTargets, tuningById } from '../tuner/notes'
import { useSessionStore } from '../stores/sessionStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTunerStore } from '../stores/tunerStore'

export function usePitchCapture(enabled: boolean, generation = 0) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) return

    useSettingsStore.getState().setPlaying(false)
    metronomeEngine.stop()

    let cancelled = false
    let previousString: number | null = useTunerStore.getState().live.detectedString

    const onFrame = (frame: PitchFrame) => {
      if (cancelled || !enabledRef.current) return
      const { tuningId, locks } = useTunerStore.getState()
      const capo = useSettingsStore.getState().capoPosition
      const targets = stringTargets(tuningById(tuningId), capo)
      const ok = acceptPitch(frame.frequency, frame.clarity, frame.rms)

      if (!ok) {
        const nextLocks = locks.map((lock) =>
          stepLock(lock, { detected: false, cents: null, now: frame.currentTime }),
        )
        useTunerStore.getState().setLocks(nextLocks)
        useTunerStore.getState().setLive({
          frequency: null,
          cents: null,
          rms: frame.rms,
          detectedString: previousString,
        })
        if (allLocked(nextLocks)) useSessionStore.getState().openPracticeGate()
        return
      }

      const index = detectString(frame.frequency, targets, previousString)
      previousString = index
      const cents = centsOff(frame.frequency, targets[index].frequency)
      const nextLocks = locks.map((lock, i) =>
        stepLock(lock, {
          detected: i === index,
          cents: i === index ? cents : null,
          now: frame.currentTime,
        }),
      )
      useTunerStore.getState().setLocks(nextLocks)
      useTunerStore.getState().setLive({
        frequency: frame.frequency,
        cents,
        rms: frame.rms,
        detectedString: index,
      })
      if (allLocked(nextLocks)) useSessionStore.getState().openPracticeGate()
    }

    void (async () => {
      try {
        await micCapture.start({ pitch: onFrame })
        if (cancelled) {
          micCapture.stop()
          return
        }
        useSettingsStore.getState().setMicPermissionState('granted')
      } catch {
        if (!cancelled) {
          useSettingsStore.getState().setMicPermissionState('denied')
        }
      }
    })()

    return () => {
      cancelled = true
      micCapture.stop()
    }
  }, [enabled, generation])
}
