import pitchProcessorSource from 'virtual:pitch-processor'
import { resumeAudioContext } from './context'

export type PitchFrame = {
  frequency: number
  clarity: number
  rms: number
  currentTime: number
}

const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
}

/**
 * Local-only capture. The worklet never sends samples off-device — only
 * frequency, clarity, and RMS travel to the main thread.
 */
export class MicCapture {
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private worklet: AudioWorkletNode | null = null
  private sink: GainNode | null = null
  private workletUrl: string | null = null
  private moduleLoaded = false

  async start(onFrame: (frame: PitchFrame) => void): Promise<void> {
    this.stop()
    const ctx = await resumeAudioContext()

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: MIC_CONSTRAINTS,
      video: false,
    })

    if (!this.moduleLoaded) {
      this.workletUrl = URL.createObjectURL(
        new Blob([pitchProcessorSource], { type: 'text/javascript' }),
      )
      await ctx.audioWorklet.addModule(this.workletUrl)
      this.moduleLoaded = true
    }

    this.source = ctx.createMediaStreamSource(this.stream)
    this.worklet = new AudioWorkletNode(ctx, 'pitch-processor')
    this.sink = ctx.createGain()
    this.sink.gain.value = 0
    this.worklet.port.onmessage = (event: MessageEvent<PitchFrame>) => {
      onFrame(event.data)
    }
    this.source.connect(this.worklet)
    this.worklet.connect(this.sink)
    this.sink.connect(ctx.destination)
  }

  stop(): void {
    this.worklet?.port.close()
    this.worklet?.disconnect()
    this.source?.disconnect()
    this.sink?.disconnect()
    this.worklet = null
    this.source = null
    this.sink = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
  }
}

export const micCapture = new MicCapture()
