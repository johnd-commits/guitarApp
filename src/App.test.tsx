import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { DEFAULT_TEMPO, useSettingsStore } from './stores/settingsStore'
import { useSessionStore } from './stores/sessionStore'

describe('app shell', () => {
  beforeEach(() => {
    localStorage.clear()
    useSessionStore.setState({ micOnboarded: false, practiceGateOpen: false })
    useSettingsStore.setState({
      tempo: DEFAULT_TEMPO,
      metronomeEnabled: true,
      countInBars: 1,
      capoPosition: 0,
      micPermissionState: 'unknown',
      isPlaying: false,
    })
  })

  it('opens a new session on microphone onboarding', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /audio stays on this phone/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /practice/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /songs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tuner/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('shows practice after onboarding and the tuning gate', () => {
    useSessionStore.setState({ micOnboarded: true, practiceGateOpen: true })

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /keep the arm moving/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Switch')).toBeInTheDocument()
    expect(screen.getByText(/D chord/i)).toBeInTheDocument()
    expect(screen.getByText(/Dm chord/i)).toBeInTheDocument()
    expect(screen.getAllByText('DOWN').length).toBeGreaterThan(0)
    expect(screen.getAllByText('UP').length).toBeGreaterThan(0)
  })

  it('sends an onboarded session through the tuner gate', () => {
    useSessionStore.setState({ micOnboarded: true, practiceGateOpen: false })

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /six strings, detected automatically/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip, already tuned/i })).toBeInTheDocument()
  })
})
