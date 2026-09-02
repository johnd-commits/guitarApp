import { MicOnboarding } from '../components/MicOnboarding'
import { TunerView } from '../components/TunerView'
import { useSessionStore } from '../stores/sessionStore'

export function TunerPage() {
  const onboarded = useSessionStore((s) => s.micOnboarded)
  const setMicOnboarded = useSessionStore((s) => s.setMicOnboarded)

  if (!onboarded) {
    return <MicOnboarding onContinue={() => setMicOnboarded(true)} />
  }

  return <TunerView mode="standalone" />
}
