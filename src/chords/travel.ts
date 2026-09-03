import type { ChordShape } from './library'
import { frettedNotes } from './library'

export type TravelDot = {
  finger: number
  string: number
  fret: number
  opacity: number
}

/**
 * Interpolate each numbered finger from the current shape to the next.
 * t=0 is the current chord, t=1 is the destination. Unmatched fingers
 * fade rather than leaping to a random string.
 */
export function travelDots(from: ChordShape, to: ChordShape, t: number): TravelDot[] {
  const a = clamp01(t)
  const start = frettedNotes(from)
  const end = frettedNotes(to)
  const fingers = new Set([...start, ...end].map((n) => n.finger))
  const dots: TravelDot[] = []
  for (const finger of fingers) {
    const s = start.find((n) => n.finger === finger)
    const e = end.find((n) => n.finger === finger)
    if (s && e) {
      dots.push({
        finger,
        string: lerp(s.string, e.string, a),
        fret: lerp(s.fret, e.fret, a),
        opacity: 1,
      })
    } else if (s && !e) {
      dots.push({ ...s, opacity: 1 - a })
    } else if (e && !s) {
      dots.push({ ...e, opacity: a })
    }
  }
  return dots
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

export function travelPhase(
  beatsUntil: number,
  windowBeats: number,
): number {
  if (windowBeats <= 0) return 1
  if (beatsUntil >= windowBeats) return 0
  if (beatsUntil <= 0) return 1
  return 1 - beatsUntil / windowBeats
}
