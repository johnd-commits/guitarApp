import { describe, expect, it } from 'vitest'
import { bluesDegree, hitsForClick, rootHz } from './backing'

describe('backing hits', () => {
  it('puts rock snare on 2 and 4, kick on 1 and 3', () => {
    const k1 = hitsForClick({ bar: 0, beat: 0, slot: 0, time: 0 }, 'straight-rock')
    expect(k1.some((h) => h.part === 'kick')).toBe(true)
    const s2 = hitsForClick({ bar: 0, beat: 1, slot: 0, time: 1 }, 'straight-rock')
    expect(s2.some((h) => h.part === 'snare')).toBe(true)
  })

  it('puts one-drop kick and snare on beat 3 only', () => {
    const b1 = hitsForClick({ bar: 0, beat: 0, slot: 0, time: 0 }, 'one-drop')
    expect(b1.filter((h) => h.part === 'kick' || h.part === 'snare')).toHaveLength(0)
    const b3 = hitsForClick({ bar: 0, beat: 2, slot: 0, time: 2 }, 'one-drop')
    expect(b3.some((h) => h.part === 'kick')).toBe(true)
    expect(b3.some((h) => h.part === 'snare')).toBe(true)
  })

  it('walks the 12-bar form as I and IV and V, seen not counted', () => {
    expect(bluesDegree(0)).toBe('I')
    expect(bluesDegree(4)).toBe('IV')
    expect(bluesDegree(8)).toBe('V')
    expect(bluesDegree(12)).toBe('I')
    expect(rootHz('IV', 110) / 110).toBeCloseTo(Math.pow(2, 5 / 12), 8)
  })
})
