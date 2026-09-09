/** Samples per McLeod window. Low E2 is ~82 Hz; at 48 kHz this is ~7 periods. */
export const PITCH_WINDOW = 4096

/** pitchy clarity below this is treated as noise, not a note — for locking. */
export const CLARITY_GATE = 0.8

/**
 * RMS amplitude gate for locking a string, measured after mic gain.
 * A full-scale sine is ~0.707.
 */
export const RMS_GATE = 0.004

/** Looser floor so the needle can move on a quiet laptop mic. Locking still uses RMS_GATE. */
export const DISPLAY_RMS_GATE = 0.0008
/** Looser clarity so a ringing open string still moves the needle. */
export const DISPLAY_CLARITY_GATE = 0.55

/** A string locks after staying inside this band for LOCK_SECONDS. */
export const LOCK_CENTS = 5
export const LOCK_SECONDS = 1

export const GUITAR_FREQ_MIN = 70
export const GUITAR_FREQ_MAX = 720
