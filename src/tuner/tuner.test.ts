import { describe, expect, it } from 'vitest'
import { PitchDetector } from 'pitchy'
import { CLARITY_GATE, DISPLAY_RMS_GATE, PITCH_WINDOW, RMS_GATE } from '../audio/pitchConstants'
import { acceptPitch, displayPitch, rms } from '../audio/pitchGate'
import { centsOff, detectString, midiToFreq, stringTargets, stringToMeasure, tuningById } from './notes'
import { allLocked, emptyLocks, stepLock } from './lock'

function sine(freq: number, sampleRate: number, length: number, amplitude = 0.4): Float32Array {
  const buf = new Float32Array(length)
  const step = (2 * Math.PI * freq) / sampleRate
  for (let i = 0; i < length; i++) buf[i] = Math.sin(i * step) * amplitude
  return buf
}

describe('pitch gates', () => {
  it('rejects a quiet buffer so room noise does not become a note', () => {
    const quiet = sine(110, 44100, PITCH_WINDOW, 0.001)
    expect(rms(quiet)).toBeLessThan(RMS_GATE)
    expect(acceptPitch(110, 0.99, rms(quiet))).toBe(false)
  })

  it('rejects a loud but unclear reading', () => {
    expect(acceptPitch(110, CLARITY_GATE - 0.05, 0.2)).toBe(false)
  })

  it('moves the needle on a quiet but clear A2 that would not lock', () => {
    const quiet = sine(110, 44100, PITCH_WINDOW, 0.002)
    const amplitude = rms(quiet)
    expect(amplitude).toBeLessThan(RMS_GATE)
    expect(amplitude).toBeGreaterThan(DISPLAY_RMS_GATE)
    expect(acceptPitch(110, 0.99, amplitude)).toBe(false)
    expect(displayPitch(110, 0.99, amplitude)).toBe(true)
  })
})

describe('McLeod pitch (pitchy) against sine fixtures', () => {
  it('finds A2 at 110 Hz within 1 Hz', () => {
    const sampleRate = 44100
    const buf = sine(110, sampleRate, PITCH_WINDOW)
    const detector = PitchDetector.forFloat32Array(PITCH_WINDOW)
    const [frequency, clarity] = detector.findPitch(buf, sampleRate)
    expect(clarity).toBeGreaterThan(CLARITY_GATE)
    expect(Math.abs(frequency - 110)).toBeLessThan(1)
    expect(acceptPitch(frequency, clarity, rms(buf))).toBe(true)
  })

  it('finds low E at 82.41 Hz within 1 Hz', () => {
    const sampleRate = 44100
    const target = midiToFreq(40)
    const buf = sine(target, sampleRate, PITCH_WINDOW)
    const detector = PitchDetector.forFloat32Array(PITCH_WINDOW)
    const [frequency, clarity] = detector.findPitch(buf, sampleRate)
    expect(clarity).toBeGreaterThan(CLARITY_GATE)
    expect(Math.abs(frequency - target)).toBeLessThan(1)
  })
})

describe('cents and string detect', () => {
  it('measures five cents as 1200 * log2 of the ratio', () => {
    const a = 110
    const sharp = a * 2 ** (5 / 1200)
    expect(centsOff(sharp, a)).toBeCloseTo(5, 8)
    expect(centsOff(a, a)).toBeCloseTo(0, 8)
  })

  it('picks the A string for 110 Hz in standard tuning', () => {
    const targets = stringTargets(tuningById('standard'), 0)
    expect(detectString(110, targets, null)).toBe(1)
  })

  it('shifts standard targets up by the capo', () => {
    const open = stringTargets(tuningById('standard'), 0)
    const capo2 = stringTargets(tuningById('standard'), 2)
    expect(capo2[0].name).toBe('F#2')
    expect(centsOff(capo2[0].frequency, open[0].frequency)).toBeCloseTo(200, 6)
  })

  it('uses drop D for the sixth string', () => {
    const targets = stringTargets(tuningById('drop-d'), 0)
    expect(targets[0].name).toBe('D2')
    expect(detectString(midiToFreq(38), targets, null)).toBe(0)
  })

  it('keeps a tapped string even when the pitch is nearer another', () => {
    const targets = stringTargets(tuningById('standard'), 0)
    // 110 Hz is A, but G (index 3) stays selected.
    expect(stringToMeasure(110, targets, null, 3)).toBe(3)
    expect(stringToMeasure(110, targets, 1, null)).toBe(1)
  })
})

describe('string lock', () => {
  it('locks after one second inside ±5 cents on the audio clock', () => {
    let lock = emptyLocks()[0]
    lock = stepLock(lock, { detected: true, cents: 2, now: 1.0 })
    expect(lock.locked).toBe(false)
    lock = stepLock(lock, { detected: true, cents: -3, now: 2.0 })
    expect(lock.locked).toBe(true)
    expect(lock.heldSeconds).toBeCloseTo(1, 8)
  })

  it('resets the hold when cents leave the ±5 band', () => {
    let lock = emptyLocks()[0]
    lock = stepLock(lock, { detected: true, cents: 1, now: 1.0 })
    lock = stepLock(lock, { detected: true, cents: 1, now: 1.8 })
    lock = stepLock(lock, { detected: true, cents: 12, now: 1.9 })
    expect(lock.locked).toBe(false)
    expect(lock.heldSeconds).toBe(0)
  })

  it('pauses rather than resetting when another string is sounding', () => {
    let lock = emptyLocks()[0]
    lock = stepLock(lock, { detected: true, cents: 1, now: 1.0 })
    lock = stepLock(lock, { detected: true, cents: 1, now: 1.6 })
    lock = stepLock(lock, { detected: false, cents: null, now: 2.4 })
    expect(lock.heldSeconds).toBeCloseTo(0.6, 8)
    expect(lock.locked).toBe(false)
    lock = stepLock(lock, { detected: true, cents: 1, now: 2.4 })
    lock = stepLock(lock, { detected: true, cents: 1, now: 2.8 })
    expect(lock.locked).toBe(true)
  })

  it('opens the gate only when all six are locked', () => {
    const locks = emptyLocks()
    expect(allLocked(locks)).toBe(false)
    locks.forEach((l, i) => {
      locks[i] = { ...l, locked: true }
    })
    expect(allLocked(locks)).toBe(true)
  })
})
