import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '../metrics/feedback'
import { attemptToRow, rowToAttempt } from './mapAttempt'

describe('attempt row mapping', () => {
  it('round-trips an attempt through the Supabase row shape', () => {
    const attempt: AttemptRecord = {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'local',
      lessonId: 't1-down-up',
      stepId: 't1-down-up-1',
      startedAt: '2026-01-01T00:00:00.000Z',
      durationSeconds: 32,
      tempoBpm: 80,
      patternId: 'down-up',
      chords: ['G', 'C'],
      metrics: {
        meanOffset: -12,
        offsetStdev: 40,
        meanOffsetDown: -8,
        meanOffsetUp: 4,
        stdevDown: 20,
        stdevUp: 22,
        gridPositionsExpected: 16,
        gridPositionsHit: 15,
        extraOnsets: 1,
        driftSlope: -2,
        rawOffsets: [-12, 0, 8],
        changeLatenciesMs: [210],
        changesAttempted: 8,
        changesClean: 6,
      },
      note: 'felt late on the upstroke',
    }
    const row = attemptToRow(attempt, '22222222-2222-2222-2222-222222222222')
    expect(row.user_id).toBe('22222222-2222-2222-2222-222222222222')
    expect(row.offset_stdev).toBe(40)
    expect(rowToAttempt(row)).toMatchObject({
      id: attempt.id,
      lessonId: 't1-down-up',
      tempoBpm: 80,
      metrics: { offsetStdev: 40, changeLatenciesMs: [210] },
      note: 'felt late on the upstroke',
    })
  })
})
