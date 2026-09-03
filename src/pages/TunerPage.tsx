import { useState } from 'react'
import { ChordListenView } from '../components/ChordListenView'
import { MicOnboarding } from '../components/MicOnboarding'
import { TunerView } from '../components/TunerView'
import { useSessionStore } from '../stores/sessionStore'

type TunerTab = 'tune' | 'name'

export function TunerPage() {
  const onboarded = useSessionStore((s) => s.micOnboarded)
  const setMicOnboarded = useSessionStore((s) => s.setMicOnboarded)
  const [tab, setTab] = useState<TunerTab>('tune')

  if (!onboarded) {
    return <MicOnboarding onContinue={() => setMicOnboarded(true)} />
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab('tune')}
          className={[
            'min-h-12 rounded-2xl text-sm font-medium',
            tab === 'tune' ? 'bg-amber text-bg' : 'bg-surface text-ink',
          ].join(' ')}
        >
          Tune strings
        </button>
        <button
          type="button"
          onClick={() => setTab('name')}
          className={[
            'min-h-12 rounded-2xl text-sm font-medium',
            tab === 'name' ? 'bg-amber text-bg' : 'bg-surface text-ink',
          ].join(' ')}
        >
          Name a chord
        </button>
      </div>
      {tab === 'tune' ? <TunerView mode="standalone" /> : <ChordListenView />}
    </div>
  )
}
