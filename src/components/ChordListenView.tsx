import { useEffect, useRef, useState } from 'react'
import {
  CHROMA_WINDOW_SECONDS,
  GUESS_HISTORY,
  NOTE_NAMES,
  guessFromChroma,
  majorityGuess,
  type ChordGuess,
} from '../audio/chroma'
import { getAudioContext, resumeAudioContext } from '../audio/context'
import { shapeForGuess } from '../chords/heardShape'
import { useChromaCapture } from '../hooks/useChromaCapture'
import { useOnsetStore } from '../stores/onsetStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ChordDiagram } from './ChordDiagram'
import { MicSettings } from './MicSettings'

export function ChordListenView() {
  const [armed, setArmed] = useState(false)
  const [micGeneration, setMicGeneration] = useState(0)
  useChromaCapture(armed, micGeneration)
  const chroma = useOnsetStore((s) => s.chroma)
  const energy = useOnsetStore((s) => s.chromaEnergy)
  const capo = useSettingsStore((s) => s.capoPosition)
  const history = useRef<Array<ChordGuess | null>>([])
  const [stable, setStable] = useState<ChordGuess | null>(null)

  useEffect(() => {
    try {
      if (getAudioContext().state === 'running') setArmed(true)
    } catch {
      // jsdom and older browsers have no AudioContext
    }
  }, [])

  useEffect(() => {
    const next = chroma ? guessFromChroma(chroma, energy) : null
    history.current = [...history.current, next].slice(-GUESS_HISTORY)
    setStable(majorityGuess(history.current))
  }, [chroma, energy])

  async function listen() {
    await resumeAudioContext()
    setArmed(true)
  }

  async function reopenMic() {
    history.current = []
    setStable(null)
    useOnsetStore.getState().clear()
    await resumeAudioContext()
    setMicGeneration((n) => n + 1)
    setArmed(true)
  }

  const shape = stable ? shapeForGuess(stable) : null
  const holdSeconds = GUESS_HISTORY * CHROMA_WINDOW_SECONDS

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Name this chord</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Strum and hold — the name is from the pitch mix
        </h1>
        <p className="text-muted">
          Audio stays on this phone. A name appears after the same chord holds
          for about {holdSeconds.toFixed(1)}s ({GUESS_HISTORY} chromagrams).
          {capo > 0
            ? ` Capo fret ${capo} — the name is the sounding chord, not the shape under the capo.`
            : ''}
        </p>
      </div>

      {!armed && (
        <button
          type="button"
          onClick={() => void listen()}
          className="min-h-14 w-full rounded-2xl bg-amber font-medium text-bg"
        >
          Tap to listen
        </button>
      )}

      <p className="text-center font-display text-3xl font-semibold">
        {stable
          ? `${stable.name} — ${(stable.confidence * 100).toFixed(0)}% chroma match`
          : armed
            ? 'Waiting for a ringing chord'
            : 'Microphone is closed'}
      </p>

      <ChromaBars chroma={chroma} />

      {shape ? (
        <ChordDiagram
          chord={shape}
          state="active"
          capoFret={0}
          sounding={shape.name}
        />
      ) : stable ? (
        <p className="rounded-2xl bg-surface px-4 py-4 text-muted">
          No stored diagram for {stable.name}. The name is still the closest
          match in the 12 pitch-class mix.
        </p>
      ) : null}

      <MicSettings open={armed} onOpen={() => void reopenMic()} meter="none" />
    </section>
  )
}

function ChromaBars({ chroma }: { chroma: Float64Array | null }) {
  return (
    <div
      className="grid grid-cols-12 gap-1 rounded-2xl bg-surface px-3 py-3"
      aria-hidden={chroma === null}
    >
      {NOTE_NAMES.map((name, i) => {
        const value = chroma?.[i] ?? 0
        const height = Math.round(Math.max(0.08, value) * 100)
        return (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end rounded-md bg-raised">
              <div
                className="w-full rounded-md bg-amber"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-muted">{name}</span>
          </div>
        )
      })}
    </div>
  )
}
