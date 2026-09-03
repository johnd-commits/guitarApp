import { describe, expect, it } from 'vitest'
import { medianRoundTrip, pairClicksToOnsets } from './latencyCalibrate'

describe('latency pairing', () => {
  it('takes the median round-trip so one outlier does not shift every onset', () => {
    const clicks = [1, 2, 3, 4, 5]
    const onsets = [1.03, 2.031, 3.08, 4.029, 5.03]
    const pairs = pairClicksToOnsets(clicks, onsets)
    expect(pairs).toHaveLength(5)
    const median = medianRoundTrip(pairs)
    expect(median).toBeCloseTo(0.03, 3)
  })
})
