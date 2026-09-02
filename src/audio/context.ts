let ctx: AudioContext | null = null
let visibilityBound = false

function bindVisibility() {
  if (visibilityBound) return
  visibilityBound = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx?.state === 'suspended') {
      void ctx.resume()
    }
  })
}

export function getAudioContext(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext()
    bindVisibility()
  }
  return ctx
}

export async function resumeAudioContext(): Promise<AudioContext> {
  const audio = getAudioContext()
  if (audio.state === 'suspended') await audio.resume()
  return audio
}
