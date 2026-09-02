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
  const music = musicalPosition(isPlaying ? elapsed : 0, tempo, timeSignature, countInBars)
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

  const callout = music.inCountIn
    ? `${current.name} starts in ${remainingWhole} beat${remainingWhole === 1 ? '' : 's'}`
    : remainingWhole <= 0
      ? `Now ${current.name}`
      : remainingWhole <= 1
        ? `Change — ${next.name} on the next beat`
        : `Now ${current.name}. Next ${next.name} in ${remainingWhole} beats`

  return (
    <div className="space-y-3">
      <p className="font-display text-xl text-amber">{callout}</p>
      <p className="text-sm text-muted">
        Neck shows finger numbers. Teal dots stay put through the change.
        The next shape lights before you switch, in time with the strum arrows.
      </p>

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
