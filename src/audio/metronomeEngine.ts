import {
  advanceCursor,
  describeClick,
  type GridCursor,
  type PlannedClick,
  type SchedulerConfig,
} from './timing'
import { getAudioContext, resumeAudioContext } from './context'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1
const START_DELAY_S = 0.06

export type BeatEvent = PlannedClick

type VisualHandler = (event: BeatEvent) => void

function clickFrequency(click: PlannedClick): number {
  if (click.isDownbeat) return 1200
  if (click.accent) return 980
  return 800
}

function clickPeak(click: PlannedClick): number {
  return click.accent || click.isDownbeat ? 0.32 : 0.18
}

/**
 * Lookahead scheduler. Musical times come from AudioContext.currentTime;
 * the setTimeout loop is only a wake-up (every 25ms, looking 100ms ahead).
 * Click synthesis is oscillator + envelope, scheduled on the audio clock.
 */
export class MetronomeEngine {
  private config: SchedulerConfig | null = null
  private cursor: GridCursor | null = null
  private wakeTimer: number | null = null
  private running = false
  private generation = 0
  private originTime = 0
  private visualRaf: number | null = null
  private pendingVisuals: BeatEvent[] = []
  private onBeat: VisualHandler | null = null

  setConfig(config: SchedulerConfig) {
    this.config = config
  }

  setOnBeat(handler: VisualHandler | null) {
    this.onBeat = handler
  }

  /**
   * Must run inside a user-gesture stack on mobile Safari.
   * Also used on visibilitychange to recover from background suspend.
   */
  async unlock(): Promise<void> {
    await resumeAudioContext()
  }

  async start(): Promise<void> {
    const generation = ++this.generation
    this.halt()
    await this.unlock()
    if (generation !== this.generation || !this.config) return
    const ctx = getAudioContext()

    this.cursor = {
      time: ctx.currentTime + START_DELAY_S,
      bar: 0,
      beat: 0,
      slot: 0,
    }
    this.originTime = this.cursor.time
    this.pendingVisuals = []
    this.running = true
    this.scheduler()
    this.visualTick()
  }

  stop(): void {
    this.generation += 1
    this.halt()
  }

  private halt(): void {
    this.running = false
    if (this.wakeTimer !== null) {
      window.clearTimeout(this.wakeTimer)
      this.wakeTimer = null
    }
    if (this.visualRaf !== null) {
      window.cancelAnimationFrame(this.visualRaf)
      this.visualRaf = null
    }
    this.pendingVisuals = []
    this.cursor = null
  }

  getPosition(): { currentTime: number; originTime: number } | null {
    if (!this.running) return null
    const ctx = getAudioContext()
    return { currentTime: ctx.currentTime, originTime: this.originTime }
  }

  dispose(): void {
    this.stop()
  }

  private scheduler = (): void => {
    if (!this.running || !this.config || !this.cursor) return
    const ctx = getAudioContext()

    const horizon = ctx.currentTime + SCHEDULE_AHEAD_S
    while (this.cursor.time < horizon) {
      const click = describeClick(this.cursor, this.config)
      if (click.audible) this.scheduleClick(click)
      this.pendingVisuals.push(click)
      this.cursor = advanceCursor(this.cursor, this.config)
    }

    this.wakeTimer = window.setTimeout(this.scheduler, LOOKAHEAD_MS)
  }

  private visualTick = (): void => {
    if (!this.running) return
    const now = getAudioContext().currentTime
    while (this.pendingVisuals.length > 0 && this.pendingVisuals[0].time <= now) {
      const event = this.pendingVisuals.shift()
      if (event) this.onBeat?.(event)
    }
    this.visualRaf = window.requestAnimationFrame(this.visualTick)
  }

  private scheduleClick(click: PlannedClick): void {
    const ctx = getAudioContext()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(clickFrequency(click), click.time)

    const peak = clickPeak(click)
    gain.gain.setValueAtTime(0.0001, click.time)
    gain.gain.exponentialRampToValueAtTime(peak, click.time + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, click.time + 0.045)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(click.time)
    osc.stop(click.time + 0.05)
  }
}

export const metronomeEngine = new MetronomeEngine()
