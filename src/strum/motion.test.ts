import { describe, expect, it } from 'vitest'
import { currentPatternSlot, longFraction, patternPlayhead, pendulumNorm } from './motion'
import { PATTERN_LIBRARY } from './library'
import { patternFromKinds } from './types'

describe('strum patterns', () => {
  it('treats MISS as a real slot, not a gap', () => {
    const allDowns = PATTERN_LIBRARY.find((p) => p.id === 'all-downs')
    expect(allDowns?.slots).toHaveLength(8)
    expect(allDowns?.slots.filter((s) => s.kind === 'MISS')).toHaveLength(4)
    expect(allDowns?.slots.every((s) => s.direction === 'DOWN' || s.direction === 'UP')).toBe(true)
    allDowns?.slots.forEach((s, i) => {
      expect(s.direction).toBe(i % 2 === 0 ? 'DOWN' : 'UP')
    })
  })
})

describe('pendulum motion', () => {
  it('is down on the beat and up on the off-beat', () => {
    expect(pendulumNorm(0, 0)).toBeCloseTo(1, 8)
    expect(pendulumNorm(0.5, 0)).toBeCloseTo(-1, 8)
    expect(pendulumNorm(1, 0)).toBeCloseTo(1, 8)
  })

  it('puts the upstroke at the triplet off-beat when swing is 100%', () => {
    const off = longFraction(100)
    expect(off).toBeCloseTo(2 / 3, 8)
    expect(pendulumNorm(off, 100)).toBeCloseTo(-1, 8)
    expect(pendulumNorm(0, 100)).toBeCloseTo(1, 8)
  })
})

describe('pattern slot cursor', () => {
  it('walks through MISS slots so the current index never skips', () => {
    const pattern = patternFromKinds('test', 'test', 'eighth', [
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
    expect(currentPatternSlot(0.0, pattern, config)).toBe(0)
    expect(currentPatternSlot(0.25, pattern, config)).toBe(0)
    expect(currentPatternSlot(0.5, pattern, config)).toBe(1)
    expect(currentPatternSlot(1.0, pattern, config)).toBe(2)
  })

  it('reports a continuous phase so the playhead can slide, not jump', () => {
    const pattern = patternFromKinds('test', 'test', 'eighth', [
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
    // 60 BPM, straight eighths → each slot is 0.5s.
    expect(patternPlayhead(0.0, pattern, config)).toEqual({ index: 0, phase: 0 })
    expect(patternPlayhead(0.25, pattern, config).index).toBe(0)
    expect(patternPlayhead(0.25, pattern, config).phase).toBeCloseTo(0.5, 8)
    expect(patternPlayhead(0.5, pattern, config).index).toBe(1)
    expect(patternPlayhead(0.5, pattern, config).phase).toBeCloseTo(0, 8)
  })
})
