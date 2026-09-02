export type StrumDirection = 'DOWN' | 'UP'
export type StrumKind = 'HIT' | 'MISS' | 'MUTE'
export type PatternResolution = 'eighth' | 'sixteenth'

/**
 * One slot in a strum pattern. MISS is first-class: the arm still travels
 * that direction, the strings are not struck. MUTE is a percussive chuck.
 * Direction is stored on every slot so a rest is never an absence.
 */
export type StrumSlot = {
  direction: StrumDirection
  kind: StrumKind
  accent: boolean
}

export type StrumPattern = {
  id: string
  name: string
  resolution: PatternResolution
  slots: StrumSlot[]
}

export function directionForIndex(
  index: number,
  _resolution: PatternResolution,
): StrumDirection {
  return index % 2 === 0 ? 'DOWN' : 'UP'
}

export function slot(
  index: number,
  resolution: PatternResolution,
  kind: StrumKind,
  accent = false,
): StrumSlot {
  return { direction: directionForIndex(index, resolution), kind, accent }
}

export function patternFromKinds(
  id: string,
  name: string,
  resolution: PatternResolution,
  kinds: StrumKind[],
  accents: number[] = [],
): StrumPattern {
  return {
    id,
    name,
    resolution,
    slots: kinds.map((kind, i) => slot(i, resolution, kind, accents.includes(i))),
  }
}

export function cycleSlotKind(current: StrumKind): StrumKind {
  if (current === 'HIT') return 'MISS'
  if (current === 'MISS') return 'MUTE'
  return 'HIT'
}
