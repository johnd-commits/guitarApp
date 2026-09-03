import { useOnsetStore } from '../stores/onsetStore'
import { useLessonStore } from '../stores/lessonStore'
import { usePracticeStore } from '../stores/practiceStore'
import { LESSONS, TRACK_NAMES, lessonById } from '../lessons/catalog'
import { stepSucceeded } from '../lessons/apply'
import { useChangeTrainerStore } from '../stores/changeTrainerStore'

export function LessonPlayer() {
  const lessonId = useLessonStore((s) => s.lessonId)
  const stepIndex = useLessonStore((s) => s.stepIndex)
  const setLesson = useLessonStore((s) => s.setLesson)
  const nextStep = useLessonStore((s) => s.nextStep)
  const prevStep = useLessonStore((s) => s.prevStep)
  const report = useOnsetStore((s) => s.report)
  const lesson = lessonById(lessonId) ?? LESSONS[0]
  const step = lesson.steps[stepIndex]
  const passed = step ? stepSucceeded(step, report) : false

  function pick(id: string) {
    setLesson(id)
    const picked = lessonById(id)
    const first = picked?.steps[0]
    if (first?.noStrum || (first && first.chordIds.length === 2 && first.patternId === 'all-downs')) {
      useChangeTrainerStore.getState().setNoStrum(Boolean(first.noStrum))
      usePracticeStore.getState().setMode('changes')
    } else {
      usePracticeStore.getState().setMode('follow')
    }
  }

  return (
    <div className="space-y-4">
      {step ? (
        <div className="space-y-2 rounded-2xl bg-surface px-4 py-4">
          <p className="text-muted">
            Track {lesson.track} — {TRACK_NAMES[lesson.track]}
          </p>
          <p className="font-display text-xl">{lesson.title}</p>
          <p className="text-ink">{step.goal}</p>
          <p className="tabular-nums text-sm text-muted">
            {step.tempoStart}–{step.tempoTarget} BPM · {step.bars} bars
            {step.success.offsetStdevMaxMs !== undefined
              ? ` · spread under ${step.success.offsetStdevMaxMs}ms`
              : ''}
            {step.success.minHits !== undefined ? ` · at least ${step.success.minHits} hits` : ''}
          </p>
          {passed ? (
            <p className="font-display text-lg text-amber">
              Last take met the numbers for this step.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="min-h-12 rounded-2xl bg-raised" onClick={prevStep}>
              Previous step
            </button>
            <button type="button" className="min-h-12 rounded-2xl bg-amber text-bg" onClick={nextStep}>
              Next step
            </button>
          </div>
        </div>
      ) : null}

      {([1, 2, 3, 4, 5] as const).map((track) => (
        <div key={track} className="space-y-2">
          <p className="font-display text-lg text-amber">
            Track {track} — {TRACK_NAMES[track]}
          </p>
          {LESSONS.filter((l) => l.track === track).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              className={[
                'w-full rounded-2xl px-4 py-3 text-left',
                item.id === lessonId ? 'bg-amber text-bg' : 'bg-surface text-ink',
              ].join(' ')}
            >
              <p className="font-medium">{item.title}</p>
              <p className={['text-sm', item.id === lessonId ? 'text-bg/80' : 'text-muted'].join(' ')}>
                {item.goal}
              </p>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
