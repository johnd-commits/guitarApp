import { BARRE_LIBRARY } from './barre'
import { CHORD_LIBRARY, parseRoot, type ChordShape } from './library'
import type { ChordGuess } from '../audio/chroma'

const FLATS: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
}

export function canonicalChordName(name: string): string {
  for (const [flat, sharp] of Object.entries(FLATS)) {
    if (name.startsWith(flat)) return `${sharp}${name.slice(flat.length)}`
  }
  const { root, rest } = parseRoot(name)
  return `${root}${rest}`
}

/**
 * Open shape first (the ones already in the hands), then the E-shape barre
 * for major/minor. Sevenths and sus only map when the library has them.
 */
export function shapeForGuess(guess: ChordGuess): ChordShape | null {
  const want = canonicalChordName(guess.name)
  const open = CHORD_LIBRARY.find((c) => canonicalChordName(c.name) === want)
  if (open) return open
  if (guess.quality !== 'major' && guess.quality !== 'minor') return null
  return (
    BARRE_LIBRARY.find(
      (c) => c.id.startsWith('e-') && canonicalChordName(c.name) === want,
    ) ?? null
  )
}
