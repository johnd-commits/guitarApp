import { useEffect, useState } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { selectActivePattern, useStrumStore } from '../stores/strumStore'
import { currentPatternSlot } from '../strum/motion'
import type { StrumSlot } from '../strum/types'

export function StrumPatternDisplay() {
  const pattern = useStrumStore(selectActivePattern)
  const cycleSlot = useStrumStore((s) => s.cycleSlot)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const tempo = useSettingsStore((s) => s.tempo)
  const swing = useMetronomeStore((s) => s.swing)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      if (pos) {
        const elapsed = pos.currentTime - pos.originTime
        setCurrent(
          currentPatternSlot(elapsed, pattern, {
            tempo,
            timeSignature,
            swing: timeSignature === '12/8' ? 0 : swing,
          }),
        )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pattern, tempo, swing, timeSignature, isPlaying])

  return (
    <div className="space-y-2">
      <p className="text-muted">Pattern — tap a slot to cycle hit / miss / chuck</p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${pattern.slots.length}, minmax(0, 1fr))` }}
      >
        {pattern.slots.map((slot, index) => (
          <button
            key={index}
            type="button"
            onClick={() => cycleSlot(index)}
            aria-label={slotLabel(slot, index)}
            className={[
              'flex min-h-16 items-center justify-center rounded-xl',
              isPlaying && current === index ? 'bg-amber text-bg' : 'bg-surface text-ink',
            ].join(' ')}
          >
            <SlotGlyph slot={slot} active={isPlaying && current === index} />
          </button>
        ))}
      </div>
    </div>
  )
}

function slotLabel(slot: StrumSlot, index: number): string {
  const beat = Math.floor(index / 2) + 1
  const and = index % 2 === 1 ? ' and' : ''
  return `${slot.kind.toLowerCase()} ${slot.direction.toLowerCase()} on ${beat}${and}`
}

function SlotGlyph({ slot, active }: { slot: StrumSlot; active: boolean }) {
  if (slot.kind === 'MUTE') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6 L18 18 M18 6 L6 18"
          stroke={active ? 'currentColor' : 'var(--color-off)'}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  const faded = slot.kind === 'MISS'
  const color = active ? 'currentColor' : faded ? 'var(--color-off)' : 'var(--color-ink)'
  const pointingDown = slot.direction === 'DOWN'

  return (
    <svg
      width="22"
      height="28"
      viewBox="0 0 24 32"
      aria-hidden="true"
      style={{ opacity: faded ? 0.4 : 1 }}
    >
      {pointingDown ? (
        <path
          d="M12 2 V22 M12 22 L5 14 M12 22 L19 14"
          fill="none"
          stroke={color}
          strokeWidth={slot.accent ? 3.2 : 2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M12 30 V10 M12 10 L5 18 M12 10 L19 18"
          fill="none"
          stroke={color}
          strokeWidth={slot.accent ? 3.2 : 2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
