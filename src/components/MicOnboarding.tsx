import { useState } from 'react'
import { resumeAudioContext } from '../audio/context'
import { micCapture } from '../audio/micCapture'
import { usePitchCapture } from '../hooks/usePitchCapture'
import { useSettingsStore } from '../stores/settingsStore'
import { useTunerStore } from '../stores/tunerStore'
import { LevelMeter } from './LevelMeter'

export function MicOnboarding({ onContinue }: { onContinue: () => void }) {
  const [listening, setListening] = useState(false)
  const [micGeneration, setMicGeneration] = useState(0)
  const permission = useSettingsStore((s) => s.micPermissionState)
  usePitchCapture(listening, micGeneration)
  const rms = useTunerStore((s) => s.live.rms)
  const peak = Math.round(Math.min(1, rms / 0.15) * 100)

  async function enableMic() {
    await resumeAudioContext()
    setListening(true)
  }

  async function continueOn() {
    await resumeAudioContext()
    onContinue()
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-sm tracking-wide text-amber">Microphone</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Audio stays on this phone
        </h1>
        <p className="text-muted">
          The guitar signal is measured here and never uploaded. Play a string
          and watch the meter so we both know the mic can hear it.
        </p>
      </div>

      {listening ? (
        <>
          <LevelMeter rms={rms} />
          {permission === 'denied' ? (
            <p className="rounded-2xl bg-surface px-4 py-4 text-muted">
              Microphone is blocked in the browser. Unblock it in the address bar,
              then tap Reconnect microphone. Nothing leaves the phone.
            </p>
          ) : (
            <p className="text-sm text-off">
              Meter at {peak}% of a typical pluck.
              {rms < 0.005 ? ' Waiting for a string.' : ' Signal is arriving.'}
            </p>
          )}
          <button
            type="button"
            onClick={() => void continueOn()}
            className="min-h-14 w-full rounded-2xl bg-amber font-medium text-bg"
          >
            Continue to the tuner
          </button>
          <button
            type="button"
            onClick={() => {
              micCapture.stop()
              setListening(false)
              useSettingsStore.getState().setMicPermissionState('prompt')
              void resumeAudioContext().then(() => {
                setMicGeneration((n) => n + 1)
                setListening(true)
              })
            }}
            className="min-h-14 w-full rounded-2xl bg-surface font-medium ring-1 ring-line"
          >
            Reconnect microphone
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void enableMic()}
          className="min-h-14 w-full rounded-2xl bg-amber font-medium text-bg"
        >
          Turn on microphone
        </button>
      )}
    </section>
  )
}
