/**
 * Open-position shapes. String 1 is high E (the thin string), string 6 is
 * low E — the same numbering svguitar and most chord boxes use.
 * fret 0 = open, 'x' = do not play. Finger numbers 1–4 sit in the dots.
 */
export type ChordFinger = {
  string: 1 | 2 | 3 | 4 | 5 | 6
  fret: number | 'x'
  finger?: 1 | 2 | 3 | 4
}

export type ChordBarre = {
  fromString: number
  toString: number
  fret: number
  finger: 1 | 2 | 3 | 4
}

export type ChordShape = {
  id: string
  name: string
  fingers: ChordFinger[]
  barres?: ChordBarre[]
  position: number
}

export function shape(
  id: string,
  name: string,
  fingers: ChordFinger[],
  barres: ChordBarre[] = [],
  position = 1,
): ChordShape {
  return { id, name, fingers, barres, position }
}

export const CHORD_LIBRARY: ChordShape[] = [
  shape('G', 'G', [
    { string: 6, fret: 3, finger: 3 },
    { string: 5, fret: 2, finger: 2 },
    { string: 4, fret: 0 },
    { string: 3, fret: 0 },
    { string: 2, fret: 0 },
    { string: 1, fret: 3, finger: 4 },
  ]),
  shape('C', 'C', [
    { string: 6, fret: 'x' },
    { string: 5, fret: 3, finger: 3 },
    { string: 4, fret: 2, finger: 2 },
    { string: 3, fret: 0 },
    { string: 2, fret: 1, finger: 1 },
    { string: 1, fret: 0 },
  ]),
  shape('D', 'D', [
    { string: 6, fret: 'x' },
    { string: 5, fret: 'x' },
    { string: 4, fret: 0 },
    { string: 3, fret: 2, finger: 1 },
    { string: 2, fret: 3, finger: 3 },
    { string: 1, fret: 2, finger: 2 },
  ]),
  shape('Em', 'Em', [
    { string: 6, fret: 0 },
    { string: 5, fret: 2, finger: 2 },
    { string: 4, fret: 2, finger: 3 },
    { string: 3, fret: 0 },
    { string: 2, fret: 0 },
    { string: 1, fret: 0 },
  ]),
  shape('Am', 'Am', [
    { string: 6, fret: 'x' },
    { string: 5, fret: 0 },
    { string: 4, fret: 2, finger: 2 },
    { string: 3, fret: 2, finger: 3 },
    { string: 2, fret: 1, finger: 1 },
    { string: 1, fret: 0 },
  ]),
  shape('F', 'F', [
    { string: 3, fret: 2, finger: 2 },
    { string: 4, fret: 3, finger: 4 },
    { string: 5, fret: 3, finger: 3 },
  ], [{ fromString: 6, toString: 1, fret: 1, finger: 1 }]),
  shape('A', 'A', [
    { string: 6, fret: 'x' },
    { string: 5, fret: 0 },
    { string: 4, fret: 2, finger: 1 },
    { string: 3, fret: 2, finger: 2 },
    { string: 2, fret: 2, finger: 3 },
    { string: 1, fret: 0 },
  ]),
  shape('E', 'E', [
    { string: 6, fret: 0 },
    { string: 5, fret: 2, finger: 2 },
    { string: 4, fret: 2, finger: 3 },
    { string: 3, fret: 1, finger: 1 },
    { string: 2, fret: 0 },
    { string: 1, fret: 0 },
  ]),
  shape('Dm', 'Dm', [
    { string: 6, fret: 'x' },
    { string: 5, fret: 'x' },
    { string: 4, fret: 0 },
    { string: 3, fret: 2, finger: 2 },
    { string: 2, fret: 3, finger: 3 },
    { string: 1, fret: 1, finger: 1 },
  ]),
]

