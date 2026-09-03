import { getAudioContext } from '../audio/context'
import { SESSION_BLOCKS, useSessionBuilderStore } from '../stores/sessionBuilderStore'
import { useSettingsStore } from '../stores/settingsStore'
import { metronomeEngine } from '../audio/metronomeEngine'
import { useState, useEffect } from 'react'

export function SessionBuilder() {
  const active = useSessionBuilderStore((s) => s.active)
  const blockIndex = useSessionBuilderStore((s) => s.blockIndex)
  const blockOrigin = useSessionBuilderStore((s) => s.blockOrigin)
  const start = useSessionBuilderStore((s) => s.start)
  const stop = useSessionBuilderStore((s) => s.stop)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      setNow(getAudioContext().currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])

  const block = SESSION_BLOCKS[blockIndex]
  const elapsed = active && block ? Math.max(0, now - blockOrigin) : 0
  const remaining = block ? Math.max(0, block.seconds - elapsed) : 0

  async function begin() {
    await metronomeEngine.unlock()
    start(getAudioContext().currentTime)
    useSettingsStore.getState().setPlaying(true)
  }

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">15 minutes — assembled, not optional</p>
      <p className="text-sm text-muted">
        3 minutes pendulum, 5 minutes changes, 5 minutes the lesson you are on,
        2 minutes playing over a backing track with nothing stored. That last
        block is never scored.
      </p>
      <ol className="space-y-2">
        {SESSION_BLOCKS.map((item, i) => (
          <li
            key={item.id}
            className={[
              'rounded-2xl px-3 py-3',
              active && i === blockIndex ? 'bg-amber text-bg' : 'bg-raised text-ink',
            ].join(' ')}
          >
            <p className="font-medium">{item.label}</p>
            <p className="tabular-nums text-sm">
              {Math.round(item.seconds / 60)} min
              {active && i === blockIndex ? ` · ${Math.round(remaining)}s left` : ''}
            </p>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="min-h-12 w-full rounded-2xl bg-amber font-medium text-bg"
        onClick={() => (active ? stop() : void begin())}
      >
        {active ? 'End session' : 'Start 15 minutes'}
      </button>
    </div>
  )
}
