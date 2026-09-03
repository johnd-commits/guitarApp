import { useEffect, useRef, useState } from 'react'
import { MAX_TEMPO, MIN_TEMPO, useSettingsStore } from '../stores/settingsStore'
import { useSessionStore } from '../stores/sessionStore'
import { metronomeEngine } from '../audio/metronomeEngine'
import { PendulumStrum } from './PendulumStrum'
import { useLocation } from 'react-router-dom'

const HIDE_AFTER_MS = 4000

export function TransportBar() {
  const tempo = useSettingsStore((s) => s.tempo)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const setTempo = useSettingsStore((s) => s.setTempo)
  const togglePlaying = useSettingsStore((s) => s.togglePlaying)
  const gateOpen = useSessionStore((s) => s.practiceGateOpen)
  const onboarded = useSessionStore((s) => s.micOnboarded)
  const location = useLocation()
  const playAllowed =
    onboarded && gateOpen && location.pathname !== '/tuner'
  const [expanded, setExpanded] = useState(false)
  const hideTimer = useRef<number | null>(null)

  function clearHideTimer() {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  function scheduleHide() {
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => {
      setExpanded(false)
      hideTimer.current = null
    }, HIDE_AFTER_MS)
  }

  function bumpOpen() {
    setExpanded(true)
    scheduleHide()
  }

  useEffect(() => () => clearHideTimer(), [])

  useEffect(() => {
    if (expanded) scheduleHide()
    else clearHideTimer()
    // Playing does not keep the panel open — that is the whole point.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-arm when expanded flips
  }, [expanded])

  async function onPlayToggle() {
    if (!playAllowed) return
    if (!isPlaying) {
      await metronomeEngine.unlock()
    }
    togglePlaying()
  }

  return (
    <div className="border-t border-line bg-raised px-4 pb-3 pt-1">
      <div className="mx-auto max-w-lg">
        {expanded ? <PendulumStrum /> : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onPlayToggle()}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Stop' : 'Play'}
            aria-disabled={!playAllowed}
            className={[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
              !playAllowed
                ? 'bg-surface text-off ring-1 ring-line'
                : isPlaying
                  ? 'bg-amber text-bg'
                  : 'bg-surface text-ink ring-1 ring-line',
            ].join(' ')}
          >
            {isPlaying ? <StopGlyph /> : <PlayGlyph />}
          </button>

          {expanded ? (
            <div className="min-w-0 flex-1" onPointerDown={scheduleHide}>
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
                  scheduleHide()
                }}
                className="tempo-slider h-8 w-full cursor-pointer appearance-none bg-transparent"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={bumpOpen}
              className="min-h-12 min-w-0 flex-1 rounded-2xl bg-surface px-3 text-left"
              aria-expanded={false}
            >
              <span className="font-display text-xl tabular-nums">{tempo}</span>
              <span className="ml-1 text-sm text-muted">BPM</span>
              <span className="ml-2 text-sm text-off">Show metronome</span>
            </button>
          )}

          {expanded ? (
            <button
              type="button"
              onClick={() => {
                clearHideTimer()
                setExpanded(false)
              }}
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
