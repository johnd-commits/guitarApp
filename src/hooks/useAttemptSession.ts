import { useEffect, useRef, useState } from 'react'
import { getAudioContext } from '../audio/context'
import { beatsPerBar } from '../audio/timing'
import { changeLatenciesMs, changeTimesFromOrigin, countCleanChanges } from '../chords/changes'
import { listAttempts, saveAttempt } from '../db'
import { observe, type AttemptRecord, type Observation } from '../metrics/feedback'
import { metricsFromAttempt } from '../metrics/fromAttempt'
import { useBackingStore } from '../stores/backingStore'
import { useChangeTrainerStore } from '../stores/changeTrainerStore'
import { useChordFollowStore } from '../stores/chordFollowStore'
import { useLessonStore } from '../stores/lessonStore'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useOnsetStore } from '../stores/onsetStore'
import { useSessionBuilderStore } from '../stores/sessionBuilderStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useStrumStore } from '../stores/strumStore'
import { progressionById } from '../chords/library'

export type TakeState = {
  attempt: AttemptRecord | null
  lines: Observation[]
  keepPrompt: boolean
}

/**
 * When the transport stops, write one immutable Attempt (unless solo /
 * the unscored session block). Musical duration comes from AudioContext.
 */
export function useAttemptSession(): TakeState {
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const solo = useBackingStore((s) => s.solo)
  const sessionActive = useSessionBuilderStore((s) => s.active)
  const blockIndex = useSessionBuilderStore((s) => s.blockIndex)
  const [take, setTake] = useState<TakeState>({ attempt: null, lines: [], keepPrompt: false })
  const startRef = useRef<{ wall: string; audio: number } | null>(null)

  useEffect(() => {
    if (isPlaying) {
      startRef.current = {
        wall: new Date().toISOString(),
        audio: getAudioContext().currentTime,
      }
      setTake({ attempt: null, lines: [], keepPrompt: false })
      return
    }
    const started = startRef.current
    startRef.current = null
    if (!started) return
    if (solo || (sessionActive && blockIndex === 3)) return

    const duration = getAudioContext().currentTime - started.audio
    if (duration < 4) return

    const report = useOnsetStore.getState().report
    if (!report || report.hitsLanded === 0) return

    const tempo = useSettingsStore.getState().tempo
    const timeSignature = useMetronomeStore.getState().timeSignature
    const countInBars = useSettingsStore.getState().countInBars
    const latency = useSettingsStore.getState().latencyOffsetMs / 1000
    const from = useChangeTrainerStore.getState().fromId
    const to = useChangeTrainerStore.getState().toId
    const progression = progressionById(useChordFollowStore.getState().progressionId)
    const chords =
      useChangeTrainerStore.getState().noStrum || from
        ? [from, to]
        : progression.chordIds
    const bpb = beatsPerBar(timeSignature)
    const beatLen = 60 / tempo
    const origin = started.audio
    const changes = changeTimesFromOrigin(origin, countInBars * bpb, beatLen, bpb, duration)
    const onsets = useOnsetStore.getState().onsets
    const latencies = changeLatenciesMs(onsets, changes, latency)
    const clean = countCleanChanges(onsets, changes, latency)
    const { lessonId, stepIndex } = useLessonStore.getState()
    const stepId = `${lessonId}-${stepIndex + 1}`

    const attempt: AttemptRecord = {
      id: crypto.randomUUID(),
      userId: 'local',
      lessonId,
      stepId,
      startedAt: started.wall,
      durationSeconds: duration,
      tempoBpm: tempo,
      patternId: useStrumStore.getState().patternId,
      chords,
      metrics: metricsFromAttempt(report, {
        changeLatenciesMs: latencies,
        changesAttempted: changes.length,
        changesClean: clean,
      }),
    }

    void (async () => {
      const history = await listAttempts()
      await saveAttempt(attempt)
      const lines = observe(attempt, history)
      const keepPrompt = lines.some((l) => /Steadiest you've played/.test(l.text))
      setTake({ attempt, lines, keepPrompt })
    })()
  }, [isPlaying, solo, sessionActive, blockIndex])

  return take
}

export function useSessionClock() {
  const active = useSessionBuilderStore((s) => s.active)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      useSessionBuilderStore.getState().tick(getAudioContext().currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
