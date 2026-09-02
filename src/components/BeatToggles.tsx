import { useMetronomeStore } from '../stores/metronomeStore'

export function BeatToggles() {
  const beats = useMetronomeStore((s) => s.beats)
  const currentBeat = useMetronomeStore((s) => s.currentBeat)
  const toggleMute = useMetronomeStore((s) => s.toggleMute)
  const toggleAccent = useMetronomeStore((s) => s.toggleAccent)

  return (
    <div className="space-y-2">
      <p className="text-muted">Beats — tap to mute, accent sits underneath</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${beats.length}, minmax(0, 1fr))` }}>
        {beats.map((beat, index) => {
          const isNow = currentBeat === index
          return (
            <div key={index} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => toggleMute(index)}
                aria-pressed={!beat.muted}
                aria-label={`Beat ${index + 1}${beat.muted ? ', muted' : ''}`}
                className={[
                  'flex min-h-16 items-center justify-center rounded-2xl text-2xl font-display transition-colors',
                  beat.muted
                    ? isNow
                      ? 'bg-surface text-off ring-2 ring-off'
                      : 'bg-surface text-off'
                    : isNow
                      ? 'bg-amber text-bg'
                      : 'bg-raised text-ink ring-1 ring-line',
                ].join(' ')}
              >
                {index + 1}
              </button>
              <button
                type="button"
                onClick={() => toggleAccent(index)}
                aria-pressed={beat.accent}
                aria-label={`Accent beat ${index + 1}`}
                className={[
                  'min-h-10 rounded-xl text-sm font-medium',
                  beat.accent ? 'bg-amber/20 text-amber' : 'bg-surface text-off',
                ].join(' ')}
              >
                Accent
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
