import { describe, expect, it } from 'vitest'
import { LESSONS, lessonsForTrack } from './catalog'
import { progressionIdForChords } from './apply'

describe('curriculum', () => {
  it('has 28 lessons across five tracks', () => {
    expect(LESSONS).toHaveLength(28)
    expect(lessonsForTrack(1)).toHaveLength(5)
    expect(lessonsForTrack(2)).toHaveLength(5)
    expect(lessonsForTrack(3)).toHaveLength(5)
    expect(lessonsForTrack(4)).toHaveLength(5)
    expect(lessonsForTrack(5)).toHaveLength(8)
  })

  it('maps four-chord G C D Em onto the bundled progression', () => {
    expect(progressionIdForChords(['G', 'C', 'D', 'Em'])).toBe('g-c-d-em')
  })
})
