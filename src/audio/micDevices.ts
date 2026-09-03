export type AudioInputDevice = {
  id: string
  label: string
}

export function mapAudioInputs(
  devices: Array<{ deviceId: string; kind: string; label: string }>,
): AudioInputDevice[] {
  return devices
    .filter((device) => device.kind === 'audioinput' && device.deviceId.length > 0)
    .map((device, index) => ({
      id: device.deviceId,
      label: device.label.trim() || `Microphone ${index + 1}`,
    }))
}

export async function listAudioInputs(): Promise<AudioInputDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return mapAudioInputs(devices)
}
