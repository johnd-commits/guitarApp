import { useEffect, useRef } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { beatPhaseAt, pendulumNorm } from '../strum/motion'

const MAX_TILT = 48

export function PendulumStrum() {
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const tempo = useSettingsStore((s) => s.tempo)
  const swing = useMetronomeStore((s) => s.swing)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const armRef = useRef<SVGGElement>(null)
  const fillRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const pos = metronomeEngine.getPosition()
      const swingAmt = timeSignature === '12/8' ? 100 : swing
      let norm = -1
      if (pos) {
        const elapsed = pos.currentTime - pos.originTime
        const phase = beatPhaseAt(elapsed, tempo)
        norm = elapsed < 0 ? -1 : pendulumNorm(phase, swingAmt)
      } else if (isPlaying) {
        norm = -1
      }
      const tilt = -norm * MAX_TILT
      const downness = (norm + 1) / 2
      if (armRef.current) {
        armRef.current.setAttribute('transform', `rotate(${tilt} 60 28)`)
      }
      if (fillRef.current) {
        fillRef.current.setAttribute(
          'fill',
          downness > 0.5 ? 'var(--color-amber)' : 'var(--color-off)',
        )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, tempo, swing, timeSignature])

  return (
    <div className="flex flex-col items-center pb-1 pt-2" aria-hidden="true">
      <svg width="120" height="88" viewBox="0 0 120 88" className="overflow-visible">
        <circle cx="60" cy="28" r="5" fill="var(--color-muted)" />
        <g ref={armRef} transform="rotate(-48 60 28)">
          <path
            ref={fillRef}
            d="M60 22 L70 58 L60 78 L50 58 Z"
            fill="var(--color-off)"
          />
        </g>
      </svg>
      <p className="text-xs tracking-wide text-muted">
        Arm keeps moving — down on the beat, up on the and
      </p>
    </div>
  )
}
