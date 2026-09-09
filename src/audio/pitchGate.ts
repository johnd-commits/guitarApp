import {
  RMS_GATE,
  CLARITY_GATE,
  DISPLAY_RMS_GATE,
  DISPLAY_CLARITY_GATE,
  GUITAR_FREQ_MIN,
  GUITAR_FREQ_MAX,
} from './pitchConstants'

/** Root-mean-square of a time-domain buffer — a cheap loudness measure. */
export function rms(buffer: ArrayLike<number>): number {
  if (buffer.length === 0) return 0
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    const x = buffer[i]
    sum += x * x
  }
  return Math.sqrt(sum / buffer.length)
}

function inGuitarBand(frequency: number): boolean {
  return Number.isFinite(frequency) && frequency >= GUITAR_FREQ_MIN && frequency <= GUITAR_FREQ_MAX
}

export function acceptPitch(
  frequency: number,
  clarity: number,
  amplitude: number,
): boolean {
  return amplitude >= RMS_GATE && clarity >= CLARITY_GATE && inGuitarBand(frequency)
}

/** Needle / Hz readout only. Does not accumulate the 1.0s lock. */
export function displayPitch(
  frequency: number,
  clarity: number,
  amplitude: number,
): boolean {
  return (
    amplitude >= DISPLAY_RMS_GATE &&
    clarity >= DISPLAY_CLARITY_GATE &&
    inGuitarBand(frequency)
  )
}
