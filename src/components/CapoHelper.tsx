import { useState } from 'react'
import { capoForKey } from '../chords/barre'
import { useSettingsStore } from '../stores/settingsStore'

const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Am', 'Em', 'Dm']
const SHAPES = ['G', 'C', 'D', 'Em', 'Am', 'E', 'A']

export function CapoHelper() {
  const setCapo = useSettingsStore((s) => s.setCapoPosition)
  const [key, setKey] = useState('A')
  const suggestions = capoForKey(key, SHAPES)

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">Where do I put the capo</p>
      <p className="text-sm text-muted">
        Pick the sounding key. Shapes you already know are listed with the fret
        that makes them sound in that key.
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {KEYS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKey(item)}
            className={[
              'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
              key === item ? 'bg-amber text-bg' : 'bg-raised text-ink',
            ].join(' ')}
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {suggestions.map((item) => (
          <li key={item.shape}>
            <button
              type="button"
              onClick={() => setCapo(item.capo)}
              className="w-full rounded-xl bg-raised px-3 py-3 text-left"
            >
              {item.capo === 0
                ? `Play ${item.shape} open, sounds as ${item.sounding}`
                : `Capo fret ${item.capo} — play ${item.shape} shape, sounds as ${item.sounding}`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
