import { bluesDegree } from '../audio/backing'
import { backingEngine } from '../audio/backingEngine'
import { metronomeEngine } from '../audio/metronomeEngine'
import { BACKING_STYLES, useBackingStore } from '../stores/backingStore'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useEffect, useState } from 'react'

export function BackingControls() {
  const enabled = useBackingStore((s) => s.enabled)
  const style = useBackingStore((s) => s.style)
  const solo = useBackingStore((s) => s.solo)
  const headphonesNoted = useBackingStore((s) => s.headphonesNoted)
  const setEnabled = useBackingStore((s) => s.setEnabled)
  const setStyle = useBackingStore((s) => s.setStyle)
  const setSolo = useBackingStore((s) => s.setSolo)
  const noteHeadphones = useBackingStore((s) => s.noteHeadphones)
  const currentBeat = useMetronomeStore((s) => s.currentBeat)
  const tempo = useSettingsStore((s) => s.tempo)
  const [bar, setBar] = useState(0)

  useEffect(() => {
    backingEngine.setConfig({ enabled, style, solo })
  }, [enabled, style, solo])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      if (pos) {
        const elapsed = pos.currentTime - pos.originTime
        const beatLen = 60 / tempo
        setBar(Math.max(0, Math.floor(elapsed / (beatLen * 4)) % 12))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [currentBeat, tempo])

  return (
    <div className="space-y-3">
      <p className="text-muted">Backing — synthesised onto the same grid. You are the guitar.</p>
      {!headphonesNoted && enabled ? (
        <p className="rounded-2xl bg-raised px-4 py-3 text-sm text-off">
          Headphones keep the drums out of the mic. Speaker bleed is gated, but
          closed-back phones are the real fix.
          <button type="button" className="ml-2 underline" onClick={() => noteHeadphones()}>
            Got it
          </button>
        </p>
      ) : null}
      <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-surface px-4">
        <span>Band on</span>
        <input
          type="checkbox"
          className="h-6 w-6 accent-amber"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
      </label>
      <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-surface px-4">
        <span>Solo — no pattern, no analysis</span>
        <input
          type="checkbox"
          className="h-6 w-6 accent-amber"
          checked={solo}
          onChange={(e) => setSolo(e.target.checked)}
        />
      </label>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {BACKING_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStyle(item.id)}
            className={[
              'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-medium',
              style === item.id ? 'bg-amber text-bg' : 'bg-surface text-ink',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>
      {style === 'shuffle-blues' ? (
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={[
                'flex min-h-12 items-center justify-center rounded-xl text-sm font-medium',
                i === bar ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              {bluesDegree(i)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
