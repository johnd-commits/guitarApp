import { fftRadix2, hann, magnitudeAt } from './fft'

export const FFT_SIZE = 2048
export const HOP_SIZE = 512
export const MIN_IOI_SECONDS = 0.06
export const BAND_LOW_HZ = 200
export const BAND_HIGH_HZ = 5000
export const FLUX_HISTORY = 21
/** Peak must beat the rolling median by this factor. */
export const FLUX_THRESHOLD_RATIO = 1.8
/** Absolute floor so sidelobe flicker from sub-band rumble is not an onset. */
export const MIN_FLUX = 8

export type DetectedOnset = {
  time: number
  energy: number
}

function bandBins(sampleRate: number, fftSize: number): { lo: number; hi: number } {
  const lo = Math.max(1, Math.floor((BAND_LOW_HZ * fftSize) / sampleRate))
  const hi = Math.min(fftSize / 2 - 1, Math.ceil((BAND_HIGH_HZ * fftSize) / sampleRate))
  return { lo, hi }
}

/**
 * Spectral flux in the guitar band: for each FFT bin between 200 Hz and
 * 5 kHz, take the rise in magnitude versus the previous frame (ignore
 * falls), then sum. Kicks and rumble live below 200 Hz, so they drop out.
 */
export function spectralFlux(
  current: Float64Array,
  previous: Float64Array,
  lo: number,
  hi: number,
): number {
  let sum = 0
  for (let k = lo; k <= hi; k++) {
    const delta = current[k] - previous[k]
    if (delta > 0) sum += delta
  }
  return sum
}

/** Median of a copy so the history buffer itself is not reordered. */
export function median(values: ArrayLike<number>, count: number): number {
  if (count <= 0) return 0
  const copy = Array.from({ length: count }, (_, i) => values[i])
  copy.sort((a, b) => a - b)
  const mid = Math.floor(count / 2)
  return count % 2 === 1 ? copy[mid] : (copy[mid - 1] + copy[mid]) / 2
}

function bandMagnitudes(
  window: Float32Array,
  hannWin: Float64Array,
  re: Float64Array,
  im: Float64Array,
  mags: Float64Array,
  lo: number,
  hi: number,
): number {
  const n = window.length
  re.fill(0)
  im.fill(0)
  for (let i = 0; i < n; i++) {
    re[i] = window[i] * hannWin[i]
  }
  fftRadix2(re, im)
  let energy = 0
  mags.fill(0)
  for (let k = lo; k <= hi; k++) {
    const mag = magnitudeAt(re, im, k)
    mags[k] = mag
    energy += mag
  }
  return energy
}

/**
 * Offline onset picker used by tests and the worklet (same maths).
 * Time is taken at the centre of the analysis window, in seconds from
 * the start of `samples`.
 */
export function detectOnsets(
  samples: Float32Array,
  sampleRate: number,
  fftSize = FFT_SIZE,
  hop = HOP_SIZE,
): DetectedOnset[] {
  if (samples.length < fftSize) return []

  const { lo, hi } = bandBins(sampleRate, fftSize)
  const hannWin = hann(fftSize)
  const re = new Float64Array(fftSize)
  const im = new Float64Array(fftSize)
  const prev = new Float64Array(fftSize)
  const curr = new Float64Array(fftSize)
  const history = new Float64Array(FLUX_HISTORY)
  let histCount = 0
  let histWrite = 0
  let prevFlux = 0
  let lastOnset = -Infinity
  const window = new Float32Array(fftSize)
  const onsets: DetectedOnset[] = []

  for (let start = 0; start + fftSize <= samples.length; start += hop) {
    window.set(samples.subarray(start, start + fftSize))
    const energy = bandMagnitudes(window, hannWin, re, im, curr, lo, hi)
    const flux = histCount === 0 ? 0 : spectralFlux(curr, prev, lo, hi)
    prev.set(curr)

    const med = median(history, histCount)
    const threshold = med * FLUX_THRESHOLD_RATIO
    const centreTime = (start + fftSize / 2) / sampleRate
    const isPeak =
      flux > prevFlux && flux > threshold && flux > MIN_FLUX && histCount >= 8
    if (isPeak && centreTime - lastOnset >= MIN_IOI_SECONDS) {
      onsets.push({ time: centreTime, energy })
      lastOnset = centreTime
    }

    if (histCount < FLUX_HISTORY) histCount += 1
    history[histWrite] = flux
    histWrite = (histWrite + 1) % FLUX_HISTORY
    prevFlux = flux
  }

  return onsets
}

/**
 * Streaming state for the AudioWorklet. Samples land in a ring; every
 * hop we unwrap the latest FFT_SIZE frames and run the same peak picker
 * as the offline path.
 */
export function createOnsetTracker(sampleRate: number) {
  const fftSize = FFT_SIZE
  const hop = HOP_SIZE
  const { lo, hi } = bandBins(sampleRate, fftSize)
  const hannWin = hann(fftSize)
  const re = new Float64Array(fftSize)
  const im = new Float64Array(fftSize)
  const prev = new Float64Array(fftSize)
  const curr = new Float64Array(fftSize)
  const history = new Float64Array(FLUX_HISTORY)
  const ring = new Float32Array(fftSize)
  const window = new Float32Array(fftSize)
  let write = 0
  let total = 0
  let sinceHop = 0
  let histCount = 0
  let histWrite = 0
  let prevFlux = 0
  let lastOnset = -Infinity

  function unwrap() {
    const start = write
    for (let i = 0; i < fftSize; i++) {
      window[i] = ring[(start + i) % fftSize]
    }
  }

  return {
    push(chunk: Float32Array, blockTime: number): DetectedOnset[] {
      const found: DetectedOnset[] = []
      for (let i = 0; i < chunk.length; i++) {
        ring[write] = chunk[i]
        write = (write + 1) % fftSize
        total += 1
        sinceHop += 1
        if (total < fftSize || sinceHop < hop) continue
        sinceHop = 0
        unwrap()
        const energy = bandMagnitudes(window, hannWin, re, im, curr, lo, hi)
        const flux = histCount === 0 ? 0 : spectralFlux(curr, prev, lo, hi)
        prev.set(curr)
        const med = median(history, histCount)
        const threshold = med * FLUX_THRESHOLD_RATIO
        const samplesAfter = chunk.length - 1 - i
        const time = blockTime - (samplesAfter + fftSize / 2) / sampleRate
        const isPeak =
      flux > prevFlux && flux > threshold && flux > MIN_FLUX && histCount >= 8
        if (isPeak && time - lastOnset >= MIN_IOI_SECONDS) {
          found.push({ time, energy })
          lastOnset = time
        }
        if (histCount < FLUX_HISTORY) histCount += 1
        history[histWrite] = flux
        histWrite = (histWrite + 1) % FLUX_HISTORY
        prevFlux = flux
      }
      return found
    },
  }
}
