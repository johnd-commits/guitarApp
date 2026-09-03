export function clampMicSensitivity(value: number): number {
  if (!Number.isFinite(value)) return 60
  return Math.min(100, Math.max(0, Math.round(value)))
}

/**
 * Sensitivity 0 is unity gain; 100 is 8× so a quiet laptop mic can still
 * clear the RMS gate. The worklet still measures post-gain RMS.
 */
export function micGainFromSensitivity(sensitivity: number): number {
  return 1 + (clampMicSensitivity(sensitivity) / 100) * 7
}

export const DEFAULT_MIC_SENSITIVITY = 60
