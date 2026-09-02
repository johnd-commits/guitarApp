import { describe, expect, it } from 'vitest'
import {
  anchorFingers,
  beatsUntilChange,
  chordById,
  chordIndexAtBar,
  progressionById,
  soundingName,
} from './library'

describe('chord follow-along', () => {
  it('walks G then C on successive bars', () => {
    const p = progressionById('g-c')
    expect(chordIndexAtBar(0, p).currentIndex).toBe(0)
    expect(chordIndexAtBar(0, p).nextIndex).toBe(1)
    expect(chordIndexAtBar(1, p).currentIndex).toBe(1)
    expect(chordIndexAtBar(2, p).currentIndex).toBe(0)
  })

  it('counts beats until the change, including the current fraction', () => {
    // 4/4, one bar per chord, beat 2 (0-based) halfway through → 1.5 beats left
    expect(beatsUntilChange(0, 2, 0.5, 4, 1)).toBeCloseTo(1.5, 8)
    expect(beatsUntilChange(0, 0, 0, 4, 1)).toBeCloseTo(4, 8)
  })

  it('names the sounding chord when a capo is on', () => {
    expect(soundingName('G', 0)).toBe('G')
    expect(soundingName('G', 2)).toBe('A')
    expect(soundingName('Am', 2)).toBe('Bm')
  })

  it('marks G-to-C as having no shared fretted finger', () => {
    expect(anchorFingers(chordById('G'), chordById('C'))).toHaveLength(0)
  })

  it('marks E-to-Em index finger leaving while 2 and 3 stay', () => {
    const anchors = anchorFingers(chordById('E'), chordById('Em'))
    expect(anchors.some((a) => a.string === 5 && a.fret === 2)).toBe(true)
    expect(anchors.some((a) => a.string === 4 && a.fret === 2)).toBe(true)
  })
})
