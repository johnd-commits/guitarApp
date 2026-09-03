import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { detectOnsets } from './onset'
import { clickTrain, decodeWav, encodeWav } from './wav'

const SR = 44100
const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe('spectral flux onsets', () => {
  it('finds click times in a generated WAV within 40ms', () => {
    const times = [0.4, 0.8, 1.2, 1.6]
    const samples = clickTrain(SR, times, 0.4)
    const wav = encodeWav(samples, SR)
    const decoded = decodeWav(wav)
    expect(decoded.sampleRate).toBe(SR)

    const onsets = detectOnsets(decoded.samples, decoded.sampleRate)
    expect(onsets.length).toBe(times.length)
    times.forEach((expected, i) => {
      expect(onsets[i].time).toBeGreaterThan(expected - 0.04)
      expect(onsets[i].time).toBeLessThan(expected + 0.04)
    })
  })

  it('detects the committed click-train.wav at the same 0.4s grid', () => {
    const bytes = new Uint8Array(readFileSync(join(fixtureDir, 'click-train.wav')))
    const decoded = decodeWav(bytes)
    const onsets = detectOnsets(decoded.samples, decoded.sampleRate)
    const times = [0.4, 0.8, 1.2, 1.6]
    expect(onsets.length).toBe(times.length)
    times.forEach((expected, i) => {
      expect(onsets[i].time).toBeGreaterThan(expected - 0.04)
      expect(onsets[i].time).toBeLessThan(expected + 0.04)
    })
  })

  it('debounces a double attack closer than 60ms into one onset', () => {
    const samples = clickTrain(SR, [0.5, 0.53], 0.4)
    const onsets = detectOnsets(samples, SR)
    expect(onsets.length).toBe(1)
    expect(onsets[0].time).toBeGreaterThan(0.46)
    expect(onsets[0].time).toBeLessThan(0.58)
  })

  it('ignores a low rumble below the 200 Hz analysis band', () => {
    const n = Math.floor(SR * 1.2)
    const samples = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const fade = Math.min(1, i / (SR * 0.2), (n - i) / (SR * 0.2))
      samples[i] = 0.4 * fade * Math.sin((2 * Math.PI * 60 * i) / SR)
    }
    const onsets = detectOnsets(samples, SR)
    expect(onsets.length).toBe(0)
  })
})
