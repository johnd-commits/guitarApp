import { PATTERN_LIBRARY } from '../strum/library'
import { useStrumStore } from '../stores/strumStore'

export function PatternPicker() {
  const patternId = useStrumStore((s) => s.patternId)
  const customPattern = useStrumStore((s) => s.customPattern)
  const setPatternId = useStrumStore((s) => s.setPatternId)

  const items = [
    ...PATTERN_LIBRARY.map((p) => ({ id: p.id, name: p.name })),
    ...(customPattern ? [{ id: 'custom', name: 'Custom' }] : []),
  ]

  return (
    <div className="space-y-2">
      <p className="text-muted">Library</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPatternId(item.id)}
            className={[
              'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
              patternId === item.id ? 'bg-amber text-bg' : 'bg-surface text-ink',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}
