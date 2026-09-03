import type { PlannedClick } from './timing'

export type BackingStyle = 'straight-rock' | 'shuffle-blues' | 'one-drop' | 'folk'

export type BackingPart = 'kick' | 'snare' | 'hat' | 'bass'

export type BackingHit = {
  part: BackingPart
  time: number
  bar: number
  beat: number
}

const BLUES_12 = ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'] as const

export function bluesDegree(bar: number): (typeof BLUES_12)[number] {
  return BLUES_12[((bar % 12) + 12) % 12]
}

/**
 * Which parts fire on this grid click. Guitar is never voiced here —
 * the user is the guitar. Hats on off-beats use slot > 0.
 */
export function hitsForClick(
  click: Pick<PlannedClick, 'bar' | 'beat' | 'slot' | 'time'>,
  style: BackingStyle,
): BackingHit[] {
  const hits: BackingHit[] = []
  const onBeat = click.slot === 0
  const off = click.slot === 1
  const push = (part: BackingPart) => {
    hits.push({ part, time: click.time, bar: click.bar, beat: click.beat })
  }

  if (style === 'straight-rock' || style === 'shuffle-blues') {
    if (onBeat && (click.beat === 0 || click.beat === 2)) push('kick')
    if (onBeat && (click.beat === 1 || click.beat === 3)) push('snare')
    if (onBeat || off) push('hat')
    if (onBeat && click.beat === 0) push('bass')
  } else if (style === 'one-drop') {
    if (onBeat && click.beat === 2) {
      push('kick')
      push('snare')
    }
    if (off) push('hat')
  } else if (style === 'folk') {
    if (onBeat && click.beat === 0) push('kick')
    if (onBeat && click.beat === 2) push('snare')
    if (onBeat) push('hat')
    if (onBeat && click.beat === 0) push('bass')
  }
  return hits
}

export function rootHz(degree: (typeof BLUES_12)[number], tonicHz = 110): number {
  const semitones = degree === 'I' ? 0 : degree === 'IV' ? 5 : 7
  return tonicHz * Math.pow(2, semitones / 12)
}
