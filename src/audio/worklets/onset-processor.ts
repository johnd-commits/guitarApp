import { createOnsetTracker } from '../onset'

class OnsetProcessor extends AudioWorkletProcessor {
  private readonly tracker = createOnsetTracker(sampleRate)

  process(inputs: Float32Array[][]) {
    const channel = inputs[0]?.[0]
    if (!channel) return true
    const onsets = this.tracker.push(channel, currentTime)
    for (const onset of onsets) {
      this.port.postMessage(onset)
    }
    return true
  }
}

registerProcessor('onset-processor', OnsetProcessor)
