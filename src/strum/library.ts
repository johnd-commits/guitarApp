import { patternFromKinds, type StrumPattern } from './types'

const H = 'HIT' as const
const M = 'MISS' as const
const X = 'MUTE' as const

/**
 * Built-in patterns. Every even slot is a downstroke, every odd slot an
 * upstroke, including MISS and MUTE — the arm never has a hole in it.
 */
export const PATTERN_LIBRARY: StrumPattern[] = [
  patternFromKinds('all-downs', 'All downs', 'eighth', [H, M, H, M, H, M, H, M]),
  patternFromKinds('down-up', 'Down-up eighths', 'eighth', [H, H, H, H, H, H, H, H]),
  patternFromKinds('d-du-udu', 'D-DU-UDU', 'eighth', [H, M, H, H, M, H, H, H]),
  patternFromKinds('d-d-udu', 'D-D-UDU', 'eighth', [H, M, H, M, H, H, H, M]),
  patternFromKinds('reggae-chuck', 'Reggae off-beat chuck', 'eighth', [M, X, M, X, M, X, M, X]),
  patternFromKinds('one-drop-skank', 'One-drop skank', 'eighth', [M, M, H, M, M, M, H, M]),
]

export const DEFAULT_PATTERN_ID = 'd-du-udu'

export function patternById(id: string): StrumPattern {
  return PATTERN_LIBRARY.find((p) => p.id === id) ?? PATTERN_LIBRARY[0]
}
