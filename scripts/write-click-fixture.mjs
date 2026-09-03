import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 44100
const times = [0.4, 0.8, 1.2, 1.6]
const last = 2.0
const samples = new Float32Array(Math.ceil(last * SR))
for (const time of times) {
  const start = Math.floor(time * SR)
  const n = Math.floor(0.008 * SR)
  for (let i = 0; i < n; i++) {
    const idx = start + i
    const env = Math.exp(-i / (n * 0.25))
    const t = i / SR
    samples[idx] += env * 0.9 * Math.sin(2 * Math.PI * 1000 * t)
  }
}

const dataBytes = samples.length * 2
const buffer = Buffer.alloc(44 + dataBytes)
buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + dataBytes, 4)
buffer.write('WAVE', 8)
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20)
buffer.writeUInt16LE(1, 22)
buffer.writeUInt32LE(SR, 24)
buffer.writeUInt32LE(SR * 2, 28)
buffer.writeUInt16LE(2, 32)
buffer.writeUInt16LE(16, 34)
buffer.write('data', 36)
buffer.writeUInt32LE(dataBytes, 40)
let offset = 44
for (let i = 0; i < samples.length; i++) {
  const s = Math.max(-1, Math.min(1, samples[i]))
  buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, offset)
  offset += 2
}

const dir = dirname(fileURLToPath(import.meta.url))
const out = join(dir, '../src/audio/fixtures/click-train.wav')
writeFileSync(out, buffer)
console.log('wrote', out, buffer.length, 'bytes')
