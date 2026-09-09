import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TunerView } from './TunerView'
import { useTunerStore } from '../stores/tunerStore'

describe('tuner string pick', () => {
  beforeEach(() => {
    localStorage.clear()
    useTunerStore.setState({
      selectedString: null,
      live: {
        frequency: null,
        cents: null,
        rms: 0,
        clarity: 0,
        detectedString: null,
      },
    })
  })

  it('pins the tapped string and clears it on a second tap', () => {
    render(<TunerView mode="standalone" />)
    fireEvent.click(screen.getByRole('button', { name: 'Tune G3' }))
    expect(useTunerStore.getState().selectedString).toBe(3)
    expect(screen.getByRole('button', { name: 'Tune G3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tune G3' }))
    expect(useTunerStore.getState().selectedString).toBeNull()
  })
})
