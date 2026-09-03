/**
 * ChordPro chord extraction. Lyrics are ignored on purpose — Fretwise
 * never renders a lyric stave. Tags like {title:} are skipped.
 */
const CHORD_TAG = /\[([^\]]+)\]/g
const DIRECTIVE = /^\{/

export function extractChordProChords(source: string): string[] {
  const names: string[] = []
  CHORD_TAG.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = CHORD_TAG.exec(source))) {
    const raw = match[1].trim()
    if (!raw || DIRECTIVE.test(raw)) continue
    names.push(raw.replace(/[()]/g, ''))
  }
  return names.length > 0 ? names : ['G']
}

export function uniqueChordPairs(names: string[]): Array<[string, string]> {
  const seen = new Set<string>()
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < names.length - 1; i++) {
    const from = names[i]
    const to = names[i + 1]
    if (from === to) continue
    const key = `${from}\0${to}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push([from, to])
  }
  return pairs
}
