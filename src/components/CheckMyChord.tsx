import { useState } from 'react'
import { matchChroma, stringPresence, type ChordGuess } from '../audio/chroma'
import { chordById, CHORD_LIBRARY } from '../chords/library'
import { useOnsetStore } from '../stores/onsetStore'
import { stringTargets, tuningById } from '../tuner/notes'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * Advisory only. A match warms the name; a miss shows nothing.
 * Per-string readout is the useful part — find the dead string yourself.
 */
export function CheckMyChord() {
  const chroma = useOnsetStore((s) => s.chroma)
  const [chordId, setChordId] = useState('G')
  const capo = useSettingsStore((s) => s.capoPosition)
  const chord = chordById(chordId)
  const guess = chroma ? matchChroma(chroma) : null
  const targets = stringTargets(tuningById('standard'), capo)
  const freqs = expectedStringFreqs(chord, targets.map((t) => t.frequency))
  const presence = chroma ? stringPresence(chroma, freqs) : []
  const match = guess && namesAgree(guess, chord.name)

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">Check my chord</p>
      <p className="text-sm text-muted">
        Advisory only — a warm glow on a match, silence on a miss. Hold the
        shape and look at which strings are actually sounding.
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CHORD_LIBRARY.slice(0, 12).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setChordId(item.id)}
            className={[
              'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
              chordId === item.id ? 'bg-amber text-bg' : 'bg-raised text-ink',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className={['font-display text-2xl', match ? 'text-amber' : 'text-ink'].join(' ')}>
        {match
          ? `${guess.name} is ringing (${(guess.confidence * 100).toFixed(0)}% chroma match)`
          : guess
            ? `Heard ${guess.name} (${(guess.confidence * 100).toFixed(0)}% chroma match) while holding ${chord.name}`
            : `Hold ${chord.name} — waiting for a ringing shape`}
      </p>
      {presence.length > 0 ? (
        <div className="grid grid-cols-6 gap-1.5">
          {presence.map((item, i) => (
            <div
              key={i}
              className={[
                'flex min-h-16 flex-col items-center justify-center rounded-xl text-center',
                item.present ? 'bg-amber text-bg' : 'bg-raised text-muted',
              ].join(' ')}
            >
              <span className="text-sm">{['E', 'A', 'D', 'G', 'B', 'e'][i]}</span>
              <span className="text-[0.7rem] tabular-nums">
                {item.present ? 'sounding' : 'quiet'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-off">Play while the transport is running so the mic is open.</p>
      )}
    </div>
  )
}

function namesAgree(guess: ChordGuess, expected: string): boolean {
  return guess.name.replace('maj', '') === expected.replace('maj', '')
}

function expectedStringFreqs(
  chord: ReturnType<typeof chordById>,
  openFreqs: number[],
): number[] {
  // openFreqs is high-to-low in tuner (E2..E4) as stringTargets index 0 = low E.
  return chord.fingers
    .slice()
    .sort((a, b) => b.string - a.string)
    .map((finger) => {
      const open = openFreqs[6 - finger.string] ?? 0
      if (finger.fret === 'x') return 0
      return open * Math.pow(2, finger.fret / 12)
    })
}

