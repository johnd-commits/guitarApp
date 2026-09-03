import type { BackingStyle } from '../audio/backing'
import type { Subdivision, TimeSignature } from '../audio/timing'

export type LessonStep = {
  id: string
  goal: string
  patternId: string
  chordIds: string[]
  tempoStart: number
  tempoTarget: number
  bars: number
  muteBeats?: number[]
  accentBeats?: number[]
  noStrum?: boolean
  backingStyle?: BackingStyle | null
  timeSignature?: TimeSignature
  swing?: number
  subdivision?: Subdivision
  success: {
    offsetStdevMaxMs?: number
    minHits?: number
  }
}

export type Lesson = {
  id: string
  title: string
  goal: string
  track: 1 | 2 | 3 | 4 | 5
  prerequisiteIds: string[]
  steps: LessonStep[]
}

function s(
  id: string,
  title: string,
  goal: string,
  track: 1 | 2 | 3 | 4 | 5,
  prerequisiteIds: string[],
  step: Omit<LessonStep, 'id'> & { id?: string },
): Lesson {
  return {
    id,
    title,
    goal,
    track,
    prerequisiteIds,
    steps: [{ ...step, id: step.id ?? `${id}-1` }],
  }
}

export const LESSONS: Lesson[] = [
  s('t1-pendulum', 'Pendulum', 'Muted strings, all downs, 60 BPM. Nothing else.', 1, [], {
    goal: 'All downs at 60 BPM, 8 bars, keep the arm moving',
    patternId: 'all-downs',
    chordIds: [],
    tempoStart: 60,
    tempoTarget: 60,
    bars: 8,
    success: { minHits: 16 },
  }),
  s('t1-down-up', 'Down-up eighths', 'Muted, arm never stops.', 1, ['t1-pendulum'], {
    goal: 'Down-up eighths at 60 BPM, 8 bars',
    patternId: 'down-up',
    chordIds: [],
    tempoStart: 60,
    tempoTarget: 72,
    bars: 8,
    success: { offsetStdevMaxMs: 40, minHits: 24 },
  }),
  s('t1-accent-24', 'Accent 2 and 4', 'Accenting 2 and 4 while everything else stays even.', 1, ['t1-down-up'], {
    goal: 'Down-up with 2 and 4 accented',
    patternId: 'down-up',
    chordIds: [],
    tempoStart: 60,
    tempoTarget: 80,
    bars: 8,
    accentBeats: [1, 3],
    success: { offsetStdevMaxMs: 35 },
  }),
  s('t1-d-du-udu', 'MISS slots', 'D-DU-UDU built from a continuous swing.', 1, ['t1-accent-24'], {
    goal: 'D-DU-UDU at 60 BPM, 8 bars',
    patternId: 'd-du-udu',
    chordIds: [],
    tempoStart: 60,
    tempoTarget: 80,
    bars: 8,
    success: { offsetStdevMaxMs: 35 },
  }),
  s('t1-click-24', 'Clicks on 2 and 4 only', 'Same pattern, metronome clicking only on 2 and 4.', 1, ['t1-d-du-udu'], {
    goal: 'D-DU-UDU, mute beats 1 and 3',
    patternId: 'd-du-udu',
    chordIds: [],
    tempoStart: 60,
    tempoTarget: 80,
    bars: 8,
    muteBeats: [0, 2],
    success: { offsetStdevMaxMs: 40 },
  }),
  s('t2-anchors', 'Two-chord loop, no strum', 'Anchor fingers, one change per bar.', 2, ['t1-click-24'], {
    goal: 'G to C, shapes only',
    patternId: 'all-downs',
    chordIds: ['G', 'C'],
    tempoStart: 50,
    tempoTarget: 60,
    bars: 8,
    noStrum: true,
    success: {},
  }),
  s('t2-one-down', 'One downstroke per bar', 'Same pair, one hit on the change.', 2, ['t2-anchors'], {
    goal: 'G to C, one down per bar',
    patternId: 'all-downs',
    chordIds: ['G', 'C'],
    tempoStart: 50,
    tempoTarget: 70,
    bars: 8,
    success: { minHits: 6 },
  }),
  s('t2-arm-late-chord', 'Arm never waits', 'Full pattern — let the chord be late, never the arm.', 2, ['t2-one-down'], {
    goal: 'G to C with D-DU-UDU',
    patternId: 'd-du-udu',
    chordIds: ['G', 'C'],
    tempoStart: 50,
    tempoTarget: 80,
    bars: 8,
    success: { offsetStdevMaxMs: 45 },
  }),
  s('t2-last-up', 'Lift on the last upstroke', 'Leave early; the up-strum covers the gap.', 2, ['t2-arm-late-chord'], {
    goal: 'G to C, leave on the last up of the bar',
    patternId: 'd-du-udu',
    chordIds: ['G', 'C'],
    tempoStart: 55,
    tempoTarget: 80,
    bars: 8,
    success: { offsetStdevMaxMs: 45 },
  }),
  s('t2-four-chord', 'Four-chord loops', 'Common progressions, one bar each.', 2, ['t2-last-up'], {
    goal: 'G–C–D–Em, D-DU-UDU',
    patternId: 'd-du-udu',
    chordIds: ['G', 'C', 'D', 'Em'],
    tempoStart: 55,
    tempoTarget: 84,
    bars: 16,
    success: { offsetStdevMaxMs: 45 },
  }),
  s('t3-blues-grid', '12-bar form', 'See the form on the light-up grid, do not count it.', 3, ['t2-arm-late-chord'], {
    goal: 'Shuffle blues, 12 bars, watch the grid',
    patternId: 'd-du-udu',
    chordIds: ['A', 'D', 'E'],
    tempoStart: 60,
    tempoTarget: 90,
    bars: 12,
    backingStyle: 'shuffle-blues',
    success: {},
  }),
  s('t3-quick-change', 'Quick change and turnaround', 'IV in bar 2, turnaround in 11–12.', 3, ['t3-blues-grid'], {
    goal: 'Same grid, notice bar 2 and the last two cells',
    patternId: 'd-du-udu',
    chordIds: ['A', 'D', 'E'],
    tempoStart: 60,
    tempoTarget: 96,
    bars: 12,
    backingStyle: 'shuffle-blues',
    success: {},
  }),
  s('t3-shuffle-feel', 'Shuffle feel', 'Swung eighths — pendulum long then short.', 3, ['t3-quick-change'], {
    goal: 'D-DU-UDU with 66% swing',
    patternId: 'd-du-udu',
    chordIds: ['A', 'D', 'E'],
    tempoStart: 60,
    tempoTarget: 88,
    bars: 12,
    swing: 66,
    backingStyle: 'shuffle-blues',
    success: { offsetStdevMaxMs: 50 },
  }),
  s('t3-boogie', 'Boogie on the low strings', 'Finger positions, not a riff chart.', 3, ['t3-shuffle-feel'], {
    goal: 'Low-string shuffle in A, 12 bars',
    patternId: 'all-downs',
    chordIds: ['A', 'D', 'E'],
    tempoStart: 55,
    tempoTarget: 80,
    bars: 12,
    swing: 66,
    backingStyle: 'shuffle-blues',
    success: { minHits: 20 },
  }),
  s('t3-blues-keys', 'Blues in A, E, G', 'Same form, three keys, capo for the rest.', 3, ['t3-boogie'], {
    goal: 'Shuffle in G with the same grid',
    patternId: 'd-du-udu',
    chordIds: ['G', 'C', 'D'],
    tempoStart: 60,
    tempoTarget: 92,
    bars: 12,
    backingStyle: 'shuffle-blues',
    success: {},
  }),
  s('t4-chuck', 'Upstroke chuck', 'Hit on the and, damp immediately. Hits land OFF the beat.', 4, ['t1-click-24'], {
    goal: 'Reggae chuck, 8 bars',
    patternId: 'reggae-chuck',
    chordIds: ['A'],
    tempoStart: 70,
    tempoTarget: 90,
    bars: 8,
    backingStyle: 'one-drop',
    success: { minHits: 8 },
  }),
  s('t4-skank', 'One-drop skank', 'Chords on 2 and 4 only, arm still moving.', 4, ['t4-chuck'], {
    goal: 'Skank on 2 and 4, 8 bars',
    patternId: 'one-drop-skank',
    chordIds: ['A'],
    tempoStart: 70,
    tempoTarget: 96,
    bars: 8,
    backingStyle: 'one-drop',
    success: { minHits: 8 },
  }),
  s('t4-double-skank', 'Double skank', 'Sixteenth pairs on 2 and 4.', 4, ['t4-skank'], {
    goal: 'Double skank, 8 bars',
    patternId: 'double-skank',
    chordIds: ['A'],
    tempoStart: 70,
    tempoTarget: 100,
    bars: 8,
    subdivision: 'sixteenth',
    backingStyle: 'one-drop',
    success: { minHits: 12 },
  }),
  s('t4-minor-7', 'Minor and 7th voicings', 'Am7 and A7, fretting-hand mute.', 4, ['t4-double-skank'], {
    goal: 'Chuck on Am7, 8 bars',
    patternId: 'reggae-chuck',
    chordIds: ['Am7', 'A7'],
    tempoStart: 70,
    tempoTarget: 92,
    bars: 8,
    backingStyle: 'one-drop',
    success: { minHits: 8 },
  }),
  s('t4-ska', 'Faster ska / rocksteady', 'Same chuck, tempo up.', 4, ['t4-minor-7'], {
    goal: 'Chuck at 100 BPM, 8 bars',
    patternId: 'reggae-chuck',
    chordIds: ['A'],
    tempoStart: 90,
    tempoTarget: 120,
    bars: 8,
    backingStyle: 'one-drop',
    success: { offsetStdevMaxMs: 40 },
  }),
  s('t5-triad-colour', 'What a triad is', 'Three coloured dots: root, third, fifth — colours stay consistent.', 5, ['t2-arm-late-chord'], {
    goal: 'Hold G, look at the three chord tones',
    patternId: 'all-downs',
    chordIds: ['G'],
    tempoStart: 50,
    tempoTarget: 60,
    bars: 8,
    noStrum: true,
    success: {},
  }),
  s('t5-major-triads', 'Major triads, top three strings', 'All inversions, up the neck.', 5, ['t5-triad-colour'], {
    goal: 'D shape as a triad, then the same three notes moved',
    patternId: 'all-downs',
    chordIds: ['D'],
    tempoStart: 50,
    tempoTarget: 70,
    bars: 8,
    noStrum: true,
    success: {},
  }),
  s('t5-minor-triads', 'Minor triads', 'The one dot that moves down a fret.', 5, ['t5-major-triads'], {
    goal: 'D and Dm side by side',
    patternId: 'all-downs',
    chordIds: ['D', 'Dm'],
    tempoStart: 50,
    tempoTarget: 70,
    bars: 8,
    noStrum: true,
    success: {},
  }),
  s('t5-middle-triads', 'Middle-string triads', 'Small shapes that are the reggae chuck sound.', 5, ['t5-minor-triads'], {
    goal: 'Chuck an A triad on the middle strings',
    patternId: 'reggae-chuck',
    chordIds: ['A'],
    tempoStart: 70,
    tempoTarget: 90,
    bars: 8,
    backingStyle: 'one-drop',
    success: { minHits: 8 },
  }),
  s('t5-caged', 'CAGED', 'Each open shape moved up the neck.', 5, ['t5-middle-triads'], {
    goal: 'Open G, then the E-shape G barre at fret 3',
    patternId: 'all-downs',
    chordIds: ['G', 'e-major-3'],
    tempoStart: 50,
    tempoTarget: 70,
    bars: 8,
    noStrum: true,
    success: {},
  }),
  s('t5-barre-ea', 'Barre from E and A shapes', 'Index finger acting as the capo.', 5, ['t5-caged'], {
    goal: 'E-shape A at fret 5, A-shape D at fret 5',
    patternId: 'all-downs',
    chordIds: ['e-major-5', 'a-major-5'],
    tempoStart: 50,
    tempoTarget: 70,
    bars: 8,
    noStrum: true,
    success: {},
  }),
  s('t5-barre-troubleshoot', 'Barre troubleshooting', 'Thumb, roll the index, minimum pressure. Check my chord for the dead string.', 5, ['t5-barre-ea'], {
    goal: 'Hold F at fret 1, watch which strings ring',
    patternId: 'all-downs',
    chordIds: ['e-major-1'],
    tempoStart: 50,
    tempoTarget: 60,
    bars: 8,
    success: { minHits: 8 },
  }),
  s('t5-barre-from-5', 'Barres from fret 5 down', 'Start where tension is lowest, fret 1 last.', 5, ['t5-barre-troubleshoot'], {
    goal: 'E-shape at fret 5, then 3, then 1',
    patternId: 'all-downs',
    chordIds: ['e-major-5', 'e-major-3', 'e-major-1'],
    tempoStart: 50,
    tempoTarget: 70,
    bars: 12,
    success: { minHits: 10 },
  }),
]

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}

export function lessonsForTrack(track: 1 | 2 | 3 | 4 | 5): Lesson[] {
  return LESSONS.filter((l) => l.track === track)
}

export const TRACK_NAMES = {
  1: 'The engine',
  2: 'Changes',
  3: '12-bar blues',
  4: 'Reggae and the chuck',
  5: 'Triads, CAGED, barre',
} as const
