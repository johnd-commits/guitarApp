import { useEffect, useRef } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { selectActivePattern, useStrumStore } from '../stores/strumStore'
import { patternPlayhead } from '../strum/motion'
import type { StrumSlot } from '../strum/types'

export function StrumPatternDisplay() {
  const pattern = useStrumStore(selectActivePattern)
  const cycleSlot = useStrumStore((s) => s.cycleSlot)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const tempo = useSettingsStore((s) => s.tempo)
  const swing = useMetronomeStore((s) => s.swing)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const playheadRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    let raf = 0
    const swingAmt = timeSignature === '12/8' ? 0 : swing
    const config = { tempo, timeSignature, swing: swingAmt }

    const tick = () => {
      const pos = metronomeEngine.getPosition()
      const playhead = playheadRef.current

      if (playhead) {
        if (pos && isPlaying) {
          const elapsed = pos.currentTime - pos.originTime
          const { index, phase } = patternPlayhead(elapsed, pattern, config)
          playhead.style.opacity = '1'
          playhead.style.transform = `translateX(${(index + phase) * 100}%)`
          slotRefs.current.forEach((el, i) => {
            if (!el) return
            const on = i === index
            el.dataset.active = on ? 'true' : 'false'
            const glyph = el.querySelector<HTMLElement>('[data-glyph]')
            if (!glyph) return
            const slot = pattern.slots[i]
            const travel = on && slot.kind === 'HIT' ? phase * 10 : 0
            glyph.style.transform = `translateY(${slot.direction === 'DOWN' ? travel : -travel}px)`
          })
        } else {
          playhead.style.opacity = '0'
          playhead.style.transform = 'translateX(0%)'
          slotRefs.current.forEach((el) => {
            if (!el) return
            el.dataset.active = 'false'
            const glyph = el.querySelector<HTMLElement>('[data-glyph]')
            if (glyph) glyph.style.transform = 'translateY(0)'
          })
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pattern, tempo, swing, timeSignature, isPlaying])

  const n = pattern.slots.length

  return (
    <div className="space-y-2">
      <p className="text-muted">Tap a slot to cycle hit / miss / chuck</p>
      <div className="strum-lane overflow-hidden rounded-3xl px-3 pb-3 pt-5">
        <div className="relative">
          <div
            ref={playheadRef}
            className="strum-playhead absolute inset-y-0 left-0 z-10 opacity-0"
            style={{ width: `${100 / n}%` }}
            aria-hidden="true"
          >
            <div className="mx-auto h-full w-1 rounded-full bg-amber" />
            <svg
              className="absolute left-1/2 top-0 -translate-x-1/2"
              width="18"
              height="22"
              viewBox="0 0 18 22"
            >
              <path d="M9 1 L17 9 L9 21 L1 9 Z" fill="var(--color-amber)" />
            </svg>
          </div>
          <div
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          >
          {pattern.slots.map((slot, index) => (
            <button
              key={index}
              type="button"
              ref={(el) => {
                slotRefs.current[index] = el
              }}
              onClick={() => cycleSlot(index)}
              aria-label={slotLabel(slot, index)}
              data-active="false"
              className="strum-slot flex min-h-28 items-center justify-center rounded-xl"
            >
              <SlotGlyph slot={slot} />
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function slotLabel(slot: StrumSlot, index: number): string {
  const beat = Math.floor(index / 2) + 1
  const and = index % 2 === 1 ? ' and' : ''
  return `${slot.kind.toLowerCase()} ${slot.direction.toLowerCase()} on ${beat}${and}`
}

function SlotGlyph({ slot }: { slot: StrumSlot }) {
  if (slot.kind === 'MUTE') {
    return (
      <span className="flex h-full flex-col items-center justify-center">
        <span data-glyph className="flex">
          <svg width="22" height="28" viewBox="0 0 24 32" aria-hidden="true">
            <path
              d="M6 8 L18 24 M18 8 L6 24"
              fill="none"
              stroke="var(--color-bg)"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
    )
  }

  const down = slot.direction === 'DOWN'
  const hit = slot.kind === 'HIT'
  const fill = hit
    ? down
      ? 'var(--color-down)'
      : 'var(--color-up)'
    : 'transparent'
  const stroke = hit ? fill : 'var(--color-line)'

  return (
    <span
      className={[
        'grid h-full w-full grid-rows-[1.1rem_1fr_1.1rem] place-items-center',
        hit ? '' : 'opacity-35',
      ].join(' ')}
    >
      <span className="text-[0.6rem] font-bold tracking-wide text-bg">
        {hit && !down ? 'UP' : '\u00a0'}
      </span>
      <span data-glyph className="flex">
        {/* SVG y grows downward. DOWN tip sits at the floor (high E);
            UP tip sits at the top. Labels stay on the matching side. */}
        <svg width="28" height="36" viewBox="0 0 24 40" aria-hidden="true">
          {down ? (
            <path
              d="M12 38 L2 24 H7 V4 H17 V24 H22 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={slot.accent ? 2.4 : 1.6}
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M12 2 L22 16 H17 V36 H7 V16 H2 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={slot.accent ? 2.4 : 1.6}
              strokeLinejoin="round"
            />
          )}
        </svg>
      </span>
      <span className="text-[0.6rem] font-bold tracking-wide text-bg">
        {hit && down ? 'DOWN' : '\u00a0'}
      </span>
    </span>
  )
}
