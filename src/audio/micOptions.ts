import { micGainFromSensitivity } from '../audio/micGain'
import { useSettingsStore } from '../stores/settingsStore'

export function currentMicOptions() {
  const { micDeviceId, micSensitivity } = useSettingsStore.getState()
  return {
    deviceId: micDeviceId,
    gain: micGainFromSensitivity(micSensitivity),
  }
}

export function describeMicError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'The browser blocked the microphone. Allow it in the address bar, then open it again.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was found on this device.'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'The microphone is in use by another app. Close that app, then open it here again.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'The microphone did not open.'
}
