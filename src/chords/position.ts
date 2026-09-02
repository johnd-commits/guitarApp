import { beatsPerBar, secondsPerBeat, type TimeSignature } from '../audio/timing'

export type MusicalPosition = {
  elapsed: number
  songBar: number
  beat: number
  beatPhase: number
  inCountIn: boolean
  countInBeatsLeft: number
}

export function musicalPosition(
  elapsed: number,
  tempo: number,
  timeSignature: TimeSignature,
  countInBars: number,
): MusicalPosition {
  const bpb = beatsPerBar(timeSignature)
  const beatLen = secondsPerBeat(tempo)
  const barLen = beatLen * bpb
  const countInBeats = countInBars * bpb

  if (elapsed < 0) {
    return {
      elapsed,
      songBar: 0,
      beat: 0,
      beatPhase: 0,
      inCountIn: countInBars > 0,
      countInBeatsLeft: countInBeats,
    }
  }

  const totalBeats = elapsed / beatLen
  if (totalBeats < countInBeats) {
    return {
      elapsed,
      songBar: 0,
      beat: Math.floor(totalBeats % bpb),
      beatPhase: totalBeats - Math.floor(totalBeats),
      inCountIn: true,
      countInBeatsLeft: countInBeats - totalBeats,
    }
  }

  const songBeats = totalBeats - countInBeats
  const songBar = Math.floor(elapsed / barLen) - countInBars
  const beat = Math.floor(songBeats % bpb)
  const beatPhase = songBeats - Math.floor(songBeats)

  return {
    elapsed,
    songBar: Math.max(0, songBar),
    beat,
    beatPhase,
    inCountIn: false,
    countInBeatsLeft: 0,
  }
}
