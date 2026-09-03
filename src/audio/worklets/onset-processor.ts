import { createOnsetTracker } from '../onset'

class OnsetProcessor extends AudioWorkletProcessor {
  private readonly tracker = createOnsetTracker(sampleRate)

  process(inputs: Float32Array[][]) {
    const channel = inputs[0]?.[0]
    if (!channel) return true
    const onsets = this.tracker.push(channel, currentTime)
    for (const onset of onsets) {
      this.port.postMessage({ type: 'onset', time: onset.time, energy: onset.energy })
    }
    const chroma = this.tracker.takeChroma()
    if (chroma) {
      this.port.postMessage({
        type: 'chroma',
        chroma: Array.from(chroma.chroma),
        energy: chroma.energy,
      })
    }
    return true
  }
}

registerProcessor('onset-processor', OnsetProcessor)
