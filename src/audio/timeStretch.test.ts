import { describe, expect, it } from 'vitest'
import { timeStretch } from './timeStretch'

describe('timeStretch', () => {
  it('makes a buffer longer at rate 0.5 without emptying it', () => {
    const n = 8000
    const x = new Float32Array(n)
    for (let i = 0; i < n; i++) x[i] = Math.sin((2 * Math.PI * 440 * i) / 8000)
    const y = timeStretch(x, 0.5)
    expect(y.length).toBeGreaterThan(n * 1.6)
    let energy = 0
    for (let i = 0; i < y.length; i++) energy += y[i] * y[i]
    expect(energy).toBeGreaterThan(1)
  })

  it('leaves rate 1 as a copy', () => {
    const x = new Float32Array([0, 0.5, 1, 0.5, 0])
    const y = timeStretch(x, 1)
    expect(Array.from(y)).toEqual(Array.from(x))
    expect(y).not.toBe(x)
  })
})
