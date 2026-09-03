import { BARRE_LIBRARY } from './barre'
import { CHORD_LIBRARY, chordById as openById, type ChordShape } from './library'

export function allChords(): ChordShape[] {
  return [...CHORD_LIBRARY, ...BARRE_LIBRARY]
}

export function findChord(id: string): ChordShape {
  return (
    CHORD_LIBRARY.find((c) => c.id === id) ??
    BARRE_LIBRARY.find((c) => c.id === id) ??
    openById(id)
  )
}
