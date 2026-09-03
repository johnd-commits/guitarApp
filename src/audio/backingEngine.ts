import { getAudioContext } from './context'
import { bluesDegree, hitsForClick, rootHz, type BackingPart, type BackingStyle } from './backing'
import type { PlannedClick } from './timing'

export type BackingConfig = {
  enabled: boolean
  style: BackingStyle
  muted: Record<BackingPart, boolean>
  volume: Record<BackingPart, number>
  solo: boolean
}

const DEFAULT_MUTED: Record<BackingPart, boolean> = {
  kick: false,
  snare: false,
  hat: false,
  bass: false,
}

const DEFAULT_VOLUME: Record<BackingPart, number> = {
  kick: 0.7,
  snare: 0.55,
  hat: 0.22,
  bass: 0.4,
}

/**
 * Voices scheduled onto the same AudioContext grid as the metronome.
 * Kick = pitch-swept sine. Snare = noise + tone. Hat = highpassed noise.
 * Bass = low triangle. Guitar is never synthesised here.
 */
export class BackingEngine {
  private config: BackingConfig = {
    enabled: false,
    style: 'straight-rock',
    muted: { ...DEFAULT_MUTED },
    volume: { ...DEFAULT_VOLUME },
    solo: false,
  }
  private scheduledTimes: number[] = []
  private master: GainNode | null = null
  private mixTaps = new Set<AudioNode>()

  private bus(): GainNode {
    const ctx = getAudioContext()
    if (!this.master || this.master.context !== ctx) {
      this.master = ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(ctx.destination)
    }
    return this.master
  }

  connectMix(dest: AudioNode) {
    this.bus().connect(dest)
    this.mixTaps.add(dest)
  }

  disconnectMix(dest: AudioNode) {
    try {
      this.master?.disconnect(dest)
    } catch {
      /* already disconnected */
    }
    this.mixTaps.delete(dest)
  }

  setConfig(partial: Partial<BackingConfig>) {
    this.config = { ...this.config, ...partial }
  }

  getConfig(): BackingConfig {
    return this.config
  }

  /** Times of backing hits, for known-signal gating of onsets. */
  recentHitTimes(now: number, window = 0.04): number[] {
    return this.scheduledTimes.filter((t) => Math.abs(t - now) < window)
  }

  onGrid(click: PlannedClick) {
    if (!this.config.enabled) return
    const hits = hitsForClick(click, this.config.style)
    for (const hit of hits) {
      if (this.config.muted[hit.part]) continue
      this.voice(hit.part, hit.time, click.bar)
      this.scheduledTimes.push(hit.time)
      if (this.scheduledTimes.length > 64) this.scheduledTimes.shift()
    }
  }

  private voice(part: BackingPart, time: number, bar: number) {
    const ctx = getAudioContext()
    const vol = this.config.volume[part]
    if (part === 'kick') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(140, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.08)
      gain.gain.setValueAtTime(vol, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18)
      osc.connect(gain)
      gain.connect(this.bus())
      osc.start(time)
      osc.stop(time + 0.2)
      return
    }
    if (part === 'snare') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(180, time)
      gain.gain.setValueAtTime(vol * 0.4, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12)
      osc.connect(gain)
      gain.connect(this.bus())
      osc.start(time)
      osc.stop(time + 0.14)
      const noise = ctx.createOscillator()
      const ng = ctx.createGain()
      noise.type = 'square'
      noise.frequency.setValueAtTime(240 + (bar % 3) * 20, time)
      ng.gain.setValueAtTime(vol * 0.25, time)
      ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.08)
      noise.connect(ng)
      ng.connect(this.bus())
      noise.start(time)
      noise.stop(time + 0.1)
      return
    }
    if (part === 'hat') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(7200, time)
      gain.gain.setValueAtTime(vol * 0.08, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03)
      osc.connect(gain)
      gain.connect(this.bus())
      osc.start(time)
      osc.stop(time + 0.04)
      return
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(rootHz(bluesDegree(bar)), time)
    gain.gain.setValueAtTime(vol * 0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28)
    osc.connect(gain)
    gain.connect(this.bus())
    osc.start(time)
    osc.stop(time + 0.3)
  }
}

export const backingEngine = new BackingEngine()
