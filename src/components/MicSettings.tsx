import { useEffect, useState } from 'react'
import { listAudioInputs, type AudioInputDevice } from '../audio/micDevices'
import { CLARITY_GATE, RMS_GATE } from '../audio/pitchConstants'
import { useSettingsStore } from '../stores/settingsStore'
import { useTunerStore } from '../stores/tunerStore'
import { LevelMeter } from './LevelMeter'

type Props = {
  open: boolean
  onOpen: () => void
  meter?: 'pitch' | 'none'
}

export function MicSettings({ open, onOpen, meter = 'pitch' }: Props) {
  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const deviceId = useSettingsStore((s) => s.micDeviceId)
  const setDeviceId = useSettingsStore((s) => s.setMicDeviceId)
  const sensitivity = useSettingsStore((s) => s.micSensitivity)
  const setSensitivity = useSettingsStore((s) => s.setMicSensitivity)
  const permission = useSettingsStore((s) => s.micPermissionState)
  const error = useSettingsStore((s) => s.micError)
  const live = useTunerStore((s) => s.live)
  const peak = Math.round(Math.min(1, live.rms / 0.15) * 100)

  useEffect(() => {
    void refreshDevices()
  }, [permission, open])

  async function refreshDevices() {
    try {
      setDevices(await listAudioInputs())
    } catch {
      setDevices([])
    }
  }

  function onPickDevice(id: string) {
    setDeviceId(id.length > 0 ? id : null)
    onOpen()
  }

  const waiting = open && live.rms < RMS_GATE
  const muddy = open && live.rms >= RMS_GATE && live.clarity < CLARITY_GATE && live.cents === null

  return (
    <div className="space-y-4 rounded-2xl bg-surface px-4 py-4">
      <p className="text-muted">Microphone</p>
      <p className="text-sm text-off">
        Audio stays on this phone. Pick the input that actually hears the guitar —
        laptop arrays often sit too far away.
      </p>

      {meter === 'pitch' && open ? <LevelMeter rms={live.rms} /> : null}

      {meter === 'pitch' && open ? (
        <p className="text-sm text-muted">
          {waiting
            ? `Mic is open. Level at ${peak}% — play closer to the mic or raise sensitivity.`
            : muddy
              ? `Level at ${peak}%. Clarity ${(live.clarity * 100).toFixed(0)}% (needs ${(CLARITY_GATE * 100).toFixed(0)}%) — hold a single open string.`
              : live.cents !== null
                ? `Level at ${peak}%. Clarity ${(live.clarity * 100).toFixed(0)}%.`
                : `Level at ${peak}%.`}
        </p>
      ) : meter === 'pitch' ? (
        <p className="text-sm text-muted">Microphone is closed.</p>
      ) : (
        <p className="text-sm text-muted">
          {open ? 'Mic is open for chord naming.' : 'Microphone is closed.'}
        </p>
      )}

      {error ? <p className="text-sm text-muted">{error}</p> : null}

      {permission === 'denied' && !error ? (
        <p className="text-sm text-muted">
          Microphone is blocked in the browser. Unblock it in the address bar,
          then tap Open microphone.
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-muted">Input</span>
        <select
          aria-label="Microphone input"
          className="min-h-12 w-full rounded-2xl bg-raised px-3 text-ink"
          value={deviceId ?? ''}
          onChange={(e) => onPickDevice(e.target.value)}
        >
          <option value="">Browser default</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Sensitivity</span>
          <span className="tabular-nums">{sensitivity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sensitivity}
          aria-label="Microphone sensitivity"
          onChange={(e) => setSensitivity(Number(e.target.value))}
          className="h-8 w-full cursor-pointer accent-amber"
        />
      </label>

      <button
        type="button"
        onClick={() => {
          void refreshDevices()
          onOpen()
        }}
        className="min-h-14 w-full rounded-2xl bg-raised font-medium text-ink ring-1 ring-line"
      >
        Open microphone
      </button>
    </div>
  )
}
