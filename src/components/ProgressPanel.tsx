import { useEffect, useState } from 'react'
import { listAttempts, listChordPairs, medianLatency } from '../db'
import { observe, type AttemptRecord } from '../metrics/feedback'
import type { ChordPairRow } from '../db'
import { useAuthStore } from '../sync/authStore'

export function ProgressPanel() {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])
  const [pairs, setPairs] = useState<ChordPairRow[]>([])
  const waiting = useAuthStore((s) => s.waiting)
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    void listAttempts().then(setAttempts).catch(() => setAttempts([]))
    void listChordPairs().then(setPairs).catch(() => setPairs([]))
  }, [])

  const latest = attempts[attempts.length - 1]
  const history = attempts.slice(0, -1)
  const lines = latest ? observe(latest, history) : []
  const notes = attempts.filter((a) => a.note).slice(-3)
  const spreads = attempts
    .filter((a) => a.metrics.offsetStdev !== null)
    .slice(-16)
    .map((a) => a.metrics.offsetStdev as number)
  const pairMedians = pairs
    .map((p) => ({ label: `${p.fromChord}→${p.toChord}`, value: medianLatency(p) }))
    .filter((p): p is { label: string; value: number } => p.value !== null)
    .slice(-12)
    .map((p) => p.value)

  const syncLabel =
    status === 'syncing'
      ? 'syncing'
      : status === 'waiting'
        ? `${waiting} waiting`
        : status === 'synced'
          ? 'synced'
          : status === 'local'
            ? 'local only'
            : 'signed out'

  return (
    <div className="space-y-4 rounded-2xl bg-surface px-4 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-muted">Progress — your numbers only</p>
        <p className="text-sm text-off">{syncLabel}</p>
      </div>
      {spreads.length < 2 ? (
        <p className="text-sm text-muted">
          After a few measured takes, two lines show up here: timing spread
          per lesson, and median change latency. Line down means better.
        </p>
      ) : (
        <>
          <Trend values={spreads} label="Timing spread (ms) — line down is steadier" />
          {pairMedians.length >= 2 ? (
            <Trend values={pairMedians} label="Change latency (ms) — line down is a faster change" />
          ) : null}
        </>
      )}
      {lines.map((line) => (
        <p key={line.text} className="font-display text-lg text-amber">
          {line.text}
        </p>
      ))}
      {notes.map((a) => (
        <p key={a.id} className="text-sm text-ink">
          {a.startedAt.slice(0, 10)} — {a.note}
        </p>
      ))}
    </div>
  )
}

function Trend({ values, label }: { values: number[]; label: string }) {
  const w = 320
  const h = 88
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (w - 12) + 6
    const y = h - 8 - (v / max) * (h - 16)
    return `${x},${y}`
  })
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted">{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" aria-hidden="true">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          points={pts.join(' ')}
          className="text-amber"
        />
      </svg>
      <p className="tabular-nums text-sm text-off">
        {Math.round(values[0])}ms → {Math.round(values[values.length - 1])}ms
      </p>
    </div>
  )
}
