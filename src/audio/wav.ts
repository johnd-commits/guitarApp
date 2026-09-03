/**
 * 16-bit PCM mono WAV. Fixtures stay tiny and decode the same in Vitest
 * as they would from a file on disk.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataBytes = samples.length * 2
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataBytes, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return new Uint8Array(buffer)
}

export function decodeWav(bytes: Uint8Array): { samples: Float32Array; sampleRate: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const sampleRate = view.getUint32(24, true)
  const bits = view.getUint16(34, true)
  const dataSize = view.getUint32(40, true)
  if (bits !== 16) throw new Error('fixtures are 16-bit PCM')
  const count = dataSize / 2
  const samples = new Float32Array(count)
  let offset = 44
  for (let i = 0; i < count; i++) {
    samples[i] = view.getInt16(offset, true) / 0x8000
    offset += 2
  }
  return { samples, sampleRate }
}

function writeString(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
}

/** Short mid-band burst — energy sits inside 200 Hz–5 kHz on purpose. */
export function clickBurst(
  sampleRate: number,
  time: number,
  target: Float32Array,
  duration = 0.008,
) {
  const start = Math.floor(time * sampleRate)
  const n = Math.floor(duration * sampleRate)
  for (let i = 0; i < n; i++) {
    const idx = start + i
    if (idx < 0 || idx >= target.length) break
    const env = Math.exp(-i / (n * 0.25))
    const t = i / sampleRate
    target[idx] += env * 0.9 * Math.sin(2 * Math.PI * 1000 * t)
  }
}

export function clickTrain(
  sampleRate: number,
  times: number[],
  tail = 0.2,
): Float32Array {
  const last = times.length === 0 ? 0 : Math.max(...times)
  const samples = new Float32Array(Math.ceil((last + tail) * sampleRate))
  for (const time of times) clickBurst(sampleRate, time, samples)
  return samples
}
