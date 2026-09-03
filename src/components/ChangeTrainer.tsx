import { useEffect, useState } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { beatsPerBar, secondsPerBeat } from '../audio/timing'
import { changeTimesFromOrigin, countCleanChanges } from '../chords/changes'
import { anchorFingers } from '../chords/library'
import { findChord } from '../chords/catalog'
import { travelDots, travelPhase } from '../chords/travel'
import { musicalPosition } from '../chords/position'
import { OPEN_CHANGE_PAIRS, useChangeTrainerStore } from '../stores/changeTrainerStore'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useOnsetStore } from '../stores/onsetStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ChordDiagram } from './ChordDiagram'

export function ChangeTrainer() {
  const fromId = useChangeTrainerStore((s) => s.fromId)
  const toId = useChangeTrainerStore((s) => s.toId)
  const setPair = useChangeTrainerStore((s) => s.setPair)
  const animSpeed = useChangeTrainerStore((s) => s.animSpeed)
  const setAnimSpeed = useChangeTrainerStore((s) => s.setAnimSpeed)
  const noStrum = useChangeTrainerStore((s) => s.noStrum)
  const setNoStrum = useChangeTrainerStore((s) => s.setNoStrum)
  const minuteBest = useChangeTrainerStore((s) => s.minuteBest)
  const minuteLast = useChangeTrainerStore((s) => s.minuteLast)
  const recordMinute = useChangeTrainerStore((s) => s.recordMinute)
  const tempo = useSettingsStore((s) => s.tempo)
  const capo = useSettingsStore((s) => s.capoPosition)
  const countInBars = useSettingsStore((s) => s.countInBars)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const latency = useSettingsStore((s) => s.latencyOffsetMs)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const [elapsed, setElapsed] = useState(0)
  const [minuteLeft, setMinuteLeft] = useState<number | null>(null)

  const from = findChord(fromId)
  const to = findChord(toId)
  const anchors = anchorFingers(from, to)

  useEffect(() => {
    if (!isPlaying) {
      setElapsed(0)
      return
    }
    let raf = 0
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      setElapsed(pos ? pos.currentTime - pos.originTime : 0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying])

  const bpb = beatsPerBar(timeSignature)
  const music = musicalPosition(isPlaying ? elapsed : 0, tempo, timeSignature, isPlaying ? countInBars : 0)
  const evenBar = music.songBar % 2 === 0
  const current = evenBar ? from : to
  const next = evenBar ? to : from
  const remainingInBar = bpb - music.beat - music.beatPhase
  const windowBeats = 1 / animSpeed
  const phase = music.inCountIn ? 0 : travelPhase(remainingInBar, windowBeats)
  const dots = travelDots(current, next, phase)

  async function startMinute() {
    await metronomeEngine.unlock()
    useOnsetStore.getState().clear()
    useSettingsStore.getState().setPlaying(true)
    const started = performance.now()
    setMinuteLeft(60)
    const watch = () => {
      const pos = metronomeEngine.getPosition()
      const left = pos
        ? Math.max(0, 60 - (pos.currentTime - pos.originTime))
        : Math.max(0, 60 - (performance.now() - started) / 1000)
      setMinuteLeft(left)
      if (left <= 0) {
        finishMinute()
        return
      }
      requestAnimationFrame(watch)
    }
    requestAnimationFrame(watch)
  }

  function finishMinute() {
    const pos = metronomeEngine.getPosition()
    const origin = pos?.originTime ?? 0
    const beatLen = secondsPerBeat(tempo)
    const boundaries = changeTimesFromOrigin(origin, countInBars * bpb, beatLen, bpb, 60)
    const count = countCleanChanges(
      useOnsetStore.getState().onsets,
      boundaries,
      latency / 1000,
    )
    recordMinute(count)
    setMinuteLeft(null)
    useSettingsStore.getState().setPlaying(false)
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-xl text-amber">
        {noStrum
          ? `Shapes only. ${current.name} now, ${next.name} in ${remainingInBar.toFixed(1)} beats`
          : `Arm keeps moving. ${current.name} now, ${next.name} in ${remainingInBar.toFixed(1)} beats`}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <ChordDiagram
          chord={current}
          state="active"
          anchors={phase > 0 ? anchors : []}
          capoFret={capo}
          sounding={current.name}
        />
        <ChordDiagram
          chord={next}
          state={phase > 0 ? 'upcoming' : 'idle'}
          capoFret={capo}
          sounding={next.name}
        />
      </div>

      <div className="rounded-2xl bg-surface px-3 py-3">
        <p className="mb-2 text-sm text-muted">
          Finger travel at {(animSpeed * 100).toFixed(0)}% — loop stays at {tempo} BPM
        </p>
        <div className="flex flex-wrap gap-2">
          {dots.map((dot) => (
            <span
              key={dot.finger}
              className="rounded-full bg-amber px-3 py-1 text-sm font-medium text-bg"
              style={{ opacity: Math.max(0.25, dot.opacity) }}
            >
              Finger {dot.finger} → string {Math.round(dot.string)}, fret {dot.fret.toFixed(1)}
            </span>
          ))}
          {anchors.length > 0 ? (
            <span className="rounded-full bg-off px-3 py-1 text-sm font-medium text-bg">
              {anchors.length} anchor{anchors.length === 1 ? '' : 's'} stay put
            </span>
          ) : (
            <span className="text-sm text-muted">No shared fretted finger on this pair</span>
          )}
        </div>
      </div>

      <label className="block space-y-2">
        <div className="flex justify-between text-sm text-muted">
          <span>Change animation</span>
          <span className="tabular-nums">{Math.round(animSpeed * 100)}%</span>
        </div>
        <input
          type="range"
          min={25}
          max={100}
          step={5}
          value={Math.round(animSpeed * 100)}
          aria-label="Change animation speed, decoupled from tempo"
          onChange={(e) => setAnimSpeed(Number(e.target.value) / 100)}
          className="h-8 w-full accent-amber"
        />
      </label>

      <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-surface px-4">
        <span>No strum — shapes only</span>
        <input
          type="checkbox"
          className="h-6 w-6 accent-amber"
          checked={noStrum}
          onChange={(e) => setNoStrum(e.target.checked)}
        />
      </label>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {OPEN_CHANGE_PAIRS.map(([a, b]) => (
          <button
            key={`${a}-${b}`}
            type="button"
            onClick={() => setPair(a, b)}
            className={[
              'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
              fromId === a && toId === b ? 'bg-amber text-bg' : 'bg-surface text-ink',
            ].join(' ')}
          >
            {a} – {b}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-surface px-4 py-4">
        <p className="text-muted">One-minute changes</p>
        <p className="font-display text-2xl">
          {minuteLeft !== null
            ? `${minuteLeft.toFixed(1)}s left`
            : `${minuteLast} clean in 60.0s. Best ${minuteBest}.`}
        </p>
        <p className="mt-1 text-sm text-muted">
          A change counts as clean when an onset lands within 80ms of the bar line.
        </p>
        <button
          type="button"
          onClick={() => void startMinute()}
          disabled={minuteLeft !== null}
          className="mt-3 min-h-12 w-full rounded-2xl bg-amber font-medium text-bg disabled:opacity-60"
        >
          Count for 60.0 seconds
        </button>
      </div>
    </div>
  )
}
