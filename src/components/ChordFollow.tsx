import { useEffect, useState } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { beatsPerBar } from '../audio/timing'
import {
  PROGRESSIONS,
  anchorFingers,
  beatsUntilChange,
  chordById,
  chordIndexAtBar,
  progressionById,
  soundingName,
} from '../chords/library'
import { musicalPosition } from '../chords/position'
import { useChordFollowStore } from '../stores/chordFollowStore'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ChordDiagram } from './ChordDiagram'
import { StrumPatternDisplay } from './StrumPatternDisplay'

export function ChordFollow() {
  const progressionId = useChordFollowStore((s) => s.progressionId)
  const setProgressionId = useChordFollowStore((s) => s.setProgressionId)
  const progression = progressionById(progressionId)
  const tempo = useSettingsStore((s) => s.tempo)
  const capo = useSettingsStore((s) => s.capoPosition)
  const countInBars = useSettingsStore((s) => s.countInBars)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isPlaying) {
      setElapsed(0)
      return
    }
    let raf = 0
    let lastKey = ''
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      const nextElapsed = pos ? pos.currentTime - pos.originTime : 0
      const music = musicalPosition(nextElapsed, tempo, timeSignature, countInBars)
      const remaining = music.inCountIn
        ? music.countInBeatsLeft
        : beatsUntilChange(
            music.songBar,
            music.beat,
            music.beatPhase,
            beatsPerBar(timeSignature),
            progression.barsPerChord,
          )
      const key = `${music.songBar}:${music.inCountIn}:${remaining.toFixed(1)}`
      if (key !== lastKey) {
        lastKey = key
        setElapsed(nextElapsed)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, tempo, timeSignature, countInBars, progression.barsPerChord])

  const bpb = beatsPerBar(timeSignature)
  const music = musicalPosition(
    isPlaying ? elapsed : 0,
    tempo,
    timeSignature,
    isPlaying ? countInBars : 0,
  )
  const { currentIndex, nextIndex } = chordIndexAtBar(music.songBar, progression)
  const current = chordById(progression.chordIds[currentIndex])
  const next = chordById(progression.chordIds[nextIndex])
  const remaining = music.inCountIn
    ? music.countInBeatsLeft
    : beatsUntilChange(
        music.songBar,
        music.beat,
        music.beatPhase,
        bpb,
        progression.barsPerChord,
      )
  const changeImminent = !music.inCountIn && remaining <= 1
  const anchors = anchorFingers(current, next)
  const remainingWhole = Math.max(0, Math.ceil(remaining - 0.001))
  const remainingTenths = Math.max(0, remaining)

  const callout = music.inCountIn
    ? `${current.name} starts in ${remainingWhole} beat${remainingWhole === 1 ? '' : 's'}`
    : remainingWhole <= 0
      ? `Now ${current.name}`
      : `Now ${current.name}. Switch to ${next.name} in ${remainingTenths.toFixed(1)} beats`

  return (
    <div className="space-y-3">
      <p className="font-display text-xl text-amber">{callout}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-sm text-muted">Now</p>
          <ChordDiagram
            chord={current}
            state="active"
            anchors={changeImminent ? anchors : []}
            capoFret={capo}
            sounding={soundingName(current.name, capo)}
          />
        </div>
        <div>
          <p className="mb-1 text-sm text-muted">Next</p>
          <ChordDiagram
            chord={next}
            state={changeImminent ? 'upcoming' : 'idle'}
            capoFret={capo}
            sounding={soundingName(next.name, capo)}
          />
        </div>
      </div>

      <SwitchCue
        hot={changeImminent}
        nextName={next.name}
        remaining={remainingTenths}
        inCountIn={music.inCountIn}
      />

      <StrumPatternDisplay />

      <fieldset className="space-y-2">
        <legend className="text-muted">Chords</legend>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {PROGRESSIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setProgressionId(item.id)}
              className={[
                'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
                progressionId === item.id ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              {item.name}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function SwitchCue({
  hot,
  nextName,
  remaining,
  inCountIn,
}: {
  hot: boolean
  nextName: string
  remaining: number
  inCountIn: boolean
}) {
  return (
    <div
      className="switch-cue flex items-center justify-center gap-3 py-1"
      data-hot={hot ? 'true' : 'false'}
      aria-hidden={inCountIn}
    >
      <svg width="36" height="40" viewBox="0 0 52 56" aria-hidden="true">
        <path
          d="M26 6 V42 M26 42 L12 26 M26 42 L40 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <p className="font-display text-3xl leading-none">Switch</p>
        <p className="mt-0.5 text-sm text-muted">
          {inCountIn
            ? `Pattern starts after the count-in`
            : `${nextName} in ${remaining.toFixed(1)} beats`}
        </p>
      </div>
    </div>
  )
}
