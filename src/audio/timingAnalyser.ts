import type { StrumPattern } from '../strum/types'
import { beatsPerBar, slotDurationSeconds, type SchedulerConfig } from './timing'

export type ExpectedSlot = {
  time: number
  direction: 'DOWN' | 'UP'
  kind: 'HIT' | 'MISS' | 'MUTE'
  bar: number
  slot: number
}

export type OnsetHit = {
  time: number
  energy: number
  slotIndex: number | null
  offsetMs: number | null
  direction: 'DOWN' | 'UP' | null
}

export type TimingReport = {
  hits: OnsetHit[]
  meanOffsetMs: number | null
  offsetStdevMs: number | null
  meanOffsetDownMs: number | null
  meanOffsetUpMs: number | null
  stdevDownMs: number | null
  stdevUpMs: number | null
  expectedHits: number
  hitsLanded: number
  missed: number
  extra: number
  /** Milliseconds of offset gained per second of playing. Negative = rushing. */
  driftSlopeMsPerSec: number | null
}

const DEFAULT_WINDOW_MS = 150

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdev(values: number[]): number | null {
  if (values.length < 2) return null
  const m = mean(values)
  if (m === null) return null
  const sq = values.reduce((a, v) => a + (v - m) ** 2, 0)
  return Math.sqrt(sq / (values.length - 1))
}

/**
 * Ordinary least-squares slope of offset (ms) against elapsed seconds.
 * Distinguishes "started late and stayed there" (slope ~0) from
 * "gradually sped up" (negative slope).
 */
export function linearSlope(xs: number[], ys: number[]): number | null {
  if (xs.length < 2 || xs.length !== ys.length) return null
  const n = xs.length
  const mx = mean(xs)
  const my = mean(ys)
  if (mx === null || my === null) return null
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx
    num += dx * (ys[i] - my)
    den += dx * dx
  }
  if (den === 0) return 0
  return num / den
}

export function expectedSlotsFromPattern(
  originTime: number,
  bars: number,
  pattern: StrumPattern,
  config: Pick<SchedulerConfig, 'tempo' | 'timeSignature' | 'swing'>,
): ExpectedSlot[] {
  const bpb = beatsPerBar(config.timeSignature)
  const slotsPerBeat = pattern.resolution === 'eighth' ? 2 : 4
  const barSlots = bpb * slotsPerBeat
  const out: ExpectedSlot[] = []
  let t = originTime
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < barSlots; i++) {
      const slot = pattern.slots[i % pattern.slots.length]
      out.push({
        time: t,
        direction: slot.direction,
        kind: slot.kind,
        bar,
        slot: i % pattern.slots.length,
      })
      t += slotDurationSeconds(
        {
          tempo: config.tempo,
          timeSignature: '4/4',
          subdivision: pattern.resolution === 'eighth' ? 'eighth' : 'sixteenth',
          swing: config.swing,
        },
        i % slotsPerBeat,
      )
    }
  }
  return out
}

/**
 * Pair each onset with the nearest unmatched HIT/MUTE slot inside the
 * assign window. MISS slots are never targets — the arm moved, no strike.
 * Offset is onset minus slot: negative means early.
 */
export function analyseTiming(
  onsets: Array<{ time: number; energy: number }>,
  slots: ExpectedSlot[],
  latencySeconds: number,
  assignWindowMs = DEFAULT_WINDOW_MS,
): TimingReport {
  const windowS = assignWindowMs / 1000
  const targets = slots
    .map((slot, index) => ({ slot, index }))
    .filter((item) => item.slot.kind === 'HIT' || item.slot.kind === 'MUTE')
  const used = new Set<number>()
  const hits: OnsetHit[] = []

  const corrected = onsets
    .map((o) => ({ time: o.time - latencySeconds, energy: o.energy }))
    .sort((a, b) => a.time - b.time)

  for (const onset of corrected) {
    let best: { index: number; dist: number } | null = null
    for (const target of targets) {
      if (used.has(target.index)) continue
      const dist = Math.abs(onset.time - target.slot.time)
      if (dist > windowS) continue
      if (!best || dist < best.dist) best = { index: target.index, dist }
    }
    if (!best) {
      hits.push({
        time: onset.time,
        energy: onset.energy,
        slotIndex: null,
        offsetMs: null,
        direction: null,
      })
      continue
    }
    used.add(best.index)
    const slot = slots[best.index]
    hits.push({
      time: onset.time,
      energy: onset.energy,
      slotIndex: best.index,
      offsetMs: (onset.time - slot.time) * 1000,
      direction: slot.direction,
    })
  }

  const assigned = hits.filter((h) => h.offsetMs !== null) as Array<OnsetHit & { offsetMs: number; direction: 'DOWN' | 'UP' }>
  const extras = hits.filter((h) => h.slotIndex === null)
  const down = assigned.filter((h) => h.direction === 'DOWN').map((h) => h.offsetMs)
  const up = assigned.filter((h) => h.direction === 'UP').map((h) => h.offsetMs)
  const all = assigned.map((h) => h.offsetMs)
  const times = assigned.map((h) => h.time - (slots[0]?.time ?? 0))

  return {
    hits,
    meanOffsetMs: mean(all),
    offsetStdevMs: stdev(all),
    meanOffsetDownMs: mean(down),
    meanOffsetUpMs: mean(up),
    stdevDownMs: stdev(down),
    stdevUpMs: stdev(up),
    expectedHits: targets.length,
    hitsLanded: assigned.length,
    missed: targets.length - assigned.length,
    extra: extras.length,
    driftSlopeMsPerSec: linearSlope(times, all),
  }
}
