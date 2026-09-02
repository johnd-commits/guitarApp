import { BeatToggles } from '../components/BeatToggles'
import { MetronomeControls } from '../components/MetronomeControls'

export function PracticePage() {

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Practice</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Metronome
        </h1>
        <p className="text-muted">
          Mute beats you want to carry yourself. Clicking only on 2 and 4 is
          the point — the pulse has to live in the arm, not in the speaker.
        </p>
      </div>

      <BeatToggles />
      <MetronomeControls />
    </section>
  )
}
