import { getAudioContext } from './context'
import { backingEngine } from './backingEngine'
import { metronomeEngine } from './metronomeEngine'
import { micCapture } from './micCapture'
import { pruneRecordings, saveRecording, type RecordingRow } from '../db'
import { useOnsetStore } from '../stores/onsetStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useStrumStore } from '../stores/strumStore'
import { useLessonStore } from '../stores/lessonStore'

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
  return ''
}

type RecPair = {
  recorder: MediaRecorder
  chunks: Blob[]
}

function startRecorder(stream: MediaStream, mime: string): RecPair {
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data)
  }
  recorder.start()
  return { recorder, chunks }
}

/**
 * Guitar-only from the mic stream; mix taps the backing bus plus the mic
 * through a MediaStreamDestination so playback has the band.
 */
export class RecordingEngine {
  private guitar: RecPair | null = null
  private mix: RecPair | null = null
  private mixDest: MediaStreamAudioDestinationNode | null = null
  private micTap: MediaStreamAudioSourceNode | null = null
  private mime = ''
  private originTime = 0
  private startedAt = ''

  get recording(): boolean {
    return this.guitar !== null
  }

  async start(): Promise<boolean> {
    if (this.guitar) return true
    const stream = micCapture.getStream()
    if (!stream) return false
    await pruneRecordings()
    this.mime = pickMime()
    const ctx = getAudioContext()
    this.originTime = metronomeEngine.getPosition()?.originTime ?? ctx.currentTime
    this.startedAt = new Date().toISOString()

    this.guitar = startRecorder(stream, this.mime)

    this.mixDest = ctx.createMediaStreamDestination()
    this.micTap = ctx.createMediaStreamSource(stream)
    this.micTap.connect(this.mixDest)
    backingEngine.connectMix(this.mixDest)
    this.mix = startRecorder(this.mixDest.stream, this.mime)
    return true
  }

  async stop(attemptId = ''): Promise<RecordingRow | null> {
    if (!this.guitar) return null
    const guitar = this.guitar
    const mix = this.mix
    const mime = this.mime || 'audio/webm'
    const originTime = this.originTime
    const startedAt = this.startedAt
    const onsets = useOnsetStore.getState().onsets.map((o) => ({ time: o.time, energy: o.energy }))
    const tempoBpm = useSettingsStore.getState().tempo
    const patternId = useStrumStore.getState().patternId
    const lessonId = useLessonStore.getState().lessonId

    const guitarBlob = await stopToBlob(guitar, mime)
    const mixBlob = mix ? await stopToBlob(mix, mime) : null

    this.micTap?.disconnect()
    if (this.mixDest) backingEngine.disconnectMix(this.mixDest)
    this.micTap = null
    this.mixDest = null
    this.guitar = null
    this.mix = null

    const row: RecordingRow = {
      id: crypto.randomUUID(),
      attemptId,
      lessonId,
      createdAt: startedAt,
      starred: false,
      mimeType: mime,
      guitarBlob,
      mixBlob,
      originTime,
      tempoBpm,
      patternId,
      onsets,
    }
    await saveRecording(row)
    return row
  }
}

function stopToBlob(pair: RecPair, mime: string): Promise<Blob> {
  return new Promise((resolve) => {
    pair.recorder.onstop = () => resolve(new Blob(pair.chunks, { type: mime }))
    if (pair.recorder.state === 'inactive') {
      resolve(new Blob(pair.chunks, { type: mime }))
      return
    }
    pair.recorder.stop()
  })
}

export const recordingEngine = new RecordingEngine()

export async function storageUsedBytes(): Promise<number | null> {
  if (!navigator.storage?.estimate) return null
  const estimate = await navigator.storage.estimate()
  return estimate.usage ?? 0
}
