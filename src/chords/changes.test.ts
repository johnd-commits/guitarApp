import { describe, expect, it } from 'vitest'
import { changeLatenciesMs, changeTimesFromOrigin, countCleanChanges } from './changes'

describe('one-minute changes', () => {
  it('counts an onset inside 80ms of a bar-change as clean', () => {
    const changes = [1, 2, 3]
    const onsets = [{ time: 1.05 }, { time: 2.0 }, { time: 2.4 }]
    expect(countCleanChanges(onsets, changes, 0)).toBe(2)
  })

  it('subtracts latency so a late detection can still be a clean change', () => {
    expect(countCleanChanges([{ time: 1.04 }], [1], 0.04)).toBe(1)
  })

  it('places change times on each bar after count-in', () => {
    const times = changeTimesFromOrigin(0, 4, 1, 4, 20)
    expect(times[0]).toBe(8)
    expect(times).toHaveLength(4)
  })

  it('reports signed change latency in milliseconds', () => {
    expect(changeLatenciesMs([{ time: 1.04 }], [1], 0)[0]).toBeCloseTo(40, 8)
  })
})
