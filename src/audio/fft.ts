/**
 * In-place radix-2 Cooley–Tukey FFT.
 *
 * A length-N real window is treated as complex with a zero imaginary part.
 * After the transform, bin k holds the frequency k * sampleRate / N.
 * We only read magnitudes in the analysis band (see onset.ts).
 */
export function fftRadix2(re: Float64Array, im: Float64Array): void {
  const n = re.length
  if (n !== im.length || n < 2 || (n & (n - 1)) !== 0) {
    throw new Error('FFT length must be a power of two')
  }

  // Bit-reverse the order so each butterfly reads neighbours.
  let j = 0
  for (let i = 1; i < n; i++) {
    let bit = n >> 1
    while (j & bit) {
      j ^= bit
      bit >>= 1
    }
    j ^= bit
    if (i < j) {
      const tr = re[i]
      const ti = im[i]
      re[i] = re[j]
      im[i] = im[j]
      re[j] = tr
      im[j] = ti
    }
  }

  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1
    const step = (2 * Math.PI) / size
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < half; k++) {
        const angle = -step * k
        const wr = Math.cos(angle)
        const wi = Math.sin(angle)
        const even = i + k
        const odd = even + half
        const tr = wr * re[odd] - wi * im[odd]
        const ti = wr * im[odd] + wi * re[odd]
        re[odd] = re[even] - tr
        im[odd] = im[even] - ti
        re[even] += tr
        im[even] += ti
      }
    }
  }
}

/** Hann taper so a pluck does not smear energy across neighbouring bins. */
export function hann(n: number): Float64Array {
  const w = new Float64Array(n)
  if (n <= 1) return w
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
  }
  return w
}

export function magnitudeAt(re: Float64Array, im: Float64Array, bin: number): number {
  return Math.hypot(re[bin], im[bin])
}
