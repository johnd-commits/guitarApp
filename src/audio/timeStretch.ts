/**
 * Overlap-add time stretch. Rate 0.5 = half speed (buffer twice as long).
 * Windows hop through the input slower than they land in the output, so
 * pitch stays put — unlike playbackRate, which scales both.
 */
export function timeStretch(
  input: Float32Array,
  rate: number,
  win = 1024,
  hopOut = 256,
): Float32Array {
  const r = Math.min(1, Math.max(0.5, rate))
  if (Math.abs(r - 1) < 0.01) return input.slice()
  const hopIn = Math.max(1, Math.round(hopOut * r))
  const outLen = Math.ceil(input.length / r) + win
  const out = new Float32Array(outLen)
  const window = hann(win)

  for (let inPos = 0, outPos = 0; inPos + win < input.length; inPos += hopIn, outPos += hopOut) {
    for (let i = 0; i < win; i++) {
      out[outPos + i] += input[inPos + i] * window[i]
    }
  }

  let peak = 1e-9
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]))
  if (peak > 1) {
    for (let i = 0; i < out.length; i++) out[i] /= peak
  }
  return out
}

function hann(n: number): Float32Array {
  const w = new Float32Array(n)
  if (n <= 1) return w
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
  }
  return w
}
