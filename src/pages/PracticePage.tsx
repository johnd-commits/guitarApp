import { BeatToggles } from '../components/BeatToggles'
import { ChordFollow } from '../components/ChordFollow'
import { MetronomeControls } from '../components/MetronomeControls'
import { MicOnboarding } from '../components/MicOnboarding'
import { PatternPicker } from '../components/PatternPicker'
import { StrumPatternDisplay } from '../components/StrumPatternDisplay'
import { TunerView } from '../components/TunerView'
import { useSessionStore } from '../stores/sessionStore'

export function PracticePage() {
  const onboarded = useSessionStore((s) => s.micOnboarded)
  const gateOpen = useSessionStore((s) => s.practiceGateOpen)
  const setMicOnboarded = useSessionStore((s) => s.setMicOnboarded)

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
          Strum arrows and the neck move together. The next chord is previewed
          before the change — let the arm keep going even if the shape is late.
        </p>
      </div>

      <ChordFollow />
      <StrumPatternDisplay />
      <PatternPicker />
      <BeatToggles />
      <MetronomeControls />
    </section>
  )
}
