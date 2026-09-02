/**
 * Concert A4 = 440 Hz is MIDI note 69.
 * Each semitone is a factor of 2^(1/12); cents are 1/100 of a semitone.
 */
export const A4_HZ = 440
export const A4_MIDI = 69

export function midiToFreq(midi: number): number {
  return A4_HZ * 2 ** ((midi - A4_MIDI) / 12)
}

/** Signed cents from `freq` to `target`. Negative means below the target. */
export function centsOff(freq: number, target: number): number {
  return 1200 * Math.log2(freq / target)
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export function midiNoteName(midi: number): string {
  const rounded = Math.round(midi)
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12]
  const octave = Math.floor(rounded / 12) - 1
  return `${name}${octave}`
}

export type TuningId = 'standard' | 'drop-d' | 'open-d' | 'open-g' | 'half-step'

export type Tuning = {
  id: TuningId
  name: string
  /** Open-string MIDI notes, low to high (6th string first). */
  midi: readonly [number, number, number, number, number, number]
}

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Standard', midi: [40, 45, 50, 55, 59, 64] },
  { id: 'drop-d', name: 'Drop D', midi: [38, 45, 50, 55, 59, 64] },
  { id: 'open-d', name: 'Open D', midi: [38, 45, 50, 54, 57, 62] },
  { id: 'open-g', name: 'Open G', midi: [38, 43, 50, 55, 59, 62] },
  { id: 'half-step', name: 'Half-step down', midi: [39, 44, 49, 54, 58, 63] },
]

export function tuningById(id: TuningId): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
}

export type StringTarget = {
  index: number
  midi: number
  frequency: number
  name: string
}

/**
 * Capo raises every sounding open-string pitch by one semitone per fret.
 * The shape names stay the same; the targets the tuner listens for move up.
 */
export function stringTargets(tuning: Tuning, capoFret: number): StringTarget[] {
  const capo = Math.min(12, Math.max(0, Math.round(capoFret)))
  return tuning.midi.map((midi, index) => {
    const shifted = midi + capo
    return {
      index,
      midi: shifted,
      frequency: midiToFreq(shifted),
      name: midiNoteName(shifted),
    }
  })
}

const STICK_CENTS = 40

/**
 * Pick which of the six strings is being played. Stay on the previous string
 * while the pitch is still nearer to it than STICK_CENTS, so a slightly sharp
 * G does not jump to B.
 */
export function detectString(
  frequency: number,
  targets: StringTarget[],
  previousIndex: number | null,
): number {
  let best = 0
  let bestAbs = Infinity
  for (const t of targets) {
    const abs = Math.abs(centsOff(frequency, t.frequency))
    if (abs < bestAbs) {
      bestAbs = abs
      best = t.index
    }
  }

  if (previousIndex === null) return best
  const current = targets[previousIndex]
  if (!current) return best
  const prevAbs = Math.abs(centsOff(frequency, current.frequency))
  if (prevAbs <= STICK_CENTS) return previousIndex
  return best
}
