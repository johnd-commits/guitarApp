import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')

const BG = [26, 24, 20, 255]
const AMBER = [232, 168, 56, 255]
const INK = [243, 239, 230, 255]

function crc32(buf) {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1)
    raw[row] = 0
    pixels[y].copy(raw, row + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(size, padded) {
  const rows = Array.from({ length: size }, () => Buffer.alloc(size * 4))
  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = x * 4
    rows[y][i] = color[0]
    rows[y][i + 1] = color[1]
    rows[y][i + 2] = color[2]
    rows[y][i + 3] = color[3]
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) set(x, y, BG)
  }

  const inset = padded ? size * 0.12 : size * 0.18
  const midX = size / 2
  const top = inset + (size - inset * 2) * 0.08
  const bottom = size - inset - (size - inset * 2) * 0.06
  const width = (size - inset * 2) * 0.42

  for (let y = 0; y < size; y++) {
    const ny = (y - top) / (bottom - top)
    if (ny < 0 || ny > 1) continue
    const half =
      ny < 0.35
        ? width * (0.72 + (0.28 * ny) / 0.35)
        : width * (1 - ((ny - 0.35) / 0.65) ** 1.35)
    for (let x = 0; x < size; x++) {
      if (Math.abs(x - midX) <= half) set(x, y, AMBER)
    }
  }

  const barHalf = size * 0.035
  const barTop = top + size * 0.22
  const barBottom = bottom - size * 0.22
  for (let y = Math.floor(barTop); y <= barBottom; y++) {
    for (let x = Math.floor(midX - barHalf); x <= midX + barHalf; x++) {
      set(x, y, INK)
    }
  }

  return encodePng(size, size, rows)
}

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, 'pwa-192.png'), drawIcon(192, false))
await writeFile(join(outDir, 'pwa-512.png'), drawIcon(512, false))
await writeFile(join(outDir, 'pwa-512-maskable.png'), drawIcon(512, true))
await writeFile(join(outDir, 'apple-touch-icon.png'), drawIcon(180, false))
console.log('Wrote PWA icons to public/icons')
