import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TransportBar } from './TransportBar'
import { DEFAULT_TEMPO, useSettingsStore } from '../stores/settingsStore'
import { useSessionStore } from '../stores/sessionStore'

describe('transport bar auto-hide', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    useSessionStore.setState({ micOnboarded: true, practiceGateOpen: true })
    useSettingsStore.setState({
      tempo: DEFAULT_TEMPO,
      metronomeEnabled: true,
      isPlaying: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts collapsed without the pendulum', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show metronome/i })).toBeInTheDocument()
    expect(screen.queryByText(/arm keeps moving/i)).not.toBeInTheDocument()
  })

  it('expands the pendulum then hides it after idle', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /show metronome/i }))
    expect(screen.getByText(/arm keeps moving/i)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /tempo/i })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.queryByText(/arm keeps moving/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show metronome/i })).toBeInTheDocument()
  })
})
