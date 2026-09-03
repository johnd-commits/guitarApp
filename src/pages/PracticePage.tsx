import { BackingControls } from '../components/BackingControls'
import { BeatToggles } from '../components/BeatToggles'
import { ChangeTrainer } from '../components/ChangeTrainer'
import { CheckMyChord } from '../components/CheckMyChord'
import { ChordFollow } from '../components/ChordFollow'
import { LessonPlayer } from '../components/LessonPlayer'
import { MetronomeControls } from '../components/MetronomeControls'
import { MicOnboarding } from '../components/MicOnboarding'
import { PatternPicker } from '../components/PatternPicker'
import { SessionBuilder } from '../components/SessionBuilder'
import { SessionRecorder } from '../components/SessionRecorder'
import { StrumScope } from '../components/StrumScope'
import { TakeFeedback } from '../components/TakeFeedback'
import { TunerView } from '../components/TunerView'
import { useAttemptSession } from '../hooks/useAttemptSession'
import { useOnsetCapture } from '../hooks/useOnsetCapture'
import { useBackingStore } from '../stores/backingStore'
import { useChangeTrainerStore } from '../stores/changeTrainerStore'
import { usePracticeStore, type PracticeMode } from '../stores/practiceStore'
import { useSessionStore } from '../stores/sessionStore'
import { useSettingsStore } from '../stores/settingsStore'

const MODES: Array<{ id: PracticeMode; label: string }> = [
  { id: 'follow', label: 'Follow' },
  { id: 'changes', label: 'Changes' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'session', label: 'Session' },
]

export function PracticePage() {
  const onboarded = useSessionStore((s) => s.micOnboarded)
  const gateOpen = useSessionStore((s) => s.practiceGateOpen)
  const setMicOnboarded = useSessionStore((s) => s.setMicOnboarded)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  useOnsetCapture(onboarded && gateOpen && isPlaying)
  const take = useAttemptSession()
  const noStrum = useChangeTrainerStore((s) => s.noStrum)
  const solo = useBackingStore((s) => s.solo)
  const mode = usePracticeStore((s) => s.mode)
  const setMode = usePracticeStore((s) => s.setMode)

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
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={[
                  'min-h-12 rounded-2xl text-sm font-medium',
                  mode === item.id ? 'bg-amber text-bg' : 'bg-surface text-ink',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
          {mode === 'follow' ? <ChordFollow /> : null}
          {mode === 'changes' ? <ChangeTrainer /> : null}
          {mode === 'lessons' ? <LessonPlayer /> : null}
          {mode === 'session' ? <SessionBuilder /> : null}
          {mode === 'follow' || (mode === 'changes' && !noStrum) ? <StrumScope /> : null}
          {mode === 'follow' || mode === 'changes' ? <CheckMyChord /> : null}
          {mode === 'follow' || (mode === 'changes' && !noStrum) ? <PatternPicker /> : null}
          <TakeFeedback take={take} />
          <SessionRecorder keepPrompt={take.keepPrompt} />
        </>
      )}
      {solo ? <SessionRecorder keepPrompt={false} /> : null}
      <BackingControls />
      <BeatToggles />
      <MetronomeControls />
    </section>
  )
}
