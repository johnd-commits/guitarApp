import { LOCK_CENTS, LOCK_SECONDS } from '../audio/pitchConstants'

export type StringLock = {
  locked: boolean
  heldSeconds: number
  lastUpdate: number | null
}

export function emptyLock(): StringLock {
  return { locked: false, heldSeconds: 0, lastUpdate: null }
}

export function emptyLocks(): StringLock[] {
  return Array.from({ length: 6 }, emptyLock)
}

/**
 * Accumulate in-tune time from AudioContext.currentTime, never Date.now.
 * Other strings pause the clock rather than resetting it. Going outside
 * ±LOCK_CENTS while this string is the one being heard clears the hold.
 */
export function stepLock(
  lock: StringLock,
  input: {
    detected: boolean
    cents: number | null
    now: number
  },
): StringLock {
  if (lock.locked) return lock
  if (!input.detected || input.cents === null) {
    return { ...lock, lastUpdate: null }
  }
  if (Math.abs(input.cents) > LOCK_CENTS) {
    return { locked: false, heldSeconds: 0, lastUpdate: input.now }
  }
  const dt = lock.lastUpdate === null ? 0 : Math.max(0, input.now - lock.lastUpdate)
  const heldSeconds = lock.heldSeconds + dt
  return {
    locked: heldSeconds >= LOCK_SECONDS,
    heldSeconds,
    lastUpdate: input.now,
  }
}

export function allLocked(locks: StringLock[]): boolean {
  return locks.length === 6 && locks.every((l) => l.locked)
}
