import { MAX_TEMPO, MIN_TEMPO, useSettingsStore } from '../stores/settingsStore'
import { metronomeEngine } from '../audio/metronomeEngine'

export function TransportBar() {
  const tempo = useSettingsStore((s) => s.tempo)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const setTempo = useSettingsStore((s) => s.setTempo)
  const togglePlaying = useSettingsStore((s) => s.togglePlaying)

  async function onPlayToggle() {
    if (!isPlaying) {
      await metronomeEngine.unlock()
    }
    togglePlaying()
  }

  return (
    <div className="border-t border-line bg-raised px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center gap-4">
        <button
          type="button"
          onClick={() => void onPlayToggle()}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? 'Stop' : 'Play'}
          className={[
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors',
            isPlaying
              ? 'bg-amber text-bg'
              : 'bg-surface text-ink ring-1 ring-line',
          ].join(' ')}
        >
          {isPlaying ? <StopGlyph /> : <PlayGlyph />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-muted">Tempo</span>
            <span className="font-display text-2xl tabular-nums text-ink">
              {tempo}
              <span className="ml-1 text-sm font-sans font-medium text-muted">BPM</span>
            </span>
          </div>
          <input
            type="range"
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            step={1}
            value={tempo}
            aria-label="Tempo in beats per minute"
            onChange={(e) => setTempo(Number(e.target.value))}
            className="tempo-slider h-8 w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>
      </div>

      <style>{`
        .tempo-slider {
          accent-color: #e8a838;
        }
        .tempo-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: #3d3830;
        }
        .tempo-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          margin-top: -8px;
          border-radius: 999px;
          background: #e8a838;
        }
        .tempo-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: #3d3830;
        }
        .tempo-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 999px;
          background: #e8a838;
        }
      `}</style>
    </div>
  )
}

function PlayGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  )
}

function StopGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  )
}
