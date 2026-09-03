import { describe, expect, it } from 'vitest'
import { aShapeBarre, capoForKey, eShapeBarre, generateBarres } from './barre'
import { chordById } from './library'
import { travelDots, travelPhase } from './travel'

describe('barre generation', () => {
  it('names the E-shape at fret 1 as F and fret 3 as G', () => {
    expect(eShapeBarre(1, 'major').name).toBe('F')
    expect(eShapeBarre(3, 'major').name).toBe('G')
    expect(eShapeBarre(1, 'minor').name).toBe('Fm')
  })

  it('names the A-shape at fret 2 as B', () => {
    expect(aShapeBarre(2, 'major').name).toBe('B')
  })

  it('builds 48 barre shapes (E/A × major/minor × 12 frets)', () => {
    expect(generateBarres()).toHaveLength(48)
  })
})

describe('capo helper', () => {
  it('puts a G shape at fret 2 to sound as A', () => {
    const hits = capoForKey('A', ['G', 'C', 'D'])
    const g = hits.find((h) => h.shape === 'G')
    expect(g?.capo).toBe(2)
    expect(g?.sounding).toBe('A')
  })
})

describe('finger travel', () => {
  it('keeps D-to-Dm ring finger on the B string and moves the index', () => {
    const mid = travelDots(chordById('D'), chordById('Dm'), 0.5)
    const ring = mid.find((d) => d.finger === 3)
    expect(ring?.string).toBe(2)
    expect(ring?.fret).toBe(3)
  })

  it('starts travel only inside the slow-mo window', () => {
    expect(travelPhase(4, 1)).toBe(0)
    expect(travelPhase(0.5, 1)).toBeCloseTo(0.5, 8)
    expect(travelPhase(0, 1)).toBe(1)
  })
})
