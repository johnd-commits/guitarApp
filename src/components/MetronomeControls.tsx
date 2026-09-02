import { useMetronomeStore } from '../stores/metronomeStore'
import type { Subdivision, TimeSignature } from '../audio/timing'

const signatures: TimeSignature[] = ['4/4', '3/4', '12/8']
const subdivisions: { id: Subdivision; label: string }[] = [
  { id: 'quarter', label: 'Quarters' },
  { id: 'eighth', label: 'Eighths' },
  { id: 'sixteenth', label: 'Sixteenths' },
]

export function MetronomeControls() {
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const subdivision = useMetronomeStore((s) => s.subdivision)
  const swing = useMetronomeStore((s) => s.swing)
  const setTimeSignature = useMetronomeStore((s) => s.setTimeSignature)
  const setSubdivision = useMetronomeStore((s) => s.setSubdivision)
  const setSwing = useMetronomeStore((s) => s.setSwing)
  const swingArmed = timeSignature !== '12/8'

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-muted">Time signature</legend>
        <div className="grid grid-cols-3 gap-2">
          {signatures.map((sig) => (
            <button
              key={sig}
              type="button"
              onClick={() => setTimeSignature(sig)}
              className={[
                'min-h-12 rounded-2xl font-medium',
                timeSignature === sig ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              {sig}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-muted">Subdivision</legend>
        <div className="grid grid-cols-3 gap-2">
          {subdivisions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubdivision(item.id)}
              className={[
                'min-h-12 rounded-2xl px-1 text-sm font-medium',
                subdivision === item.id ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={`block space-y-2 ${swingArmed ? '' : 'opacity-50'}`}>
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Swing</span>
          <span className="tabular-nums">
            {swingArmed ? `${swing}%` : '12/8 is already triplets'}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={swing}
          disabled={!swingArmed}
          aria-label="Swing amount"
          onChange={(e) => setSwing(Number(e.target.value))}
          className="h-8 w-full cursor-pointer accent-amber disabled:cursor-not-allowed"
        />
      </label>
    </div>
  )
}
