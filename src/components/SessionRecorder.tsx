import { useEffect, useRef, useState } from 'react'
import { recordingEngine, storageUsedBytes } from '../audio/recording'
import { getAudioContext } from '../audio/context'
import { timeStretch } from '../audio/timeStretch'
import {
  deleteAllRecordings,
  listRecordings,
  starRecording,
  type RecordingRow,
} from '../db'

type Props = { keepPrompt: boolean }

export function SessionRecorder({ keepPrompt }: Props) {
  const [recording, setRecording] = useState(false)
  const [usedBytes, setUsedBytes] = useState<number | null>(null)
  const [rows, setRows] = useState<RecordingRow[]>([])
  const [stretch, setStretch] = useState(1)
  const [loopBar, setLoopBar] = useState(false)
  const [status, setStatus] = useState('')
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)

  async function refresh() {
    try {
      setRows(await listRecordings())
      setUsedBytes(await storageUsedBytes())
    } catch {
      setRows([])
    }
  }

  useEffect(() => {
    void refresh()
    return () => {
      sourceRef.current?.stop()
    }
  }, [])

  async function toggle() {
    if (recording) {
      await recordingEngine.stop()
      setRecording(false)
      await refresh()
      return
    }
    const ok = await recordingEngine.start()
    setRecording(ok)
    if (!ok) setStatus('Start the transport so the mic is open, then record.')
  }

  async function play(row: RecordingRow, which: 'guitar' | 'mix', loop = loopBar): Promise<void> {
    sourceRef.current?.stop()
    const blob = which === 'mix' && row.mixBlob ? row.mixBlob : row.guitarBlob
    const ctx = getAudioContext()
    const raw = await blob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(raw.slice(0))
    const samples = Float32Array.from(decoded.getChannelData(0))
    const stretched = stretch < 0.99 ? timeStretch(samples, stretch) : samples
    const buffer = ctx.createBuffer(1, stretched.length, decoded.sampleRate)
    buffer.getChannelData(0).set(stretched)
    bufferRef.current = buffer
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    if (loop) {
      src.loop = true
      src.loopStart = 0
      src.loopEnd = Math.min(buffer.duration, ((60 / row.tempoBpm) * 4) / stretch)
    }
    src.start()
    sourceRef.current = src
    setStatus(
      `Playing ${which}, ${row.onsets.length} onsets aligned to origin ${row.originTime.toFixed(2)}s.`,
    )
    await new Promise<void>((resolve) => {
      src.onended = () => resolve()
    })
  }

  async function abCompare() {
    const guitar = rows.filter((r) => r.guitarBlob)
    if (guitar.length < 2) {
      setStatus('Need two kept takes of the same lesson to A/B.')
      return
    }
    const byLesson = new Map<string, RecordingRow[]>()
    for (const row of guitar) {
      const list = byLesson.get(row.lessonId) ?? []
      list.push(row)
      byLesson.set(row.lessonId, list)
    }
    const pair = [...byLesson.values()].find((list) => list.length >= 2)
    if (!pair) {
      setStatus('Need two takes of the same lesson.')
      return
    }
    const earliest = pair[0]
    const latest = pair[pair.length - 1]
    setStatus(`A: ${earliest.createdAt.slice(0, 16)}`)
    await play(earliest, 'guitar', false)
    setStatus(`B: ${latest.createdAt.slice(0, 16)} versus ${earliest.createdAt.slice(0, 16)}.`)
    await play(latest, 'guitar', false)
  }

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">Recording — stays on this phone</p>
      <p className="text-sm text-muted">
        Guitar-only and a mix with the band. Auto-delete after 30 days unless
        starred. Nothing uploads unless you opt in, take by take.
      </p>
      {keepPrompt ? (
        <p className="font-display text-lg text-amber">
          Keep this one — it was the steadiest take at this tempo.
        </p>
      ) : null}
      <p className="tabular-nums text-sm">
        {usedBytes === null ? 'Storage unknown until a take is kept' : `${Math.round(usedBytes / 1024)} KB used`}
      </p>
      <button
        type="button"
        onClick={() => void toggle()}
        className="min-h-12 w-full rounded-2xl bg-amber font-medium text-bg"
      >
        {recording ? 'Stop take' : 'Record this take'}
      </button>
      <label className="block space-y-1 text-sm text-muted">
        Playback speed {Math.round(stretch * 100)}% (pitch held)
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.05}
          value={stretch}
          onChange={(e) => setStretch(Number(e.target.value))}
          className="h-8 w-full accent-amber"
        />
      </label>
      <label className="flex min-h-12 items-center justify-between gap-4">
        <span>Loop a bar on playback</span>
        <input
          type="checkbox"
          className="h-6 w-6 accent-amber"
          checked={loopBar}
          onChange={(e) => setLoopBar(e.target.checked)}
        />
      </label>
      <button type="button" className="min-h-12 w-full rounded-2xl bg-raised" onClick={() => void abCompare()}>
        A/B earliest vs latest kept take
      </button>
      {rows.slice(-4).reverse().map((row) => (
        <div key={row.id} className="space-y-2 rounded-2xl bg-raised px-3 py-3">
          <p className="tabular-nums text-sm">
            {row.createdAt.slice(0, 16)} · {row.onsets.length} onsets · {row.tempoBpm} BPM
          </p>
          <Waveform onsets={row.onsets.length} />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="min-h-10 rounded-xl bg-surface" onClick={() => void play(row, 'guitar')}>
              Guitar only
            </button>
            <button type="button" className="min-h-10 rounded-xl bg-surface" onClick={() => void play(row, 'mix')}>
              Mix
            </button>
          </div>
          <button
            type="button"
            className="text-sm text-amber"
            onClick={() => void starRecording(row.id, !row.starred).then(() => refresh())}
          >
            {row.starred ? 'Starred — kept' : 'Star to keep past 30 days'}
          </button>
        </div>
      ))}
      {status ? <p className="text-sm text-off">{status}</p> : null}
      <button
        type="button"
        onClick={() => void deleteAllRecordings().then(() => refresh())}
        className="w-full py-2 text-sm text-off"
      >
        Delete all local recordings
      </button>
    </div>
  )
}

function Waveform({ onsets }: { onsets: number }) {
  const w = 320
  const h = 48
  const marks = Math.min(24, onsets)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full text-amber" aria-hidden="true">
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="currentColor" strokeOpacity="0.35" />
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          x1={((i + 1) / 9) * w}
          y1={8}
          x2={((i + 1) / 9) * w}
          y2={h - 8}
          stroke="currentColor"
          strokeOpacity="0.25"
        />
      ))}
      {Array.from({ length: marks }, (_, i) => (
        <circle
          key={`o-${i}`}
          cx={((i + 1) / (marks + 1)) * w}
          cy={h / 2}
          r="3"
          fill="currentColor"
        />
      ))}
    </svg>
  )
}
