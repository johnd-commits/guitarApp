import { useEffect, useRef, useState } from 'react'
import {
  MAX_TEMPO,
  MIN_TEMPO,
  type TransportDisplayMode,
  useSettingsStore,
} from '../stores/settingsStore'
import { metronomeEngine } from '../audio/metronomeEngine'
import { PendulumStrum } from './PendulumStrum'

const HIDE_AFTER_MS = 4000

const DISPLAY_MODES: { mode: TransportDisplayMode; label: string; hint: string }[] = [
  { mode: 'pinned', label: 'Pin', hint: 'Keep metronome open' },
  { mode: 'auto', label: 'Auto', hint: 'Hide after 4 seconds idle' },
  { mode: 'collapsed', label: 'Hide', hint: 'Keep metronome collapsed until you open it' },
]

export function TransportBar() {
  const tempo = useSettingsStore((s) => s.tempo)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const displayMode = useSettingsStore((s) => s.transportDisplayMode)
  const setTempo = useSettingsStore((s) => s.setTempo)
  const togglePlaying = useSettingsStore((s) => s.togglePlaying)
  const setDisplayMode = useSettingsStore((s) => s.setTransportDisplayMode)
  const [manualExpanded, setManualExpanded] = useState(false)
  const hideTimer = useRef<number | null>(null)

  const expanded = displayMode === 'pinned' || manualExpanded

  function clearHideTimer() {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  function scheduleHide() {
    if (displayMode !== 'auto') return
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => {
      setManualExpanded(false)
      hideTimer.current = null
    }, HIDE_AFTER_MS)
  }

  function openPanel() {
    setManualExpanded(true)
    if (displayMode === 'auto') scheduleHide()
  }

  function closePanel() {
    clearHideTimer()
    setManualExpanded(false)
  }

  function onShowMetronomeTap() {
    if (displayMode === 'collapsed' && manualExpanded) {
      closePanel()
      return
    }
    openPanel()
  }

  function onInteraction() {
    if (displayMode === 'auto' && manualExpanded) scheduleHide()
  }

  useEffect(() => () => clearHideTimer(), [])

  useEffect(() => {
    if (displayMode === 'auto' && manualExpanded) scheduleHide()
    else clearHideTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm only when mode or expansion changes
  }, [displayMode, manualExpanded])

  async function onPlayToggle() {
    if (!isPlaying) {
      await metronomeEngine.unlock()
    }
    togglePlaying()
  }

  return (
    <div className="border-t border-line bg-raised px-4 pb-3 pt-1">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 flex items-center justify-end gap-1">
          <span className="mr-1 text-xs text-muted">Metronome panel</span>
          {DISPLAY_MODES.map(({ mode, label, hint }) => (
            <button
              key={mode}
              type="button"
              aria-pressed={displayMode === mode}
              aria-label={hint}
              title={hint}
              onClick={() => setDisplayMode(mode)}
              className={[
                'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                displayMode === mode
                  ? 'bg-amber text-bg'
                  : 'bg-surface text-off ring-1 ring-line',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {expanded ? <PendulumStrum /> : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onPlayToggle()}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Stop' : 'Play'}
            className={[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
              isPlaying ? 'bg-amber text-bg' : 'bg-surface text-ink ring-1 ring-line',
            ].join(' ')}
          >
            {isPlaying ? <StopGlyph /> : <PlayGlyph />}
          </button>

          {expanded ? (
            <div className="min-w-0 flex-1" onPointerDown={onInteraction}>
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
                onChange={(e) => {
                  setTempo(Number(e.target.value))
                  onInteraction()
                }}
                className="tempo-slider h-8 w-full cursor-pointer appearance-none bg-transparent"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onShowMetronomeTap}
              className="min-h-12 min-w-0 flex-1 rounded-2xl bg-surface px-3 text-left"
              aria-expanded={false}
            >
              <span className="font-display text-xl tabular-nums">{tempo}</span>
              <span className="ml-1 text-sm text-muted">BPM</span>
              <span className="ml-2 text-sm text-off">Show metronome</span>
            </button>
          )}

          {expanded && displayMode !== 'pinned' ? (
            <button
              type="button"
              onClick={closePanel}
              className="shrink-0 py-2 text-sm text-off"
            >
              Hide
            </button>
          ) : null}
        </div>
      </div>
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
