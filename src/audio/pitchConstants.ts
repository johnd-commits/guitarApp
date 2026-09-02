/** Samples per McLeod window. Low E2 is ~82 Hz; at 48 kHz this is ~7 periods. */
export const PITCH_WINDOW = 4096

/** pitchy clarity below this is treated as noise, not a note. */
export const CLARITY_GATE = 0.9

/**
 * RMS amplitude gate. A full-scale sine is ~0.707; room noise sits well
 * below 0.01. Anything quieter is ignored so the tuner does not jump.
 */
export const RMS_GATE = 0.01

/** A string locks after staying inside this band for LOCK_SECONDS. */
export const LOCK_CENTS = 5
export const LOCK_SECONDS = 1

export const GUITAR_FREQ_MIN = 70
export const GUITAR_FREQ_MAX = 720
