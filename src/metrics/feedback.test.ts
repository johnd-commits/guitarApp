import { describe, expect, it } from 'vitest'
import { observe, type AttemptRecord } from './feedback'
import type { AttemptMetrics } from './fromAttempt'

function metrics(partial: Partial<AttemptMetrics>): AttemptMetrics {
  return {
    meanOffset: 0,
    offsetStdev: 40,
    meanOffsetDown: 0,
    meanOffsetUp: 0,
    stdevDown: 20,
    stdevUp: 20,
    gridPositionsExpected: 16,
    gridPositionsHit: 16,
    extraOnsets: 0,
    driftSlope: 0,
    rawOffsets: [],
    changeLatenciesMs: [],
    changesAttempted: 0,
    changesClean: 0,
    ...partial,
  }
}

function attempt(id: string, tempo: number, stdev: number, extra: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    id,
    userId: 'local',
    lessonId: 't1-down-up',
    stepId: 't1-down-up-1',
    startedAt: extra.startedAt ?? '2026-01-01',
    durationSeconds: 32,
    tempoBpm: tempo,
    patternId: 'down-up',
    chords: [],
    metrics: metrics({ offsetStdev: stdev, meanOffset: extra.metrics?.meanOffset ?? 0 }),
    ...extra,
  }
}

describe('feedback engine', () => {
  it('reports a flat stretch across three unchanged sessions', () => {
    const history = [attempt('a', 76, 40), attempt('b', 76, 41)]
    const now = attempt('c', 76, 40)
    const lines = observe(now, history).map((o) => o.text)
    expect(lines.some((t) => /Three sessions at 76 BPM/.test(t))).toBe(true)
    expect(lines.some((t) => /Not getting worse, not moving/.test(t))).toBe(true)
  })

  it('reports a regression when spread worsens at the same tempo', () => {
    const history = [attempt('a', 80, 30)]
    const now = attempt('b', 80, 55)
    const lines = observe(now, history).map((o) => o.text)
    expect(lines.some((t) => /went from 30ms to 55ms/.test(t))).toBe(true)
  })

  it('does not call a first attempt at a higher tempo a regression', () => {
    const history = [attempt('a', 80, 30)]
    const now = attempt('b', 92, 48)
    const lines = observe(now, history).map((o) => o.text)
    expect(lines.some((t) => /First pass at the higher tempo/.test(t))).toBe(true)
    expect(lines.some((t) => /went from 30ms to 48ms/.test(t))).toBe(false)
  })

  it('cites a long gap without guilt', () => {
    const history = [attempt('a', 80, 52, { startedAt: '2026-01-01T00:00:00.000Z' })]
    const now = attempt('b', 80, 58, { startedAt: '2026-01-12T00:00:00.000Z' })
    const lines = observe(now, history).map((o) => o.text)
    expect(lines.some((t) => /First session in 11 days/.test(t))).toBe(true)
    expect(lines.some((t) => /Spread 58ms/.test(t))).toBe(true)
  })
})
