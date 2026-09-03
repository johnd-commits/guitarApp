import type { TimingReport } from '../audio/timingAnalyser'

export type AttemptMetrics = {
  meanOffset: number | null
  offsetStdev: number | null
  meanOffsetDown: number | null
  meanOffsetUp: number | null
  stdevDown: number | null
  stdevUp: number | null
  gridPositionsExpected: number
  gridPositionsHit: number
  extraOnsets: number
  driftSlope: number | null
  rawOffsets: number[]
  changeLatenciesMs: number[]
  changesAttempted: number
  changesClean: number
}

export function metricsFromAttempt(
  report: TimingReport,
  extra?: {
    changeLatenciesMs?: number[]
    changesAttempted?: number
    changesClean?: number
  },
): AttemptMetrics {
  return {
    meanOffset: report.meanOffsetMs,
    offsetStdev: report.offsetStdevMs,
    meanOffsetDown: report.meanOffsetDownMs,
    meanOffsetUp: report.meanOffsetUpMs,
    stdevDown: report.stdevDownMs,
    stdevUp: report.stdevUpMs,
    gridPositionsExpected: report.expectedHits,
    gridPositionsHit: report.hitsLanded,
    extraOnsets: report.extra,
    driftSlope: report.driftSlopeMsPerSec,
    rawOffsets: report.hits
      .map((h) => h.offsetMs)
      .filter((v): v is number => v !== null),
    changeLatenciesMs: extra?.changeLatenciesMs ?? [],
    changesAttempted: extra?.changesAttempted ?? 0,
    changesClean: extra?.changesClean ?? 0,
  }
}
