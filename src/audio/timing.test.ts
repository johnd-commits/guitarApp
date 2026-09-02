import { describe, expect, it } from 'vitest'
import {
  defaultBeats,
  planClicks,
  secondsPerBeat,
  type SchedulerConfig,
} from './timing'

function baseConfig(overrides: Partial<SchedulerConfig> = {}): SchedulerConfig {
  return {
    tempo: 90,
    timeSignature: '4/4',
    subdivision: 'quarter',
    swing: 0,
    beats: defaultBeats('4/4'),
    countInBars: 0,
    metronomeEnabled: true,
    ...overrides,
  }
}

describe('lookahead click planner', () => {
  it('schedules 100 beats at 90 BPM within 1ms of the expected grid', () => {
    const tempo = 90
    const clicks = planClicks(baseConfig({ tempo }), 100)
    const interval = secondsPerBeat(tempo)

    expect(clicks).toHaveLength(100)
    for (let i = 0; i < 100; i++) {
      const expected = i * interval
      const errorMs = Math.abs(clicks[i].time - expected) * 1000
      expect(errorMs, `beat ${i} off by ${errorMs}ms`).toBeLessThan(1)
    }
  })

  it('does not shift later times when individual beats are muted', () => {
    const unmuted = planClicks(baseConfig(), 16)
    const muted = planClicks(
      baseConfig({
        beats: [
          { muted: false, accent: true },
          { muted: true, accent: false },
          { muted: false, accent: false },
          { muted: true, accent: false },
        ],
      }),
      16,
    )

    expect(muted.map((c) => c.time)).toEqual(unmuted.map((c) => c.time))
    expect(muted.filter((c) => c.audible)).toHaveLength(8)
    expect(unmuted.every((c) => c.audible)).toBe(true)

    for (let i = 0; i < muted.length; i++) {
      const beatInBar = i % 4
      const shouldSound = beatInBar === 0 || beatInBar === 2
      expect(muted[i].audible).toBe(shouldSound)
    }
  })

  it('produces a 2:1 long/short eighth ratio at 100% swing', () => {
    const clicks = planClicks(
      baseConfig({
        tempo: 60,
        subdivision: 'eighth',
        swing: 100,
      }),
      4,
    )

    expect(clicks).toHaveLength(8)
    const long = clicks[1].time - clicks[0].time
    const short = clicks[2].time - clicks[1].time
    expect(long / short).toBeCloseTo(2, 8)
    expect(clicks[2].time - clicks[0].time).toBeCloseTo(1, 8)
  })
})
