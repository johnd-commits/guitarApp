import { create } from 'zustand'
import { applyLessonStep } from '../lessons/apply'
import { lessonById } from '../lessons/catalog'
import { useBackingStore } from './backingStore'
import { useChangeTrainerStore } from './changeTrainerStore'
import { useLessonStore } from './lessonStore'
import { usePracticeStore } from './practiceStore'
import { useSettingsStore } from './settingsStore'
import { useStrumStore } from './strumStore'

export const SESSION_BLOCKS = [
  { id: 'pendulum', label: 'Pendulum warm-up', seconds: 180 },
  { id: 'changes', label: 'Chord changes', seconds: 300 },
  { id: 'lesson', label: 'Current lesson', seconds: 300 },
  { id: 'solo', label: 'Play something you enjoy', seconds: 120 },
] as const

export type SessionBlockId = (typeof SESSION_BLOCKS)[number]['id']

type SessionBuilderState = {
  active: boolean
  blockIndex: number
  /** AudioContext time when the current block started. */
  blockOrigin: number
  start: (audioNow: number) => void
  stop: () => void
  tick: (audioNow: number) => void
}

function applyBlock(index: number) {
  const block = SESSION_BLOCKS[index]
  if (!block) return
  useBackingStore.getState().setSolo(false)
  if (block.id === 'pendulum') {
    const lesson = lessonById('t1-pendulum')
    if (lesson?.steps[0]) applyLessonStep(lesson.steps[0])
    usePracticeStore.getState().setMode('follow')
  } else if (block.id === 'changes') {
    useChangeTrainerStore.getState().setNoStrum(false)
    useChangeTrainerStore.getState().setPair('G', 'C')
    useStrumStore.getState().setPatternId('all-downs')
    useSettingsStore.getState().setTempo(60)
    usePracticeStore.getState().setMode('changes')
    useBackingStore.getState().setEnabled(false)
  } else if (block.id === 'lesson') {
    const { lessonId, stepIndex } = useLessonStore.getState()
    const lesson = lessonById(lessonId)
    const step = lesson?.steps[stepIndex]
    if (step) applyLessonStep(step)
    usePracticeStore.getState().setMode(
      step?.chordIds.length === 2 && step.noStrum ? 'changes' : 'follow',
    )
  } else {
    useBackingStore.getState().setEnabled(true)
    useBackingStore.getState().setSolo(true)
    usePracticeStore.getState().setMode('session')
  }
}

export const useSessionBuilderStore = create<SessionBuilderState>()((set, get) => ({
  active: false,
  blockIndex: 0,
  blockOrigin: 0,
  start: (audioNow) => {
    applyBlock(0)
    set({ active: true, blockIndex: 0, blockOrigin: audioNow })
  },
  stop: () => {
    useBackingStore.getState().setSolo(false)
    set({ active: false, blockIndex: 0, blockOrigin: 0 })
  },
  tick: (audioNow) => {
    const { active, blockIndex, blockOrigin } = get()
    if (!active) return
    const block = SESSION_BLOCKS[blockIndex]
    if (!block) return
    if (audioNow - blockOrigin < block.seconds) return
    const next = blockIndex + 1
    if (next >= SESSION_BLOCKS.length) {
      get().stop()
      useSettingsStore.getState().setPlaying(false)
      return
    }
    applyBlock(next)
    set({ blockIndex: next, blockOrigin: audioNow })
  },
}))
