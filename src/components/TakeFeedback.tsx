import { useState } from 'react'
import { updateAttemptNote } from '../db'
import type { TakeState } from '../hooks/useAttemptSession'

export function TakeFeedback({ take }: { take: TakeState }) {
  const [note, setNote] = useState('')

  if (!take.attempt && take.lines.length === 0) return null

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">This take</p>
      {take.lines.map((line) => (
        <p key={line.text} className="font-display text-lg text-amber">
          {line.text}
        </p>
      ))}
      {take.keepPrompt ? (
        <p className="text-sm text-ink">
          Steadiest take at this tempo so far. Star the recording if you want it kept past 30 days.
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="text-muted">Note — resurfaces on Progress</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (take.attempt && note.trim()) void updateAttemptNote(take.attempt.id, note.trim())
          }}
          rows={2}
          className="w-full rounded-2xl bg-raised px-3 py-2 text-sm text-ink"
        />
      </label>
    </div>
  )
}
