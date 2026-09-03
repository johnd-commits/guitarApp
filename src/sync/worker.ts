import { db, medianLatency, type ChordPairRow, type OutboxRow } from '../db'
import { useLessonStore } from '../stores/lessonStore'
import { useSessionStore } from '../stores/sessionStore'
import { attemptToRow, rowToAttempt, type AttemptRow } from './mapAttempt'
import { rest, uploadRecording, type Session } from './client'

type Status = 'syncing' | 'synced' | 'waiting'

/**
 * Drain the local outbox, then pull remote rows past the sync cursor.
 * Attempts are append-only so last-write-wins is just "insert if missing."
 */
export async function drainAndPull(
  session: Session,
  setWaiting: (n: number) => void,
  setStatus: (status: Status) => void,
): Promise<void> {
  setStatus('syncing')
  const token = session.access_token
  const userId = session.user.id
  if (!userId) {
    setStatus('synced')
    return
  }

  try {
    await rest(`profiles?on_conflict=id`, {
      token,
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: userId }),
    }).catch(() => undefined)

    const pending = await db.outbox.orderBy('id').toArray()
    setWaiting(pending.length)
    for (const row of pending) {
      await pushRow(row, token, userId)
      if (row.id !== undefined) await db.outbox.delete(row.id)
    }
    setWaiting(await db.outbox.count())

    const cursor = (await db._meta.get('syncCursor'))?.value ?? '1970-01-01T00:00:00.000Z'
    const remote = await rest<AttemptRow[]>(
      `attempts?user_id=eq.${userId}&started_at=gte.${encodeURIComponent(cursor)}&order=started_at.asc`,
      { token, method: 'GET' },
    )
    for (const item of remote ?? []) {
      const local = await db.attempts.get(item.id)
      if (!local) await db.attempts.put(rowToAttempt(item))
    }
    const latest = remote?.[remote.length - 1]?.started_at
    if (latest) await db._meta.put({ key: 'syncCursor', value: latest })

    const pairs = await rest<
      Array<{
        from_chord: string
        to_chord: string
        attempts: number
        latencies: number[]
        last_practiced_at: string
      }>
    >(`chord_pair_stats?user_id=eq.${userId}`, { token, method: 'GET' })
    for (const pair of pairs ?? []) {
      const existing = await db.chordPairs.get([pair.from_chord, pair.to_chord])
      if (!existing) {
        await db.chordPairs.put({
          fromChord: pair.from_chord,
          toChord: pair.to_chord,
          attempts: pair.attempts,
          latencies: pair.latencies ?? [],
          lastPracticedAt: pair.last_practiced_at,
        })
      }
    }

    const progress = await rest<Array<{ lesson_id: string; step_index: number }>>(
      `lesson_progress?user_id=eq.${userId}&order=updated_at.desc&limit=1`,
      { token, method: 'GET' },
    )
    const current = progress?.[0]
    if (current) {
      useLessonStore.setState({ lessonId: current.lesson_id, stepIndex: current.step_index })
    }

    useSessionStore.getState().setMicOnboarded(true)
    setStatus('synced')
  } catch {
    const waiting = await db.outbox.count()
    setWaiting(waiting)
    setStatus(waiting > 0 ? 'waiting' : 'synced')
  }
}

async function pushRow(row: OutboxRow, token: string, userId: string) {
  if (row.table === 'attempts') {
    const payload = row.payload as { id: string }
    const attempt = await db.attempts.get(payload.id)
    if (!attempt) return
    await rest('attempts?on_conflict=id', {
      token,
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(attemptToRow({ ...attempt, userId }, userId)),
    })
    return
  }
  if (row.table === 'chordPairs') {
    const pair = row.payload as ChordPairRow
    const med = medianLatency(pair)
    const best = pair.latencies.length
      ? Math.min(...pair.latencies.map((n) => Math.abs(n)))
      : null
    await rest('chord_pair_stats?on_conflict=user_id,from_chord,to_chord', {
      token,
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        from_chord: pair.fromChord,
        to_chord: pair.toChord,
        attempts: pair.attempts,
        best_latency_ms: best,
        median_latency_ms: med,
        last_practiced_at: pair.lastPracticedAt,
        latencies: pair.latencies,
      }),
    })
    return
  }
  if (row.table === 'recordings') {
    const id = (row.payload as { id: string }).id
    const rec = await db.recordings.get(id)
    if (!rec?.starred) return
    await uploadRecording(token, userId, rec.id, rec.guitarBlob, rec.mimeType)
  }
}

export async function kickSync() {
  const { useAuthStore } = await import('./authStore')
  const session = useAuthStore.getState().session
  if (!session) return
  await drainAndPull(session, useAuthStore.getState().setWaiting, useAuthStore.getState().setStatus)
}

export async function pushLessonProgress(lessonId: string, stepIndex: number) {
  const { useAuthStore } = await import('./authStore')
  const session = useAuthStore.getState().session
  if (!session?.user.id) return
  await rest('lesson_progress?on_conflict=user_id,lesson_id', {
    token: session.access_token,
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      user_id: session.user.id,
      lesson_id: lessonId,
      step_index: stepIndex,
      updated_at: new Date().toISOString(),
    }),
  }).catch(() => undefined)
}
