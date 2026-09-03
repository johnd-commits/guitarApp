import { describe, expect, it } from 'vitest'
import { analyseTiming, expectedSlotsFromPattern, linearSlope } from './timingAnalyser'
import { patternFromKinds } from '../strum/types'

describe('timing analyser', () => {
  const pattern = patternFromKinds('downs', 'downs', 'eighth', [
    'HIT',
    'MISS',
    'HIT',
    'MISS',
    'HIT',
    'MISS',
    'HIT',
    'MISS',
  ])
  const config = { tempo: 60, timeSignature: '4/4' as const, swing: 0 }

  it('reports signed offset in ms and does not count MISS slots as expected hits', () => {
    const slots = expectedSlotsFromPattern(0, 1, pattern, config)
    // 60 BPM, 4/4, eighths: HIT on 0, 1, 2, 3 seconds (beats 1-4)
    const onsets = [
      { time: -0.04, energy: 1 },
      { time: 1.01, energy: 1 },
      { time: 2.0, energy: 1 },
      { time: 3.03, energy: 1 },
    ]
    const report = analyseTiming(onsets, slots, 0)
    expect(report.expectedHits).toBe(4)
    expect(report.hitsLanded).toBe(4)
    expect(report.missed).toBe(0)
    expect(report.extra).toBe(0)
    expect(report.meanOffsetMs).toBeCloseTo(0, 0)
    expect(report.hits[0].offsetMs).toBeCloseTo(-40, 5)
    expect(report.hits[1].offsetMs).toBeCloseTo(10, 5)
  })

  it('subtracts the calibrated latency so a late detection is not a late strum', () => {
    const slots = expectedSlotsFromPattern(0, 1, pattern, config)
    const onsets = [{ time: 0.03, energy: 1 }]
    const raw = analyseTiming(onsets, slots, 0)
    expect(raw.hits[0].offsetMs).toBeCloseTo(30, 5)
    const calibrated = analyseTiming(onsets, slots, 0.03)
    expect(calibrated.hits[0].offsetMs).toBeCloseTo(0, 5)
  })

  it('keeps extra unscheduled hits out of the mean', () => {
    const slots = expectedSlotsFromPattern(0, 1, pattern, config)
    const onsets = [
      { time: 0, energy: 1 },
      { time: 0.4, energy: 1 },
    ]
    const report = analyseTiming(onsets, slots, 0)
    expect(report.extra).toBe(1)
    expect(report.hitsLanded).toBe(1)
    expect(report.meanOffsetMs).toBeCloseTo(0, 5)
  })

  it('fits a negative drift slope when successive hits arrive earlier', () => {
    const slope = linearSlope([0, 1, 2, 3], [10, 0, -10, -20])
    expect(slope).toBeCloseTo(-10, 8)
  })
})
