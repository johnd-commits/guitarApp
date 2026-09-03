import type { AttemptRecord } from '../metrics/feedback'
import type { AttemptMetrics } from '../metrics/fromAttempt'

export type AttemptRow = {
  id: string
  user_id: string
  lesson_id: string
  step_id: string
  started_at: string
  duration_seconds: number
  tempo_bpm: number
  pattern_id: string
  chords: string[]
  mean_offset: number | null
  offset_stdev: number | null
  mean_offset_down: number | null
  mean_offset_up: number | null
  stdev_down: number | null
  stdev_up: number | null
  grid_positions_expected: number
  grid_positions_hit: number
  extra_onsets: number
  drift_slope: number | null
  changes_attempted: number
  changes_clean: number
  raw_offsets: number[]
  change_latencies: number[]
  note: string | null
}

export function attemptToRow(attempt: AttemptRecord, userId: string): AttemptRow {
  const m = attempt.metrics
  return {
    id: attempt.id,
    user_id: userId,
    lesson_id: attempt.lessonId,
    step_id: attempt.stepId,
    started_at: attempt.startedAt,
    duration_seconds: attempt.durationSeconds,
    tempo_bpm: attempt.tempoBpm,
    pattern_id: attempt.patternId,
    chords: attempt.chords,
    mean_offset: m.meanOffset,
    offset_stdev: m.offsetStdev,
    mean_offset_down: m.meanOffsetDown,
    mean_offset_up: m.meanOffsetUp,
    stdev_down: m.stdevDown,
    stdev_up: m.stdevUp,
    grid_positions_expected: m.gridPositionsExpected,
    grid_positions_hit: m.gridPositionsHit,
    extra_onsets: m.extraOnsets,
    drift_slope: m.driftSlope,
    changes_attempted: m.changesAttempted,
    changes_clean: m.changesClean,
    raw_offsets: m.rawOffsets,
    change_latencies: m.changeLatenciesMs,
    note: attempt.note ?? null,
  }
}

export function rowToAttempt(row: AttemptRow): AttemptRecord {
  const metrics: AttemptMetrics = {
    meanOffset: row.mean_offset,
    offsetStdev: row.offset_stdev,
    meanOffsetDown: row.mean_offset_down,
    meanOffsetUp: row.mean_offset_up,
    stdevDown: row.stdev_down,
    stdevUp: row.stdev_up,
    gridPositionsExpected: row.grid_positions_expected,
    gridPositionsHit: row.grid_positions_hit,
    extraOnsets: row.extra_onsets,
    driftSlope: row.drift_slope,
    rawOffsets: row.raw_offsets ?? [],
    changeLatenciesMs: row.change_latencies ?? [],
    changesAttempted: row.changes_attempted,
    changesClean: row.changes_clean,
  }
  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    stepId: row.step_id,
    startedAt: row.started_at,
    durationSeconds: row.duration_seconds,
    tempoBpm: row.tempo_bpm,
    patternId: row.pattern_id,
    chords: row.chords ?? [],
    metrics,
    note: row.note ?? undefined,
  }
}