export function chordById(id: string): ChordShape {
  return CHORD_LIBRARY.find((c) => c.id === id) ?? CHORD_LIBRARY[0]
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function parseRoot(name: string): { root: string; rest: string } {
  if (name.startsWith('C#') || name.startsWith('D#') || name.startsWith('F#') || name.startsWith('G#') || name.startsWith('A#')) {
    return { root: name.slice(0, 2), rest: name.slice(2) }
  }
  return { root: name.slice(0, 1), rest: name.slice(1) }
}

/** Capo raises the sounding pitch; the hands still make the same shape. */
export function soundingName(shapeName: string, capoFret: number): string {
  const capo = Math.min(12, Math.max(0, Math.round(capoFret)))
  if (capo === 0) return shapeName
  const { root, rest } = parseRoot(shapeName)
  const idx = NOTES.indexOf(root)
  if (idx < 0) return shapeName
  return `${NOTES[(idx + capo) % 12]}${rest}`
}

export type ChordProgression = {
  id: string
  name: string
  chordIds: string[]
  barsPerChord: number
}

export const PROGRESSIONS: ChordProgression[] = [
  { id: 'd-dm', name: 'D – Dm', chordIds: ['D', 'Dm'], barsPerChord: 1 },
  { id: 'g-c', name: 'G – C', chordIds: ['G', 'C'], barsPerChord: 1 },
  { id: 'g-c-d-em', name: 'G – C – D – Em', chordIds: ['G', 'C', 'D', 'Em'], barsPerChord: 1 },
  { id: 'am-g-f-c', name: 'Am – G – F – C', chordIds: ['Am', 'G', 'F', 'C'], barsPerChord: 1 },
  { id: 'd-a-g', name: 'D – A – G', chordIds: ['D', 'A', 'G'], barsPerChord: 1 },
]

export const DEFAULT_PROGRESSION_ID = 'd-dm'

export function progressionById(id: string): ChordProgression {
  return PROGRESSIONS.find((p) => p.id === id) ?? PROGRESSIONS[0]
}

/**
 * Which chord is sounding on this song bar (count-in already stripped).
 */
export function chordIndexAtBar(songBar: number, progression: ChordProgression): {
  currentIndex: number
  nextIndex: number
} {
  const hold = Math.max(1, progression.barsPerChord)
  const len = progression.chordIds.length
  const currentIndex = Math.floor((((songBar % (len * hold)) + len * hold) % (len * hold)) / hold)
  return { currentIndex, nextIndex: (currentIndex + 1) % len }
}

/**
 * Beats remaining until the next chord, including the fractional current beat.
 * Last beat of the hold is when the upcoming neck should take over visually.
 */
export function beatsUntilChange(
  songBar: number,
  beat: number,
  beatPhase: number,
  beatsPerBar: number,
  barsPerChord: number,
): number {
  const hold = Math.max(1, barsPerChord)
  const barInHold = ((songBar % hold) + hold) % hold
  const barsLeftAfterThis = hold - 1 - barInHold
  const beatsLeftInBar = beatsPerBar - beat - beatPhase
  return barsLeftAfterThis * beatsPerBar + beatsLeftInBar
}

export type FrettedNote = { string: number; fret: number; finger: number }

export function frettedNotes(chord: ChordShape): FrettedNote[] {
  const fromBarres: FrettedNote[] = (chord.barres ?? []).map((b) => ({
    string: b.fromString,
    fret: b.fret,
    finger: b.finger,
  }))
  const fromFingers = chord.fingers
    .filter((f): f is ChordFinger & { fret: number; finger: number } =>
      f.fret !== 'x' && f.fret !== 0 && f.finger !== undefined,
    )
    .map((f) => ({ string: f.string, fret: f.fret, finger: f.finger }))
  return [...fromBarres, ...fromFingers]
}

/** Fingers that stay on the same string and fret through a change. */
export function anchorFingers(from: ChordShape, to: ChordShape): FrettedNote[] {
  const next = frettedNotes(to)
  return frettedNotes(from).filter((a) =>
    next.some((b) => b.string === a.string && b.fret === a.fret),
  )
}
