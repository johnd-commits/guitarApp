/**
 * Chromagram: fold FFT magnitudes into 12 pitch classes.
 * Bin frequency f maps to MIDI note 69 + 12*log2(f/440), then class = midi % 12.
 * A ~200ms stack of hops is enough for an open chord to settle.
 */

export const CHROMA_CLASSES = 12
export const CHROMA_WINDOW_SECONDS = 0.2

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type ChordQuality = 'major' | 'minor' | '7' | 'm7' | 'sus2' | 'sus4'

export type ChordGuess = {
  root: string
  quality: ChordQuality
  name: string
  confidence: number
}

const TEMPLATES: Array<{ quality: ChordQuality; pattern: number[] }> = [
  { quality: 'major', pattern: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0] },
  { quality: 'minor', pattern: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0] },
  { quality: '7', pattern: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0] },
  { quality: 'm7', pattern: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0] },
  { quality: 'sus2', pattern: [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0] },
  { quality: 'sus4', pattern: [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0] },
]

export function freqToPitchClass(freq: number): number | null {
  if (freq < 40 || freq > 5000) return null
  const midi = 69 + 12 * Math.log2(freq / 440)
  const pc = ((Math.round(midi) % 12) + 12) % 12
  return pc
}

export function chromaFromMagnitudes(
  mags: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
): Float64Array {
  const chroma = new Float64Array(CHROMA_CLASSES)
  const bins = Math.min(mags.length, Math.floor(fftSize / 2))
  for (let k = 1; k < bins; k++) {
    const freq = (k * sampleRate) / fftSize
    const pc = freqToPitchClass(freq)
    if (pc === null) continue
    chroma[pc] += mags[k]
  }
  return normalize(chroma)
}

function normalize(chroma: Float64Array): Float64Array {
  let mag = 0
  for (let i = 0; i < 12; i++) mag += chroma[i] * chroma[i]
  mag = Math.sqrt(mag)
  if (mag < 1e-9) return chroma
  const out = new Float64Array(12)
  for (let i = 0; i < 12; i++) out[i] = chroma[i] / mag
  return out
}

export function rotate(chroma: ArrayLike<number>, steps: number): Float64Array {
  const out = new Float64Array(12)
  const s = ((steps % 12) + 12) % 12
  for (let i = 0; i < 12; i++) out[i] = chroma[(i + s) % 12]
  return out
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < 12; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na < 1e-12 || nb < 1e-12) return 0
  return dot / Math.sqrt(na * nb)
}

export function matchChroma(chroma: ArrayLike<number>): ChordGuess | null {
  let best: ChordGuess | null = null
  for (let root = 0; root < 12; root++) {
    const rotated = rotate(chroma, root)
    for (const template of TEMPLATES) {
      const score = cosine(rotated, template.pattern)
      if (!best || score > best.confidence) {
        const quality = template.quality
        const name =
          quality === 'major'
            ? NOTE_NAMES[root]
            : quality === 'minor'
              ? `${NOTE_NAMES[root]}m`
              : `${NOTE_NAMES[root]}${quality}`
        best = { root: NOTE_NAMES[root], quality, name, confidence: score }
      }
    }
  }
  if (!best || best.confidence < 0.55) return null
  return best
}

/** Energy per expected string pitch-class, for "check my chord". */
export function stringPresence(
  chroma: ArrayLike<number>,
  expectedFreqs: number[],
): Array<{ frequency: number; pitchClass: number; energy: number; present: boolean }> {
  let peak = 1e-9
  for (let i = 0; i < 12; i++) peak = Math.max(peak, chroma[i] ?? 0)
  return expectedFreqs.map((frequency) => {
    const pc = freqToPitchClass(frequency)
    const energy = pc === null ? 0 : chroma[pc] ?? 0
    return {
      frequency,
      pitchClass: pc ?? -1,
      energy,
      present: pc !== null && energy > peak * 0.18,
    }
  })
}

export function addChroma(into: Float64Array, add: ArrayLike<number>) {
  for (let i = 0; i < 12; i++) into[i] += add[i]
}
