import { describe, expect, it } from 'vitest'
import { extractChordProChords, uniqueChordPairs } from './chordpro'

const GRACE = `{title: Amazing Grace}
{artist: Traditional}

[G]Amazing [G7]grace how [C]sweet the [G]sound
That [G]saved a [D]wretch like [G]me
`

describe('ChordPro extraction', () => {
  it('pulls chord names in order and skips directives', () => {
    expect(extractChordProChords(GRACE)).toEqual([
      'G', 'G7', 'C', 'G', 'G', 'D', 'G',
    ])
  })

  it('lists unique adjacent pairs', () => {
    expect(uniqueChordPairs(extractChordProChords(GRACE))).toEqual([
      ['G', 'G7'],
      ['G7', 'C'],
      ['C', 'G'],
      ['G', 'D'],
      ['D', 'G'],
    ])
  })
})
