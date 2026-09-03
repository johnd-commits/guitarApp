import { useEffect, useRef } from 'react'
import { metronomeEngine } from '../audio/metronomeEngine'
import { expectedSlotsFromPattern } from '../audio/timingAnalyser'
import { beatsPerBar, secondsPerBeat } from '../audio/timing'
import { useMetronomeStore } from '../stores/metronomeStore'
import { useOnsetStore } from '../stores/onsetStore'
import { useSettingsStore } from '../stores/settingsStore'
import { selectActivePattern, useStrumStore } from '../stores/strumStore'

const BARS_VISIBLE = 4
const HEIGHT = 128

export function StrumScope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPlaying = useSettingsStore((s) => s.isPlaying)
  const tempo = useSettingsStore((s) => s.tempo)
  const latencyMs = useSettingsStore((s) => s.latencyOffsetMs)
  const timeSignature = useMetronomeStore((s) => s.timeSignature)
  const swing = useMetronomeStore((s) => s.swing)
  const pattern = useStrumStore(selectActivePattern)
  const report = useOnsetStore((s) => s.report)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let ctx: CanvasRenderingContext2D | null = null
    try {
      ctx = canvas.getContext('2d')
    } catch {
      return
    }
    if (!ctx) return
    let raf = 0

    const draw = () => {
      const css = getComputedStyle(document.documentElement)
      const muted = css.getPropertyValue('--color-muted').trim() || '#e0c8ae'
      const amber = css.getPropertyValue('--color-amber').trim() || '#ffc14d'
      const off = css.getPropertyValue('--color-off').trim() || '#7ec8e0'
      const line = css.getPropertyValue('--color-line').trim() || '#7a5336'

      const width = canvas.clientWidth
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(HEIGHT * dpr)) {
        canvas.width = Math.floor(width * dpr)
        canvas.height = Math.floor(HEIGHT * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, HEIGHT)

      const bpb = beatsPerBar(timeSignature)
      const barLen = secondsPerBeat(tempo) * bpb
      const visible = BARS_VISIBLE * barLen
      const nowX = width * 0.72
      const pxPerSec = width / visible
      const pos = metronomeEngine.getPosition()
      const now = pos ? pos.currentTime : 0
      const origin = pos ? pos.originTime : 0
      const latency = latencyMs / 1000

      const tLeft = now - nowX / pxPerSec
      const tRight = now + (width - nowX) / pxPerSec

      ctx.strokeStyle = line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, HEIGHT / 2)
      ctx.lineTo(width, HEIGHT / 2)
      ctx.stroke()

      if (pos) {
        const elapsed = now - origin
        const bars = Math.max(BARS_VISIBLE + 1, Math.ceil(elapsed / barLen) + 2)
        const slots = expectedSlotsFromPattern(origin, bars, pattern, {
          tempo,
          timeSignature,
          swing: timeSignature === '12/8' ? 0 : swing,
        })
        for (const slot of slots) {
          if (slot.time < tLeft || slot.time > tRight) continue
          const x = nowX + (slot.time - now) * pxPerSec
          const expected = slot.kind === 'HIT' || slot.kind === 'MUTE'
          ctx.strokeStyle = expected ? muted : line
          ctx.globalAlpha = expected ? 0.9 : 0.35
          ctx.beginPath()
          ctx.moveTo(x, expected ? 18 : 40)
          ctx.lineTo(x, expected ? HEIGHT - 18 : HEIGHT - 40)
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        const onsets = useOnsetStore.getState().onsets
        for (const onset of onsets) {
          const t = onset.time - latency
          if (t < tLeft || t > tRight) continue
          const age = now - t
          const fade = Math.max(0.25, 1 - age / (BARS_VISIBLE * barLen))
          const x = nowX + (t - now) * pxPerSec
          ctx.globalAlpha = fade
          ctx.fillStyle = amber
          ctx.beginPath()
          ctx.arc(x, HEIGHT / 2, 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      ctx.strokeStyle = off
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(nowX, 8)
      ctx.lineTo(nowX, HEIGHT - 8)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, tempo, timeSignature, swing, pattern, latencyMs])

  const copy = describeReport(report)

  return (
    <div className="space-y-2">
      <p className="text-muted">
        StrumScope — dots sit at the true offset. Early is left of the line,
        late is right. Last {BARS_VISIBLE} bars fade.
      </p>
      <canvas
        ref={canvasRef}
        className="h-32 w-full rounded-2xl bg-surface"
        style={{ height: HEIGHT }}
        aria-hidden="true"
      />
      {copy ? <p className="font-display text-lg text-amber">{copy}</p> : null}
    </div>
  )
}

function describeReport(
  report: ReturnType<typeof useOnsetStore.getState>['report'],
): string | null {
  if (!report || report.hitsLanded === 0) return null
  const bits: string[] = []
  if (report.meanOffsetMs !== null) {
    const ms = Math.round(report.meanOffsetMs)
    const side = ms < 0 ? 'early' : ms > 0 ? 'late' : 'on the line'
    bits.push(
      ms === 0
        ? `Mean offset 0ms — on the line across ${report.hitsLanded} hits`
        : `Landing about ${Math.abs(ms)}ms ${side} across ${report.hitsLanded} hits`,
    )
  }
  if (report.offsetStdevMs !== null) {
    bits.push(`spread ${Math.round(report.offsetStdevMs)}ms`)
  }
  if (report.meanOffsetDownMs !== null && report.meanOffsetUpMs !== null) {
    bits.push(
      `downs ${fmt(report.meanOffsetDownMs)}, ups ${fmt(report.meanOffsetUpMs)}`,
    )
  }
  if (report.missed > 0) bits.push(`${report.missed} expected hits had no onset`)
  if (report.extra > 0) bits.push(`${report.extra} extra onset${report.extra === 1 ? '' : 's'}`)
  return bits.join('. ')
}

function fmt(ms: number): string {
  const n = Math.round(ms)
  if (n === 0) return '0ms'
  return `${Math.abs(n)}ms ${n < 0 ? 'early' : 'late'}`
}
