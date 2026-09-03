import type { AttemptMetrics } from './fromAttempt'

export type AttemptRecord = {
  id: string
  userId: string
  lessonId: string
  stepId: string
  startedAt: string
  durationSeconds: number
  tempoBpm: number
  patternId: string
  chords: string[]
  metrics: AttemptMetrics
  note?: string
}

export type Observation = {
  text: string
  salience: number
}

function num(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function personalBestTempo(attempt: AttemptRecord, history: AttemptRecord[]): Observation | null {
  const prior = history.filter(
    (h) => h.patternId === attempt.patternId && h.id !== attempt.id && num(h.metrics.offsetStdev),
  )
  if (!num(attempt.metrics.offsetStdev) || prior.length === 0) return null
  const bestPrior = prior.reduce((a, b) =>
    (a.metrics.offsetStdev ?? Infinity) <= (b.metrics.offsetStdev ?? Infinity) ? a : b,
  )
  if ((attempt.metrics.offsetStdev ?? Infinity) > (bestPrior.metrics.offsetStdev ?? Infinity)) return null
  if (attempt.tempoBpm <= bestPrior.tempoBpm) return null
  return {
    text: `Steadiest you've played this at ${attempt.tempoBpm} BPM. Previous best was ${bestPrior.tempoBpm}.`,
    salience: 8,
  }
}

export function steadinessTrend(attempt: AttemptRecord, history: AttemptRecord[]): Observation | null {
  const series = [...history.filter((h) => h.patternId === attempt.patternId), attempt]
    .filter((h) => num(h.metrics.offsetStdev))
    .slice(-6)
  if (series.length < 3) return null
  const first = series[0].metrics.offsetStdev as number
  const last = series[series.length - 1].metrics.offsetStdev as number
  if (Math.abs(first - last) < 5) return null
  return {
    text: `Your timing spread on this pattern has ${last < first ? 'come down' : 'gone up'} from ${Math.round(first)}ms to ${Math.round(last)}ms over ${series.length} sessions.`,
    salience: last < first ? 7 : 9,
  }
}

export function systematicVsScattered(attempt: AttemptRecord): Observation | null {
  const mean = attempt.metrics.meanOffset
  const stdev = attempt.metrics.offsetStdev
  if (!num(mean) || !num(stdev)) return null
  if (Math.abs(mean) >= 30 && stdev <= 25) {
    const side = mean < 0 ? 'ahead' : 'behind'
    return {
      text: `Very even, but sitting ${Math.round(Math.abs(mean))}ms ${side} the whole way. Much easier to fix than being erratic.`,
      salience: 8,
    }
  }
  if (Math.abs(mean) <= 15 && stdev >= 50) {
    return {
      text: `Average is right on, but individual strums are scattered ±${Math.round(stdev)}ms.`,
      salience: 8,
    }
  }
  return null
}

export function downVsUp(attempt: AttemptRecord): Observation | null {
  const down = attempt.metrics.meanOffsetDown
  const up = attempt.metrics.meanOffsetUp
  if (!num(down) || !num(up)) return null
  if (Math.abs(up - down) < 25) return null
  return {
    text: `Downstrokes ${Math.round(Math.abs(down))}ms ${down < 0 ? 'early' : 'late'}. Upstrokes ${Math.round(Math.abs(up))}ms ${up < 0 ? 'early' : 'late'} — the arm is treating the two directions differently.`,
    salience: 7,
  }
}

export function drift(attempt: AttemptRecord): Observation | null {
  const slope = attempt.metrics.driftSlope
  if (!num(slope) || Math.abs(slope) < 4) return null
  const bars = Math.max(1, attempt.durationSeconds / 4)
  const gained = slope * attempt.durationSeconds
  return {
    text: `Started locked in, ${gained < 0 ? 'rushed' : 'dragged'} about ${Math.abs(Math.round(gained))}ms over ${Math.round(bars)} bars.`,
    salience: 6,
  }
}

export function flat(attempt: AttemptRecord, history: AttemptRecord[]): Observation | null {
  const same = [...history.filter((h) => h.patternId === attempt.patternId && h.tempoBpm === attempt.tempoBpm), attempt]
    .filter((h) => num(h.metrics.offsetStdev))
    .slice(-3)
  if (same.length < 3) return null
  const spreads = same.map((h) => h.metrics.offsetStdev as number)
  const span = Math.max(...spreads) - Math.min(...spreads)
  if (span > 8) return null
  return {
    text: `Three sessions at ${attempt.tempoBpm} BPM with the same spread (${Math.round(spreads[0])}–${Math.round(spreads[2])}ms). Not getting worse, not moving.`,
    salience: 10,
  }
}

export function regression(attempt: AttemptRecord, history: AttemptRecord[]): Observation | null {
  const prior = history.filter((h) => h.patternId === attempt.patternId && num(h.metrics.offsetStdev))
  if (!num(attempt.metrics.offsetStdev) || prior.length === 0) return null
  const last = prior[prior.length - 1]
  const prevStdev = last.metrics.offsetStdev as number
  const now = attempt.metrics.offsetStdev
  if (now <= prevStdev + 8) return null
  if (attempt.tempoBpm > last.tempoBpm) {
    return {
      text: `Spread ${Math.round(now)}ms at ${attempt.tempoBpm} BPM after ${Math.round(prevStdev)}ms at ${last.tempoBpm}. First pass at the higher tempo, not a step back.`,
      salience: 6,
    }
  }
  return {
    text: `Spread on this pattern went from ${Math.round(prevStdev)}ms to ${Math.round(now)}ms versus the previous session.`,
    salience: 9,
  }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function changeLatency(attempt: AttemptRecord, history: AttemptRecord[]): Observation | null {
  if (attempt.chords.length < 2) return null
  const now = median(attempt.metrics.changeLatenciesMs)
  if (!num(now)) return null
  const pair = `${attempt.chords[0]} to ${attempt.chords[1]}`
  const prior = history.filter(
    (h) =>
      h.chords[0] === attempt.chords[0] &&
      h.chords[1] === attempt.chords[1] &&
      h.metrics.changeLatenciesMs.length > 0,
  )
  if (prior.length === 0) {
    return {
      text: `${pair} is averaging ${Math.round(Math.abs(now))}ms this take.`,
      salience: 5,
    }
  }
  const old = median(prior[0].metrics.changeLatenciesMs)
  if (!num(old) || Math.abs(old - now) < 20) return null
  return {
    text: `${pair} is averaging ${Math.round(Math.abs(now))}ms. Earlier it was ${Math.round(Math.abs(old))}ms.`,
    salience: 8,
  }
}

export function longGap(attempt: AttemptRecord, history: AttemptRecord[]): Observation | null {
  if (history.length === 0) return null
  const last = history[history.length - 1]
  const days =
    (Date.parse(attempt.startedAt) - Date.parse(last.startedAt)) / (1000 * 60 * 60 * 24)
  if (!Number.isFinite(days) || days < 11) return null
  const nowSpread = attempt.metrics.offsetStdev
  const then = last.metrics.offsetStdev
  if (!num(nowSpread) || !num(then)) return null
  return {
    text: `First session in ${Math.round(days)} days. Spread ${Math.round(nowSpread)}ms, close to the ${Math.round(then)}ms you left off at.`,
    salience: 7,
  }
}

const CANDIDATES: Array<(attempt: AttemptRecord, history: AttemptRecord[]) => Observation | null> = [
  personalBestTempo,
  steadinessTrend,
  changeLatency,
  (attempt) => systematicVsScattered(attempt),
  (attempt) => downVsUp(attempt),
  (attempt) => drift(attempt),
  flat,
  regression,
  longGap,
]

/**
 * Maximum two observations. Every line cites a measured number.
 */
export function observe(attempt: AttemptRecord, history: AttemptRecord[]): Observation[] {
  const found: Observation[] = []
  for (const fn of CANDIDATES) {
    const hit = fn(attempt, history)
    if (hit) found.push(hit)
  }
  return found.sort((a, b) => b.salience - a.salience).slice(0, 2)
}
