import pitchProcessorSource from 'virtual:pitch-processor'
import onsetProcessorSource from 'virtual:onset-processor'
import { resumeAudioContext } from './context'
import type { DetectedOnset } from './onset'

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

type Handlers = {
  pitch?: (frame: PitchFrame) => void
  onset?: (onset: DetectedOnset) => void
}

/**
 * Local-only capture. Worklets post numbers (pitch / onsets), never samples.
 */
export class MicCapture {
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private pitchNode: AudioWorkletNode | null = null
  private onsetNode: AudioWorkletNode | null = null
  private sink: GainNode | null = null
  private pitchUrl: string | null = null
  private onsetUrl: string | null = null
  private pitchLoaded = false
  private onsetLoaded = false

  async start(handlers: Handlers): Promise<void> {
    this.stop()
    const ctx = await resumeAudioContext()

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: MIC_CONSTRAINTS,
      video: false,
    })

    if (handlers.pitch && !this.pitchLoaded) {
      this.pitchUrl = URL.createObjectURL(
        new Blob([pitchProcessorSource], { type: 'text/javascript' }),
      )
      await ctx.audioWorklet.addModule(this.pitchUrl)
      this.pitchLoaded = true
    }
    if (handlers.onset && !this.onsetLoaded) {
      this.onsetUrl = URL.createObjectURL(
        new Blob([onsetProcessorSource], { type: 'text/javascript' }),
      )
      await ctx.audioWorklet.addModule(this.onsetUrl)
      this.onsetLoaded = true
    }

    this.source = ctx.createMediaStreamSource(this.stream)
    this.sink = ctx.createGain()
    this.sink.gain.value = 0
    this.sink.connect(ctx.destination)

    if (handlers.pitch) {
      this.pitchNode = new AudioWorkletNode(ctx, 'pitch-processor')
      this.pitchNode.port.onmessage = (event: MessageEvent<PitchFrame>) => {
        handlers.pitch?.(event.data)
      }
      this.source.connect(this.pitchNode)
      this.pitchNode.connect(this.sink)
    }
    if (handlers.onset) {
      this.onsetNode = new AudioWorkletNode(ctx, 'onset-processor')
      this.onsetNode.port.onmessage = (event: MessageEvent<DetectedOnset>) => {
        handlers.onset?.(event.data)
      }
      this.source.connect(this.onsetNode)
      this.onsetNode.connect(this.sink)
    }
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  stop(): void {
    this.pitchNode?.port.close()
    this.onsetNode?.port.close()
    this.pitchNode?.disconnect()
    this.onsetNode?.disconnect()
    this.source?.disconnect()
    this.sink?.disconnect()
    this.pitchNode = null
    this.onsetNode = null
    this.source = null
    this.sink = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
  }
}

export const micCapture = new MicCapture()
