import { useState } from 'react'
import { getAudioContext } from '../audio/context'
import {
  medianRoundTrip,
  pairClicksToOnsets,
  scheduleCalibrationClicks,
  unlockForCalibration,
} from '../audio/latencyCalibrate'
import { micCapture } from '../audio/micCapture'
import { useSettingsStore } from '../stores/settingsStore'

export function LatencyCalibrate() {
  const latencyMs = useSettingsStore((s) => s.latencyOffsetMs)
  const setLatency = useSettingsStore((s) => s.setLatencyOffsetMs)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function run() {
    if (busy) return
    setBusy(true)
    setNote(null)
    const onsets: number[] = []
    try {
      await unlockForCalibration()
      await micCapture.start({
        onset: (onset) => {
          onsets.push(onset.time)
        },
      })
      const clicks = scheduleCalibrationClicks()
      const last = clicks[clicks.length - 1] ?? 0
      await waitUntil(last + 0.25)
      micCapture.stop()
      const pairs = pairClicksToOnsets(clicks, onsets)
      const median = medianRoundTrip(pairs)
      if (median === null) {
        setLatency(0)
        setNote(
          `Heard ${onsets.length} onset${onsets.length === 1 ? '' : 's'} against ${clicks.length} clicks. Stored 0ms — use speakers, not closed-back headphones, then measure again.`,
        )
        return
      }
      const ms = Math.round(median * 1000)
      setLatency(ms)
      setNote(
        `Round-trip ${ms}ms from ${pairs.length} of ${clicks.length} clicks. That amount is subtracted from every strum.`,
      )
    } catch {
      setNote('Microphone was not available. Stored offset is unchanged.')
      micCapture.stop()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">Latency</p>
      <p className="font-display text-2xl tabular-nums">{latencyMs}ms</p>
      <p className="text-sm text-muted">
        A click through the speakers, heard by the mic, measures buffer + FFT
        delay. Without it every strum looks late by a constant.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="min-h-12 w-full rounded-2xl bg-amber font-medium text-bg disabled:opacity-60"
      >
        {busy ? 'Measuring six clicks…' : 'Measure round-trip'}
      </button>
      {note ? <p className="text-sm text-off">{note}</p> : null}
    </div>
  )
}

function waitUntil(audioTime: number): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (getAudioContext().currentTime >= audioTime) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}
