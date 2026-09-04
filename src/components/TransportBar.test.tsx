import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TransportBar } from './TransportBar'
import { DEFAULT_TEMPO, useSettingsStore } from '../stores/settingsStore'
import { useSessionStore } from '../stores/sessionStore'

vi.mock('../audio/metronomeEngine', () => ({
  metronomeEngine: {
    unlock: vi.fn().mockResolvedValue(undefined),
    getPosition: vi.fn().mockReturnValue(null),
  },
}))

describe('transport bar display modes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    useSessionStore.setState({ micOnboarded: true, practiceGateOpen: true })
    useSettingsStore.setState({
      tempo: DEFAULT_TEMPO,
      metronomeEnabled: true,
      isPlaying: false,
      transportDisplayMode: 'collapsed',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts collapsed without the pendulum in collapsed mode', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show metronome/i })).toBeInTheDocument()
    expect(screen.queryByText(/arm keeps moving/i)).not.toBeInTheDocument()
  })

  it('auto mode expands then hides the pendulum after idle', () => {
    useSettingsStore.setState({ transportDisplayMode: 'auto' })

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

  it('collapsed mode keeps the pendulum open until Hide is tapped', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /show metronome/i }))
    expect(screen.getByText(/arm keeps moving/i)).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByText(/arm keeps moving/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }))
    expect(screen.queryByText(/arm keeps moving/i)).not.toBeInTheDocument()
  })

  it('pinned mode always shows the pendulum and tempo slider', () => {
    useSettingsStore.setState({ transportDisplayMode: 'pinned' })

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    expect(screen.getByText(/arm keeps moving/i)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /tempo/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show metronome/i })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByText(/arm keeps moving/i)).toBeInTheDocument()
  })

  it('switches to pinned when Pin is selected', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Keep metronome open' }))
    expect(screen.getByText(/arm keeps moving/i)).toBeInTheDocument()
    expect(useSettingsStore.getState().transportDisplayMode).toBe('pinned')
  })

  it('toggles play on the tuner route', async () => {
    render(
      <MemoryRouter initialEntries={['/tuner']}>
        <TransportBar />
      </MemoryRouter>,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    })
    expect(useSettingsStore.getState().isPlaying).toBe(true)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    })
    expect(useSettingsStore.getState().isPlaying).toBe(false)
  })

  it('toggles play even when the practice gate is closed', async () => {
    useSessionStore.setState({ micOnboarded: true, practiceGateOpen: false })

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TransportBar />
      </MemoryRouter>,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    })
    expect(useSettingsStore.getState().isPlaying).toBe(true)
  })
})
