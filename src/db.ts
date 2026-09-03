import Dexie, { type Table } from 'dexie'
import type { AttemptRecord } from './metrics/feedback'

type MetaRow = { key: string; value: string }

export type RecordingRow = {
  id: string
  attemptId: string
  lessonId: string
  createdAt: string
  starred: boolean
  mimeType: string
  guitarBlob: Blob
  mixBlob: Blob | null
  originTime: number
  tempoBpm: number
  patternId: string
  onsets: Array<{ time: number; energy: number }>
}

export type ChordPairRow = {
  fromChord: string
  toChord: string
  attempts: number
  latencies: number[]
  lastPracticedAt: string
}

export type OutboxRow = {
  id?: number
  table: 'attempts' | 'chordPairs' | 'recordings'
  payload: unknown
  createdAt: string
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Local-first. Attempts are append-only. Recordings live here until
 * starred or 30 days pass. Outbox drains only if VITE_SUPABASE_* is set.
 */
export class FretwiseDB extends Dexie {
  _meta!: Table<MetaRow, string>
  attempts!: Table<AttemptRecord, string>
  recordings!: Table<RecordingRow, string>
  chordPairs!: Table<ChordPairRow, [string, string]>
  outbox!: Table<OutboxRow, number>

  constructor() {
    super('fretwise')
    this.version(1).stores({ _meta: 'key' })
    this.version(2).stores({
      _meta: 'key',
      attempts: 'id, lessonId, startedAt',
      recordings: 'id, attemptId, createdAt, starred',
    })
    this.version(3).stores({
      _meta: 'key',
      attempts: 'id, lessonId, startedAt',
      recordings: 'id, attemptId, createdAt, starred, lessonId',
      chordPairs: '[fromChord+toChord], lastPracticedAt',
      outbox: '++id, createdAt, table',
    })
  }
}

export const db = new FretwiseDB()

export type SyncStatus = 'local' | 'synced' | 'syncing' | 'waiting'

export { supabaseConfigured } from './sync/client'

export async function enqueueOutbox(
  table: OutboxRow['table'],
  payload: unknown,
): Promise<void> {
  await db.outbox.add({ table, payload, createdAt: new Date().toISOString() })
  void import('./sync/worker').then((m) => m.kickSync()).catch(() => undefined)
}

export async function saveAttempt(attempt: AttemptRecord): Promise<void> {
  await db.attempts.put(attempt)
  await enqueueOutbox('attempts', attempt)
  if (attempt.chords.length >= 2 && attempt.metrics.changeLatenciesMs.length > 0) {
    await upsertChordPair(
      attempt.chords[0],
      attempt.chords[1],
      attempt.metrics.changeLatenciesMs,
      attempt.startedAt,
    )
  }
}

export async function listAttempts(): Promise<AttemptRecord[]> {
  return db.attempts.orderBy('startedAt').toArray()
}

export async function updateAttemptNote(id: string, note: string): Promise<void> {
  await db.attempts.update(id, { note })
}

export async function upsertChordPair(
  fromChord: string,
  toChord: string,
  latencies: number[],
  at: string,
): Promise<void> {
  const existing = await db.chordPairs.get([fromChord, toChord])
  const next: ChordPairRow = {
    fromChord,
    toChord,
    attempts: (existing?.attempts ?? 0) + 1,
    latencies: [...(existing?.latencies ?? []), ...latencies].slice(-48),
    lastPracticedAt: at,
  }
  await db.chordPairs.put(next)
  await enqueueOutbox('chordPairs', next)
}

export async function listChordPairs(): Promise<ChordPairRow[]> {
  return db.chordPairs.toArray()
}

export function medianLatency(row: ChordPairRow): number | null {
  if (row.latencies.length === 0) return null
  const sorted = [...row.latencies].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export async function saveRecording(row: RecordingRow): Promise<void> {
  await db.recordings.put(row)
}

export async function listRecordings(): Promise<RecordingRow[]> {
  return db.recordings.orderBy('createdAt').toArray()
}

export async function starRecording(id: string, starred: boolean): Promise<void> {
  await db.recordings.update(id, { starred })
  if (starred) await enqueueOutbox('recordings', { id })
}

export async function pruneRecordings(now = Date.now()): Promise<number> {
  const all = await db.recordings.toArray()
  let removed = 0
  for (const row of all) {
    if (row.starred) continue
    if (now - Date.parse(row.createdAt) < THIRTY_DAYS_MS) continue
    await db.recordings.delete(row.id)
    removed += 1
  }
  return removed
}

export async function deleteAllRecordings(): Promise<void> {
  await db.recordings.clear()
}

export async function outboxCount(): Promise<number> {
  return db.outbox.count()
}

void pruneRecordings().catch(() => undefined)
