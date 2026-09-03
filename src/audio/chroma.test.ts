import { describe, expect, it } from 'vitest'
import { matchChroma, stringPresence } from './chroma'

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

  it('flags a missing expected string as not present', () => {
    const chroma = fromClasses([4, 9, 2])
    const presence = stringPresence(chroma, [82.4, 110, 146.8, 196, 247, 330])
    expect(presence[0].present).toBe(true)
    expect(presence[3].present).toBe(false)
  })
})
