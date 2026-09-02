import { BeatToggles } from '../components/BeatToggles'
import { MetronomeControls } from '../components/MetronomeControls'
import { PatternPicker } from '../components/PatternPicker'
import { StrumPatternDisplay } from '../components/StrumPatternDisplay'

export function PracticePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Practice</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Keep the arm moving
        </h1>
        <p className="text-muted">
          Mute clicks on 1 and 3 and watch the pendulum. Ghosted arrows are
          MISS slots — the arm still travels, the strings are not struck.
        </p>
      </div>

      <StrumPatternDisplay />
      <PatternPicker />
      <BeatToggles />
      <MetronomeControls />
    </section>
  )
}
