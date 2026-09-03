import { useState } from 'react'
import { BackingControls } from '../components/BackingControls'
import { BeatToggles } from '../components/BeatToggles'
import { ChangeTrainer } from '../components/ChangeTrainer'
import { CheckMyChord } from '../components/CheckMyChord'
import { ChordFollow } from '../components/ChordFollow'
import { MetronomeControls } from '../components/MetronomeControls'
import { MicOnboarding } from '../components/MicOnboarding'
import { PatternPicker } from '../components/PatternPicker'
import { StrumScope } from '../components/StrumScope'
import { TunerView } from '../components/TunerView'
import { useOnsetCapture } from '../hooks/useOnsetCapture'
import { useBackingStore } from '../stores/backingStore'
import { useChangeTrainerStore } from '../stores/changeTrainerStore'
import { useSessionStore } from '../stores/sessionStore'
import { useSettingsStore } from '../stores/settingsStore'

export function PracticePage() {
  const onboarded = useSessionStore((s) => s.micOnboarded)
  const gateOpen = useSessionStore((s) => s.practiceGateOpen)
  const setMicOnboarded = useSessionStore((s) => s.setMicOnboarded)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  useOnsetCapture(onboarded && gateOpen && isPlaying)
  const noStrum = useChangeTrainerStore((s) => s.noStrum)
  const solo = useBackingStore((s) => s.solo)
  const [mode, setMode] = useState<'follow' | 'changes'>('follow')

  if (!onboarded) {
    return <MicOnboarding onContinue={() => setMicOnboarded(true)} />
  }

  if (!gateOpen) {
    return <TunerView mode="gate" />
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Practice</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Keep the arm moving
        </h1>
        <p className="text-muted">
          Two necks, then a moving pick on the DOWN / UP arrows. Switch lights
          1.0 beat before the change — let the arm keep going even if the shape is late.
        </p>
      </div>

      {solo ? (
        <p className="font-display text-xl text-amber">
          Solo — band only. No pattern, no analysis, nothing stored.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('follow')}
              className={[
                'min-h-12 rounded-2xl font-medium',
                mode === 'follow' ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              Follow
            </button>
            <button
              type="button"
              onClick={() => setMode('changes')}
              className={[
                'min-h-12 rounded-2xl font-medium',
                mode === 'changes' ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              Changes
            </button>
          </div>
          {mode === 'follow' ? <ChordFollow /> : <ChangeTrainer />}
          {!noStrum ? <StrumScope /> : null}
          <CheckMyChord />
          {mode === 'follow' || !noStrum ? <PatternPicker /> : null}
        </>
      )}
      <BackingControls />
      <BeatToggles />
      <MetronomeControls />
    </section>
  )
}
