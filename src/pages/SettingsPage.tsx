import { useSettingsStore } from '../stores/settingsStore'

const micLabels = {
  unknown: 'Not requested yet',
  prompt: 'Browser will ask',
  granted: 'Allowed on this device',
  denied: 'Blocked in the browser',
} as const

export function SettingsPage() {
  const metronomeEnabled = useSettingsStore((s) => s.metronomeEnabled)
  const countInBars = useSettingsStore((s) => s.countInBars)
  const capoPosition = useSettingsStore((s) => s.capoPosition)
  const micPermissionState = useSettingsStore((s) => s.micPermissionState)
  const setMetronomeEnabled = useSettingsStore((s) => s.setMetronomeEnabled)
  const setCountInBars = useSettingsStore((s) => s.setCountInBars)
  const setCapoPosition = useSettingsStore((s) => s.setCapoPosition)

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Settings</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Instrument setup
        </h1>
        <p className="text-muted">
          These persist on this phone. Tempo lives on the transport so it is
          always within reach.
        </p>
      </div>

      <label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-surface px-4">
        <span>Metronome click</span>
        <input
          type="checkbox"
          className="h-6 w-6 accent-amber"
          checked={metronomeEnabled}
          onChange={(e) => setMetronomeEnabled(e.target.checked)}
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-muted">Count-in</legend>
        <div className="grid grid-cols-2 gap-2">
          {([1, 2] as const).map((bars) => (
            <button
              key={bars}
              type="button"
              onClick={() => setCountInBars(bars)}
              className={[
                'min-h-14 rounded-2xl px-4 font-medium',
                countInBars === bars
                  ? 'bg-amber text-bg'
                  : 'bg-surface text-ink',
              ].join(' ')}
            >
              {bars} {bars === 1 ? 'bar' : 'bars'}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Capo</span>
          <span className="tabular-nums">
            {capoPosition === 0 ? 'Off' : `Fret ${capoPosition}`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={1}
          value={capoPosition}
          aria-label="Capo fret position"
          onChange={(e) => setCapoPosition(Number(e.target.value))}
          className="h-8 w-full cursor-pointer accent-amber"
        />
      </label>

      <div className="rounded-2xl bg-surface px-4 py-4">
        <p className="text-muted">Microphone</p>
        <p className="mt-1">{micLabels[micPermissionState]}</p>
        <p className="mt-2 text-sm text-off">
          Audio is processed on this device. Nothing is uploaded unless you
          opt in, recording by recording.
        </p>
      </div>
    </section>
  )
}
