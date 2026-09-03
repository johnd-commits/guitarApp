export function countCleanChanges(
  onsets: Array<{ time: number }>,
  changeTimes: number[],
  latencySeconds: number,
  windowMs = 80,
): number {
  const windowS = windowMs / 1000
  const used = new Set<number>()
  let count = 0
  for (const boundary of changeTimes) {
    let best: { i: number; dist: number } | null = null
    for (let i = 0; i < onsets.length; i++) {
      if (used.has(i)) continue
      const dist = Math.abs(onsets[i].time - latencySeconds - boundary)
      if (dist > windowS) continue
      if (!best || dist < best.dist) best = { i, dist }
    }
    if (!best) continue
    used.add(best.i)
    count += 1
  }
  return count
}

export function changeTimesFromOrigin(
  origin: number,
  countInBeats: number,
  beatLen: number,
  beatsPerBar: number,
  durationSeconds: number,
): number[] {
  const songStart = origin + countInBeats * beatLen
  const times: number[] = []
  const barLen = beatLen * beatsPerBar
  for (let t = songStart + barLen; t <= origin + durationSeconds; t += barLen) {
    times.push(t)
  }
  return times
}
