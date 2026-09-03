import { describe, expect, it } from 'vitest'
import {
  chromaFocus,
  guessFromChroma,
  majorityGuess,
  matchChroma,
  stringPresence,
} from './chroma'

function fromClasses(classes: number[]): Float64Array {
  const chroma = new Float64Array(12)
  for (const pc of classes) chroma[pc] = 1
  return chroma
}

describe('chromagram matching', () => {
  it('names a C-E-G triad as C major', () => {
    const guess = matchChroma(fromClasses([0, 4, 7]))
    expect(guess?.name).toBe('C')
    expect(guess?.confidence).toBeGreaterThan(0.55)
  })

  it('names an A-C-E triad as Am', () => {
    const guess = matchChroma(fromClasses([9, 0, 4]))
    expect(guess?.name).toBe('Am')
  })

  it('names G-B-D as G and E7 as E7', () => {
    expect(matchChroma(fromClasses([7, 11, 2]))?.name).toBe('G')
    expect(matchChroma(fromClasses([4, 8, 11, 2]))?.name).toBe('E7')
  })

  it('names D-E-A as Dsus2', () => {
    expect(matchChroma(fromClasses([2, 4, 9]))?.name).toBe('Dsus2')
  })

  it('puts a triad near full focus and flat noise near 0.25', () => {
    expect(chromaFocus(fromClasses([0, 4, 7]))).toBeGreaterThan(0.99)
    const noise = new Float64Array(12)
    noise.fill(1)
    expect(chromaFocus(noise)).toBeCloseTo(0.25, 2)
  })

  it('ignores a triad when band energy is below the silence gate', () => {
    expect(guessFromChroma(fromClasses([0, 4, 7]), 2)).toBeNull()
    expect(guessFromChroma(fromClasses([0, 4, 7]), 40)?.name).toBe('C')
  })

  it('needs three votes of the same name before locking a guess', () => {
    const c = matchChroma(fromClasses([0, 4, 7]))
    const am = matchChroma(fromClasses([9, 0, 4]))
    expect(c).not.toBeNull()
    expect(am).not.toBeNull()
    expect(majorityGuess([c, c, null, am, am])).toBeNull()
    expect(majorityGuess([c, c, c, am, am])?.name).toBe('C')
  })

  it('flags a missing expected string as not present', () => {
    const chroma = fromClasses([4, 9, 2])
    const presence = stringPresence(chroma, [82.4, 110, 146.8, 196, 247, 330])
    expect(presence[0].present).toBe(true)
    expect(presence[3].present).toBe(false)
  })
})
