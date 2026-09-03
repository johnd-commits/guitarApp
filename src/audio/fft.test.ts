import { describe, expect, it } from 'vitest'
import { fftRadix2, hann, magnitudeAt } from './fft'

describe('fft', () => {
  it('puts a 440 Hz sine in the matching bin', () => {
    const n = 2048
    const sr = 44100
    const freq = 440
    const re = new Float64Array(n)
    const im = new Float64Array(n)
    const w = hann(n)
    for (let i = 0; i < n; i++) {
      re[i] = Math.sin((2 * Math.PI * freq * i) / sr) * w[i]
    }
    fftRadix2(re, im)
    let peak = 0
    let peakBin = 0
    for (let k = 1; k < n / 2; k++) {
      const mag = magnitudeAt(re, im, k)
      if (mag > peak) {
        peak = mag
        peakBin = k
      }
    }
    const expected = Math.round((freq * n) / sr)
    expect(peakBin).toBe(expected)
  })
})
