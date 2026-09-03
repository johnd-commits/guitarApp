import { useState } from 'react'
import { resumeAudioContext } from '../audio/context'
import { usePitchCapture } from '../hooks/usePitchCapture'
import { MicSettings } from './MicSettings'

export function MicOnboarding({ onContinue }: { onContinue: () => void }) {
  const [listening, setListening] = useState(false)
  const [micGeneration, setMicGeneration] = useState(0)
  usePitchCapture(listening, micGeneration)

  async function enableMic() {
    await resumeAudioContext()
    setListening(true)
  }

  async function continueOn() {
    await resumeAudioContext()
    onContinue()
  }

  async function reopenMic() {
    await resumeAudioContext()
    setMicGeneration((n) => n + 1)
    setListening(true)
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
          <MicSettings open onOpen={() => void reopenMic()} />
          <button
            type="button"
            onClick={() => void continueOn()}
            className="min-h-14 w-full rounded-2xl bg-amber font-medium text-bg"
          >
            Continue to the tuner
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
