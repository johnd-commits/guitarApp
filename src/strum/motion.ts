import { beatsPerBar, secondsPerBeat, slotDurationSeconds } from '../audio/timing'
import type { SchedulerConfig } from '../audio/timing'
import type { StrumPattern } from './types'

export function longFraction(swing: number): number {
  const amt = Math.min(100, Math.max(0, swing)) / 100
  return 0.5 + amt / 6
}

/**
 * Arm position inside one beat: +1 is fully down (on the beat), -1 is fully
 * up (on the swung off-beat). Cosine so the stroke eases into each end.
 */
export function pendulumNorm(phaseInBeat: number, swing: number): number {
  const long = longFraction(swing)
  const phase = ((phaseInBeat % 1) + 1) % 1
  if (phase < long) {
    const t = phase / long
    return Math.cos(t * Math.PI)
  }
  const t = (phase - long) / (1 - long)
  return Math.cos(Math.PI + t * Math.PI)
}

export function beatPhaseAt(elapsed: number, tempo: number): number {
  const beatLen = secondsPerBeat(tempo)
  if (elapsed < 0) return 0
  const beats = elapsed / beatLen
  return beats - Math.floor(beats)
}

/**
 * Which pattern slot is "now", using the same swing split as the metronome.
 * MISS slots still occupy time — the current index moves through them.
 */
export function currentPatternSlot(
  elapsed: number,
  pattern: StrumPattern,
  config: Pick<SchedulerConfig, 'tempo' | 'timeSignature' | 'swing'>,
): number {
  if (elapsed < 0 || pattern.slots.length === 0) return 0

  const bpb = beatsPerBar(config.timeSignature)
  const slotsPerBeat = pattern.resolution === 'eighth' ? 2 : 4
  const barSlots = bpb * slotsPerBeat
  const beatLen = secondsPerBeat(config.tempo)
  const barLen = beatLen * bpb
  const timeInBar = elapsed % barLen

  let t = 0
  for (let i = 0; i < barSlots; i++) {
    const slotInBeat = i % slotsPerBeat
    const duration = slotDurationSeconds(
      {
        tempo: config.tempo,
        timeSignature: '4/4',
        subdivision: pattern.resolution === 'eighth' ? 'eighth' : 'sixteenth',
        swing: config.swing,
      },
      slotInBeat,
    )
    if (timeInBar < t + duration) return i % pattern.slots.length
    t += duration
  }

  return (barSlots - 1) % pattern.slots.length
}
