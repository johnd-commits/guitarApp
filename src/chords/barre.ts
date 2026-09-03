import { Interval, Note } from 'tonal'
import { parseRoot, soundingName, type ChordShape } from './library'
import { shape } from './library'

export function transposeRoot(root: string, semitones: number): string {
  return Note.simplify(Note.transpose(root, Interval.fromSemitones(semitones)))
}

/**
 * E-shape barre: the open E you already know, index finger as a capo.
 * Fret 1 is F, fret 3 is G, and so on up to fret 12.
 */
export function eShapeBarre(fret: number, quality: 'major' | 'minor'): ChordShape {
  const f = Math.min(12, Math.max(1, Math.round(fret)))
  const root = transposeRoot('E', f)
  const name = quality === 'minor' ? `${root}m` : root
  const id = `e-${quality}-${f}`
  if (quality === 'minor') {
    return shape(id, name, [
      { string: 5, fret: f + 2, finger: 3 },
      { string: 4, fret: f + 2, finger: 4 },
    ], [{ fromString: 6, toString: 1, fret: f, finger: 1 }], f)
  }
  return shape(id, name, [
    { string: 5, fret: f + 2, finger: 3 },
    { string: 4, fret: f + 2, finger: 4 },
    { string: 3, fret: f + 1, finger: 2 },
  ], [{ fromString: 6, toString: 1, fret: f, finger: 1 }], f)
}

/**
 * A-shape barre: open A moved up. Low E is muted; index covers 1–5.
 */
export function aShapeBarre(fret: number, quality: 'major' | 'minor'): ChordShape {
  const f = Math.min(12, Math.max(1, Math.round(fret)))
  const root = transposeRoot('A', f)
  const name = quality === 'minor' ? `${root}m` : root
  const id = `a-${quality}-${f}`
  if (quality === 'minor') {
    return shape(id, name, [
      { string: 6, fret: 'x' },
      { string: 4, fret: f + 2, finger: 3 },
      { string: 3, fret: f + 2, finger: 4 },
      { string: 2, fret: f + 1, finger: 2 },
    ], [{ fromString: 5, toString: 1, fret: f, finger: 1 }], f)
  }
  return shape(id, name, [
    { string: 6, fret: 'x' },
    { string: 4, fret: f + 2, finger: 2 },
    { string: 3, fret: f + 2, finger: 3 },
    { string: 2, fret: f + 2, finger: 4 },
  ], [{ fromString: 5, toString: 1, fret: f, finger: 1 }], f)
}

export function generateBarres(): ChordShape[] {
  const out: ChordShape[] = []
  for (let fret = 1; fret <= 12; fret++) {
    out.push(eShapeBarre(fret, 'major'))
    out.push(eShapeBarre(fret, 'minor'))
    out.push(aShapeBarre(fret, 'major'))
    out.push(aShapeBarre(fret, 'minor'))
  }
  return out
}

export const BARRE_LIBRARY: ChordShape[] = generateBarres()

/**
 * Given a sounding key and the open shapes the hands already know,
 * list capo frets that make those shapes sound in that key.
 */
export function capoForKey(
  soundingNameTarget: string,
  preferredShapes: string[],
): Array<{ capo: number; shape: string; sounding: string }> {
  const target = parseRoot(soundingNameTarget)
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const want = notes.indexOf(target.root)
  if (want < 0) return []
  return preferredShapes.map((shapeName) => {
    const parsed = parseRoot(shapeName)
    const idx = notes.indexOf(parsed.root)
    const capo = idx < 0 ? 0 : (want - idx + 12) % 12
    return { capo, shape: shapeName, sounding: soundingName(shapeName, capo) }
  }).sort((a, b) => a.capo - b.capo)
}
