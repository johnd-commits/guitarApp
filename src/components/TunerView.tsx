import { useEffect, useRef, useState } from 'react'
import { getAudioContext, resumeAudioContext } from '../audio/context'
import { LOCK_CENTS } from '../audio/pitchConstants'
import { usePitchCapture } from '../hooks/usePitchCapture'
import { useSessionStore } from '../stores/sessionStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTunerStore } from '../stores/tunerStore'
import { TUNINGS, stringTargets, tuningById } from '../tuner/notes'
import { MicSettings } from './MicSettings'

export function TunerView({ mode }: { mode: 'gate' | 'standalone' }) {
  const [armed, setArmed] = useState(false)
  const [micGeneration, setMicGeneration] = useState(0)
  usePitchCapture(armed, micGeneration)
  const tuningId = useTunerStore((s) => s.tuningId)
  const setTuningId = useTunerStore((s) => s.setTuningId)
  const locks = useTunerStore((s) => s.locks)
  const live = useTunerStore((s) => s.live)
  const resetLocks = useTunerStore((s) => s.resetLocks)
  const capo = useSettingsStore((s) => s.capoPosition)
  const skip = useSessionStore((s) => s.openPracticeGate)
  const targets = stringTargets(tuningById(tuningId), capo)
  const inTune = live.cents !== null && Math.abs(live.cents) <= LOCK_CENTS
  const capoRef = useRef(capo)

  useEffect(() => {
    try {
      if (getAudioContext().state === 'running') setArmed(true)
    } catch {
      // jsdom and older browsers have no AudioContext
    }
  }, [])

  useEffect(() => {
    if (capoRef.current !== capo) {
      capoRef.current = capo
      resetLocks()
    }
  }, [capo, resetLocks])

  async function listen() {
    await resumeAudioContext()
    setArmed(true)
  }

  async function reopenMic() {
    await resumeAudioContext()
    setMicGeneration((n) => n + 1)
    setArmed(true)
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Tuner</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Six strings, detected automatically
        </h1>
        {capo > 0 ? (
          <p className="text-muted">
            Capo fret {capo} — targets sit {capo} semitone{capo === 1 ? '' : 's'} higher
            than the open-neck notes.
          </p>
        ) : (
          <p className="text-muted">
            Play any open string. A string locks after holding within {LOCK_CENTS}{' '}
            cents for 1.0s.
          </p>
        )}
      </div>

      <CentsBar cents={live.cents} inTune={inTune} />

      {!armed && (
        <button
          type="button"
          onClick={() => void listen()}
          className="min-h-14 w-full rounded-2xl bg-amber font-medium text-bg"
        >
          Tap to listen
        </button>
      )}

      <p className="text-center font-display text-2xl tabular-nums">
        {live.cents === null
          ? 'Waiting for a string'
          : `${Math.abs(live.cents).toFixed(0)} cents ${live.cents < 0 ? 'below' : 'above'} ${targets[live.detectedString ?? 0]?.name}`}
      </p>

      <div className="grid grid-cols-6 gap-1.5">
        {targets.map((target) => {
          const lock = locks[target.index]
          const active = live.detectedString === target.index
          return (
            <div
              key={target.index}
              className={[
                'flex min-h-20 flex-col items-center justify-center rounded-2xl px-1 text-center',
                lock.locked
                  ? 'bg-amber text-bg'
                  : active
                    ? 'bg-raised ring-2 ring-amber'
                    : 'bg-surface text-ink',
              ].join(' ')}
            >
              <span className="font-display text-lg leading-none">
                {target.name.replace(/\d+$/, '')}
              </span>
              <span className="mt-1 text-[0.7rem] text-current opacity-80">
                {lock.locked ? '1.0s' : `${Math.min(1, lock.heldSeconds).toFixed(1)}s`}
              </span>
            </div>
          )
        })}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-muted">Tuning</legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TUNINGS.map((tuning) => (
            <button
              key={tuning.id}
              type="button"
              onClick={() => setTuningId(tuning.id)}
              className={[
                'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
                tuningId === tuning.id ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              {tuning.name}
            </button>
          ))}
        </div>
      </fieldset>

      <MicSettings open={armed} onOpen={() => void reopenMic()} />

      {mode === 'gate' && (
        <button
          type="button"
          onClick={skip}
          className="w-full py-3 text-sm text-off underline-offset-4 hover:underline"
        >
          Skip, already tuned
        </button>
      )}
    </section>
  )
}

function CentsBar({ cents, inTune }: { cents: number | null; inTune: boolean }) {
  const clamped = cents === null ? 0 : Math.max(-50, Math.min(50, cents))
  const left = 50 + clamped

  return (
    <div className="relative h-10 rounded-2xl bg-surface">
      <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
      <div
        className={[
          'absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left,background-color]',
          inTune ? 'bg-amber' : 'bg-off',
        ].join(' ')}
        style={{ left: `${left}%` }}
      />
    </div>
  )
}
