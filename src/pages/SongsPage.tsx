import { useEffect, useMemo, useState } from 'react'
import { chordById, CHORD_LIBRARY } from '../chords/library'
import { findChord } from '../chords/catalog'
import { ChordDiagram } from '../components/ChordDiagram'
import { useSettingsStore } from '../stores/settingsStore'
import { extractChordProChords, uniqueChordPairs } from '../songs/chordpro'
import { listChordPairs } from '../db'
import { useChangeTrainerStore } from '../stores/changeTrainerStore'
import { usePracticeStore } from '../stores/practiceStore'
import { metronomeEngine } from '../audio/metronomeEngine'
import { beatsPerBar } from '../audio/timing'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useNavigate } from 'react-router-dom'

const AMAZING_GRACE = `{title: Amazing Grace}
{artist: Traditional}

[G]Amazing [G7]grace how [C]sweet the [G]sound
That [G]saved a [D]wretch like [G]me
I [G]once was [G7]lost but [C]now am [G]found
Was [G]blind but [D]now I [G]see
`

export function SongsPage() {
  const [source, setSource] = useState(AMAZING_GRACE)
  const [index, setIndex] = useState(0)
  const [loopStart, setLoopStart] = useState(0)
  const [loopEnd, setLoopEnd] = useState(-1)
  const [undrilled, setUndrilled] = useState<Array<[string, string]>>([])
  const capo = useSettingsStore((s) => s.capoPosition)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const tempo = useSettingsStore((s) => s.tempo)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const navigate = useNavigate()
  const names = useMemo(() => extractChordProChords(source), [source])
  const end = loopEnd < 0 ? names.length - 1 : Math.min(loopEnd, names.length - 1)
  const start = Math.min(loopStart, end)
  const span = Math.max(1, end - start + 1)
  const currentName = names[index] ?? 'G'
  const nextName = names[start + ((index - start + 1 + span) % span)] ?? currentName
  const currentChord = resolveShape(currentName)
  const nextChord = resolveShape(nextName)

  useEffect(() => {
    void listChordPairs().then((rows) => {
      const drilled = new Set(rows.filter((r) => r.attempts > 0).map((r) => `${r.fromChord}\0${r.toChord}`))
      setUndrilled(
        uniqueChordPairs(names).filter(([a, b]) => !drilled.has(`${a}\0${b}`)),
      )
    })
  }, [names])

  useEffect(() => {
    if (!isPlaying) return
    let lastBar = -1
    let raf = 0
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      if (pos) {
        const barLen = (60 / tempo) * beatsPerBar(timeSignature)
        const bar = Math.floor(Math.max(0, pos.currentTime - pos.originTime) / barLen)
        if (bar !== lastBar) {
          lastBar = bar
          setIndex((i) => {
            const next = i + 1
            if (next > end) return start
            if (next < start) return start
            return next
          })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, tempo, timeSignature, start, end])

  function drill(from: string, to: string) {
    useChangeTrainerStore.getState().setPair(from, to)
    usePracticeStore.getState().setMode('changes')
    navigate('/practice')
  }

  return (
    <section className="space-y-4">
      <p className="font-display text-sm tracking-wide text-amber">Songs</p>
      <h1 className="font-display text-3xl font-semibold leading-tight">
        Diagrams in sequence
      </h1>
      <p className="text-muted">
        Public-domain ChordPro only. Lyrics stay out of the way — you see
        the shapes, the next one a bar ahead. Hit play to walk the loop.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <ChordDiagram chord={currentChord} state="active" capoFret={capo} sounding={currentChord.name} />
        <ChordDiagram chord={nextChord} state="upcoming" capoFret={capo} sounding={nextChord.name} />
      </div>
      <p className="font-display text-xl">
        Now {currentName}. Next {nextName} ({index + 1} of {names.length})
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="min-h-12 rounded-2xl bg-surface"
          onClick={() => setIndex((i) => (i - 1 < start ? end : i - 1))}
        >
          Previous shape
        </button>
        <button
          type="button"
          className="min-h-12 rounded-2xl bg-amber text-bg"
          onClick={() => setIndex((i) => (i + 1 > end ? start : i + 1))}
        >
          Next shape
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-sm text-muted">
          Loop from
          <input
            type="number"
            min={1}
            max={names.length}
            value={start + 1}
            onChange={(e) => setLoopStart(Math.max(0, Number(e.target.value) - 1))}
            className="mt-1 w-full rounded-2xl bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="space-y-1 text-sm text-muted">
          Loop to
          <input
            type="number"
            min={1}
            max={names.length}
            value={end + 1}
            onChange={(e) => setLoopEnd(Math.max(0, Number(e.target.value) - 1))}
            className="mt-1 w-full rounded-2xl bg-surface px-3 py-2 text-ink"
          />
        </label>
      </div>
      {undrilled.length > 0 ? (
        <div className="space-y-2 rounded-2xl bg-surface px-4 py-4">
          <p className="text-muted">Pairs in this song you have not drilled</p>
          {undrilled.slice(0, 4).map(([from, to]) => (
            <button
              key={`${from}-${to}`}
              type="button"
              className="min-h-12 w-full rounded-2xl bg-raised px-3 text-left"
              onClick={() => drill(from, to)}
            >
              {from} → {to} in Change trainer
            </button>
          ))}
        </div>
      ) : null}
      <label className="block space-y-2">
        <span className="text-muted">ChordPro</span>
        <textarea
          value={source}
          onChange={(e) => {
            setSource(e.target.value)
            setIndex(0)
            setLoopStart(0)
            setLoopEnd(-1)
          }}
          rows={8}
          className="w-full rounded-2xl bg-surface px-3 py-3 text-sm text-ink"
        />
      </label>
    </section>
  )
}

function resolveShape(name: string) {
  return (
    CHORD_LIBRARY.find((c) => c.name === name || c.id === name) ??
    findChord(name) ??
    chordById('G')
  )
}
