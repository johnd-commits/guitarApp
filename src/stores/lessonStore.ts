import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyLessonStep } from '../lessons/apply'
import { lessonById, LESSONS } from '../lessons/catalog'

type LessonState = {
  lessonId: string
  stepIndex: number
  setLesson: (id: string) => void
  nextStep: () => void
  prevStep: () => void
}

function applyCurrent(lessonId: string, stepIndex: number) {
  const lesson = lessonById(lessonId)
  const step = lesson?.steps[stepIndex]
  if (step) applyLessonStep(step)
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set, get) => ({
      lessonId: LESSONS[0]?.id ?? 't1-pendulum',
      stepIndex: 0,
      setLesson: (id) => {
        set({ lessonId: id, stepIndex: 0 })
        applyCurrent(id, 0)
      },
      nextStep: () => {
        const { lessonId, stepIndex } = get()
        const lesson = lessonById(lessonId)
        if (!lesson) return
        const next = Math.min(lesson.steps.length - 1, stepIndex + 1)
        set({ stepIndex: next })
        applyCurrent(lessonId, next)
      },
      prevStep: () => {
        const { lessonId, stepIndex } = get()
        const next = Math.max(0, stepIndex - 1)
        set({ stepIndex: next })
        applyCurrent(lessonId, next)
      },
    }),
    {
      name: 'fretwise-lesson',
      partialize: (s) => ({ lessonId: s.lessonId, stepIndex: s.stepIndex }),
    },
  ),
)
