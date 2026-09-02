import { useEffect, useRef } from 'react'
import { ChordStyle, Orientation, SVGuitarChord } from 'svguitar'
import type { ChordShape, FrettedNote } from '../chords/library'

export type DiagramState = 'idle' | 'upcoming' | 'active'

type Props = {
  chord: ChordShape
  state: DiagramState
  anchors?: FrettedNote[]
  capoFret: number
  sounding: string
}

function theme() {
  const css = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback
  return {
    amber: read('--color-amber', '#ffc14d'),
    off: read('--color-off', '#7ec8e0'),
    ink: read('--color-ink', '#fff6ea'),
    muted: read('--color-muted', '#e0c8ae'),
    bg: read('--color-bg', '#332014'),
  }
}

export function ChordDiagram({ chord, state, anchors = [], capoFret, sounding }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.replaceChildren()
    const colors = theme()
    const fingerColor = state === 'upcoming' ? colors.off : colors.amber
    const anchorSet = new Set(anchors.map((a) => `${a.string}:${a.fret}`))

    try {
      const chart = new SVGuitarChord(host)
      chart
        .configure({
          strings: 6,
          frets: 4,
          position: chord.position,
          tuning: ['E', 'A', 'D', 'G', 'B', 'e'],
          style: ChordStyle.normal,
          orientation: Orientation.vertical,
          fingerSize: 0.72,
          fingerColor,
          fingerTextColor: colors.bg,
          fingerStrokeColor: colors.bg,
          barreChordStrokeColor: colors.bg,
          color: colors.muted,
          backgroundColor: 'none',
          fretColor: colors.muted,
          stringColor: colors.muted,
          tuningsColor: colors.ink,
          title: '',
          titleFontSize: 1,
          tuningsFontSize: 18,
          fretLabelFontSize: 16,
        })
        .chord({
          title: '',
          position: chord.position,
          fingers: chord.fingers.map((f) => {
            if (f.fret === 'x' || f.fret === 0) return [f.string, f.fret]
            const isAnchor = anchorSet.has(`${f.string}:${f.fret}`)
            const text = f.finger ? String(f.finger) : ''
            if (isAnchor) {
              return [f.string, f.fret, { text, color: colors.off, textColor: colors.bg }]
            }
            return [f.string, f.fret, text]
          }),
          barres: (chord.barres ?? []).map((b) => ({
            fromString: b.fromString,
            toString: b.toString,
            fret: b.fret,
            text: String(b.finger),
            color: fingerColor,
            textColor: colors.bg,
          })),
        })
        .draw()
    } catch {
      // jsdom and first paint without layout still show the name and neck frame
    }
  }, [chord, state, anchors])

  const shapeLabel =
    capoFret > 0 ? `Play ${chord.name} shape, sounds as ${sounding}` : `${chord.name} shape`

  return (
    <figure
      className={[
        'rounded-2xl px-2 pb-3 pt-2',
        state === 'active' ? 'bg-raised ring-2 ring-amber' : 'bg-surface',
        state === 'upcoming' ? 'ring-2 ring-off' : '',
      ].join(' ')}
    >
      <figcaption className="px-2 pb-1">
        <p className="font-display text-2xl leading-tight">{chord.name}</p>
        <p className="text-sm text-muted">{shapeLabel}</p>
      </figcaption>
      <div ref={hostRef} className="chord-diagram mx-auto w-full max-w-[200px]" />
    </figure>
  )
}
