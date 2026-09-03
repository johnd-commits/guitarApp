import { describe, expect, it } from 'vitest'
import { clampMicSensitivity, micGainFromSensitivity } from './micGain'
import { mapAudioInputs } from './micDevices'

describe('mic gain', () => {
  it('maps sensitivity 0–100 onto 1×–8×', () => {
    expect(micGainFromSensitivity(0)).toBe(1)
    expect(micGainFromSensitivity(100)).toBe(8)
    expect(micGainFromSensitivity(50)).toBeCloseTo(4.5, 8)
  })

  it('clamps non-finite sensitivity', () => {
    expect(clampMicSensitivity(Number.NaN)).toBe(60)
    expect(clampMicSensitivity(140)).toBe(100)
  })
})

describe('audio input list', () => {
  it('keeps only audioinput devices and fills blank labels', () => {
    const listed = mapAudioInputs([
      { deviceId: 'cam', kind: 'videoinput', label: 'Webcam' },
      { deviceId: 'mic-a', kind: 'audioinput', label: 'USB Guitar' },
      { deviceId: 'mic-b', kind: 'audioinput', label: '  ' },
      { deviceId: '', kind: 'audioinput', label: 'Ghost' },
    ])
    expect(listed).toEqual([
      { id: 'mic-a', label: 'USB Guitar' },
      { id: 'mic-b', label: 'Microphone 2' },
    ])
  })
})
