import { describe, expect, it } from 'vitest'
import type { ChordGuess } from '../audio/chroma'
import { canonicalChordName, shapeForGuess } from './heardShape'

function guess(name: string, quality: ChordGuess['quality']): ChordGuess {
  return { root: name.replace(/m$|7$|sus.*$/, '') || name, quality, name, confidence: 0.8 }
}

describe('heard chord shapes', () => {
  it('maps open-library names to the stored shape', () => {
    expect(shapeForGuess(guess('G', 'major'))?.id).toBe('G')
    expect(shapeForGuess(guess('Am', 'minor'))?.id).toBe('Am')
    expect(shapeForGuess(guess('E7', '7'))?.id).toBe('E7')
    expect(shapeForGuess(guess('Dsus2', 'sus2'))?.id).toBe('Dsus2')
  })

  it('uses the E-shape barre when there is no open diagram', () => {
    const shape = shapeForGuess(guess('F#', 'major'))
    expect(shape?.id).toBe('e-major-2')
    expect(shape?.name).toBe('F#')
  })

  it('leaves sevenths without a diagram if they are not in the open library', () => {
    expect(shapeForGuess(guess('F#7', '7'))).toBeNull()
  })

  it('treats flats as the matching sharp name', () => {
    expect(canonicalChordName('Gb')).toBe('F#')
    expect(canonicalChordName('Bbm')).toBe('A#m')
  })
})
