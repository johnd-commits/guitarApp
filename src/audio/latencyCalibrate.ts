import { getAudioContext, resumeAudioContext } from './context'

export type CalibrationSample = {
  playTime: number
  detectTime: number
  roundTrip: number
}

export function medianRoundTrip(samples: CalibrationSample[]): number | null {
  if (samples.length === 0) return null
  const values = samples.map((s) => s.roundTrip).sort((a, b) => a - b)
  const mid = Math.floor(values.length / 2)
  return values.length % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2
}

/**
 * Pair each scheduled click with the first onset that follows it, inside
 * a 200ms window. That gap is buffer + FFT + speaker-to-mic air.
 */
export function pairClicksToOnsets(
  clicks: number[],
  onsets: number[],
  windowSeconds = 0.2,
): CalibrationSample[] {
  const used = new Set<number>()
  const pairs: CalibrationSample[] = []
  for (const playTime of clicks) {
    let best: { i: number; dist: number } | null = null
    for (let i = 0; i < onsets.length; i++) {
      if (used.has(i)) continue
      const dist = onsets[i] - playTime
      if (dist < 0 || dist > windowSeconds) continue
      if (!best || dist < best.dist) best = { i, dist }
    }
    if (!best) continue
    used.add(best.i)
    pairs.push({
      playTime,
      detectTime: onsets[best.i],
      roundTrip: best.dist,
    })
  }
  return pairs
}

export function scheduleCalibrationClicks(
  count = 6,
  spacing = 0.45,
): number[] {
  const ctx = getAudioContext()
  const start = ctx.currentTime + 0.2
  const times: number[] = []
  for (let i = 0; i < count; i++) {
    const time = start + i * spacing
    times.push(time)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.4, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.05)
  }
  return times
}

export async function unlockForCalibration(): Promise<void> {
  await resumeAudioContext()
}
