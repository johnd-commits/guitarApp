export type TimeSignature = '4/4' | '3/4' | '12/8'
export type Subdivision = 'quarter' | 'eighth' | 'sixteenth'

export type BeatFlags = {
  muted: boolean
  accent: boolean
}

export type SchedulerConfig = {
  tempo: number
  timeSignature: TimeSignature
  subdivision: Subdivision
  /** 0 = straight, 100 = triplet swing (2:1 long to short eighths). */
  swing: number
  beats: BeatFlags[]
  countInBars: 0 | 1 | 2
  metronomeEnabled: boolean
}

export type GridCursor = {
  time: number
  bar: number
  beat: number
  slot: number
}

export type PlannedClick = {
  time: number
  bar: number
  beat: number
  slot: number
  audible: boolean
  accent: boolean
  isDownbeat: boolean
}

export function beatsPerBar(signature: TimeSignature): number {
  return signature === '3/4' ? 3 : 4
}

export function defaultBeats(signature: TimeSignature): BeatFlags[] {
  return Array.from({ length: beatsPerBar(signature) }, (_, i) => ({
    muted: false,
    accent: i === 0,
  }))
}

/**
 * How many subdivision slots sit inside one beat.
 * 12/8 is counted as four dotted-quarter beats; eighths split each beat
 * into the three written eighths, sixteenths into six.
 */
export function slotsPerBeat(
  subdivision: Subdivision,
  signature: TimeSignature,
): number {
  if (signature === '12/8') {
    if (subdivision === 'quarter') return 1
    if (subdivision === 'eighth') return 3
    return 6
  }
  if (subdivision === 'quarter') return 1
  if (subdivision === 'eighth') return 2
  return 4
}

export function secondsPerBeat(tempo: number): number {
  return 60 / tempo
}

/**
 * Length of one subdivision slot in seconds.
 *
 * Swing only applies to 4/4 and 3/4. It stretches the on-beat eighth and
 * compresses the off-beat eighth so that at 100% the two durations are in
 * a 2:1 ratio — the same split as a quarter-note triplet.
 *
 * Sixteenths inherit that eighth split: the first two sixteenths share the
 * long half equally, the last two share the short half. 12/8 is already a
 * triplet grid, so swing is ignored.
 */
export function slotDurationSeconds(
  config: Pick<SchedulerConfig, 'tempo' | 'timeSignature' | 'subdivision' | 'swing'>,
  slotInBeat: number,
): number {
  const beatLen = secondsPerBeat(config.tempo)
  const slots = slotsPerBeat(config.subdivision, config.timeSignature)

  if (config.timeSignature === '12/8' || slots === 1) {
    return beatLen / slots
  }

  const swingAmt = Math.min(100, Math.max(0, config.swing)) / 100
  // 0% → 0.5 / 0.5 of the beat; 100% → 2/3 / 1/3.
  const longFrac = 0.5 + swingAmt / 6
  const shortFrac = 0.5 - swingAmt / 6

  if (slots === 2) {
    return (slotInBeat % 2 === 0 ? longFrac : shortFrac) * beatLen
  }

  return (slotInBeat < 2 ? longFrac : shortFrac) * beatLen / 2
}

export function describeClick(
  cursor: GridCursor,
  config: SchedulerConfig,
): PlannedClick {
  const flags = config.beats[cursor.beat] ?? { muted: false, accent: false }
  const inCountIn = cursor.bar < config.countInBars
  const audible = config.metronomeEnabled && (inCountIn || !flags.muted)

  return {
    time: cursor.time,
    bar: cursor.bar,
    beat: cursor.beat,
    slot: cursor.slot,
    audible,
    accent: flags.accent,
    isDownbeat: cursor.beat === 0 && cursor.slot === 0,
  }
}

export function advanceCursor(
  cursor: GridCursor,
  config: SchedulerConfig,
): GridCursor {
  const dt = slotDurationSeconds(config, cursor.slot)
  const spb = slotsPerBeat(config.subdivision, config.timeSignature)
  const bpb = beatsPerBar(config.timeSignature)

  let { bar, beat, slot } = cursor
  slot += 1
  if (slot >= spb) {
    slot = 0
    beat += 1
    if (beat >= bpb) {
      beat = 0
      bar += 1
    }
  }

  return { time: cursor.time + dt, bar, beat, slot }
}

export function planClicks(
  config: SchedulerConfig,
  beatCount: number,
  startTime = 0,
): PlannedClick[] {
  const clicks: PlannedClick[] = []
  let cursor: GridCursor = { time: startTime, bar: 0, beat: 0, slot: 0 }
  const spb = slotsPerBeat(config.subdivision, config.timeSignature)
  const slotCount = beatCount * spb

  for (let i = 0; i < slotCount; i++) {
    clicks.push(describeClick(cursor, config))
    cursor = advanceCursor(cursor, config)
  }

  return clicks
}
