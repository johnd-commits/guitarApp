import { PitchDetector } from 'pitchy'
import { PITCH_WINDOW } from '../pitchConstants'
import { rms } from '../pitchGate'

/**
 * Runs in the audio thread. McLeod pitch (pitchy) on overlapping windows;
 * posts frequency, clarity, and RMS. The main thread applies the gates.
 */
class PitchProcessor extends AudioWorkletProcessor {
  private readonly detector = PitchDetector.forFloat32Array(PITCH_WINDOW)
  private readonly buffer = new Float32Array(PITCH_WINDOW)
  private filled = 0

  process(inputs: Float32Array[][]) {
    const channel = inputs[0]?.[0]
    if (!channel) return true

    let offset = 0
    while (offset < channel.length) {
      const room = PITCH_WINDOW - this.filled
      const take = Math.min(room, channel.length - offset)
      this.buffer.set(channel.subarray(offset, offset + take), this.filled)
      this.filled += take
      offset += take

      if (this.filled >= PITCH_WINDOW) {
        const amplitude = rms(this.buffer)
        const [frequency, clarity] = this.detector.findPitch(this.buffer, sampleRate)
        this.port.postMessage({
          frequency,
          clarity,
          rms: amplitude,
          currentTime,
        })
        this.buffer.copyWithin(0, PITCH_WINDOW / 2)
        this.filled = PITCH_WINDOW / 2
      }
    }

    return true
  }
}

registerProcessor('pitch-processor', PitchProcessor)
