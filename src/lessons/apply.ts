import { defaultBeats } from '../audio/timing'
import { PROGRESSIONS } from '../chords/library'
import { useBackingStore } from '../stores/backingStore'
import { useChangeTrainerStore } from '../stores/changeTrainerStore'
import { useChordFollowStore } from '../stores/chordFollowStore'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useStrumStore } from '../stores/strumStore'
import type { LessonStep } from './catalog'

export function progressionIdForChords(chordIds: string[]): string | null {
  if (chordIds.length < 2) return null
  const exact = PROGRESSIONS.find(
    (p) => p.chordIds.join('\0') === chordIds.join('\0'),
  )
  if (exact) return exact.id
  const two = PROGRESSIONS.find(
    (p) => p.chordIds[0] === chordIds[0] && p.chordIds[1] === chordIds[1],
  )
  return two?.id ?? null
}

/** Push a step onto the live metronome, pattern, chords, and backing. */
export function applyLessonStep(step: LessonStep) {
  useSettingsStore.getState().setTempo(step.tempoStart)
  useStrumStore.getState().setPatternId(step.patternId)
  useChangeTrainerStore.getState().setNoStrum(Boolean(step.noStrum))

  const metro = useMetronomeStore.getState()
  if (step.timeSignature) metro.setTimeSignature(step.timeSignature)
  if (step.subdivision) metro.setSubdivision(step.subdivision)
  if (step.swing !== undefined) metro.setSwing(step.swing)
  else metro.setSwing(0)

  const signature = useMetronomeStore.getState().timeSignature
  const base = defaultBeats(signature)
  const muted = new Set(step.muteBeats ?? [])
  const accents = step.accentBeats
    ? new Set(step.accentBeats)
    : new Set(base.map((beat, i) => (beat.accent ? i : -1)).filter((i) => i >= 0))
  metro.setBeatFlags(
    base.map((_, i) => ({
      muted: muted.has(i),
      accent: accents.has(i),
    })),
  )

  if (step.backingStyle) {
    useBackingStore.getState().setStyle(step.backingStyle)
    useBackingStore.getState().setEnabled(true)
    useBackingStore.getState().setSolo(false)
  } else {
    useBackingStore.getState().setEnabled(false)
  }

  if (step.chordIds.length >= 2) {
    useChangeTrainerStore.getState().setPair(step.chordIds[0], step.chordIds[1])
    const progressionId = progressionIdForChords(step.chordIds)
    if (progressionId) useChordFollowStore.getState().setProgressionId(progressionId)
  }
}

export function stepSucceeded(
  step: LessonStep,
  report: { offsetStdevMs: number | null; hitsLanded: number } | null,
): boolean {
  if (!report) return false
  const { offsetStdevMaxMs, minHits } = step.success
  if (offsetStdevMaxMs !== undefined) {
    if (report.offsetStdevMs === null || report.offsetStdevMs > offsetStdevMaxMs) return false
  }
  if (minHits !== undefined && report.hitsLanded < minHits) return false
  return offsetStdevMaxMs !== undefined || minHits !== undefined
}
