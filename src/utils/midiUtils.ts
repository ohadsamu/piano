import type { Clef, FingerNumber, SingleHand } from '../types';

const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const SOLFEGE_MAP: Record<string, string> = {
  C: 'Do',
  'C#': 'Do#',
  D: 'Re',
  'D#': 'Re#',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa#',
  G: 'Sol',
  'G#': 'Sol#',
  A: 'La',
  'A#': 'La#',
  B: 'Si',
};

const DIATONIC_PITCH_CLASS_INDEX: Record<number, number> = {
  0: 0,  // C
  1: 0,  // C#
  2: 1,  // D
  3: 1,  // D#
  4: 2,  // E
  5: 3,  // F
  6: 3,  // F#
  7: 4,  // G
  8: 4,  // G#
  9: 5,  // A
  10: 5, // A#
  11: 6, // B
};

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToMidiFloat(frequencyHz: number): number {
  return 69 + 12 * Math.log2(frequencyHz / 440);
}

export function frequencyToMidiAndCents(frequencyHz: number): { midi: number; centsOff: number } {
  const midiFloat = frequencyToMidiFloat(frequencyHz);
  const midi = Math.round(midiFloat);
  const centsOff = Math.round((midiFloat - midi) * 100);
  return { midi, centsOff };
}

export function isBlackKey(midi: number): boolean {
  const pitchClass = ((midi % 12) + 12) % 12;
  return BLACK_PITCH_CLASSES.has(pitchClass);
}

export function midiToNoteName(midi: number): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES_SHARP[pitchClass]}${octave}`;
}

export function midiToPitchClassName(midi: number): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  return NOTE_NAMES_SHARP[pitchClass];
}

export function midiToSolfege(midi: number): string {
  const pc = midiToPitchClassName(midi);
  return SOLFEGE_MAP[pc] ?? pc;
}

export function noteNameToMidi(noteName: string): number {
  const match = /^([A-G]#?)(-?\d+)$/i.exec(noteName.trim());
  if (!match) return 60;
  const pitchName = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const pitchIndex = NOTE_NAMES_SHARP.indexOf(pitchName as (typeof NOTE_NAMES_SHARP)[number]);
  if (pitchIndex === -1) return 60;
  return (octave + 1) * 12 + pitchIndex;
}

/**
 * Returns the diatonic staff step offset relative to Middle C (C4 = 0).
 * Positive steps go up into Treble Clef (D4 = +1, E4 = +2 [bottom treble line], F4 = +3, G4 = +4, etc.)
 * Negative steps go down into Bass Clef (B3 = -1, A3 = -2 [top bass line], G3 = -3, etc.)
 */
export function midiToDiatonicStepFromMiddleC(midi: number): number {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = ((midi % 12) + 12) % 12;
  const diatonicInOctave = DIATONIC_PITCH_CLASS_INDEX[pitchClass] ?? 0;
  return (octave - 4) * 7 + diatonicInOctave;
}

/**
 * Counts signed white-key steps from expectedMidi to playedMidi
 */
export function countWhiteKeyDelta(fromMidi: number, toMidi: number): number {
  if (fromMidi === toMidi) return 0;
  const step = toMidi > fromMidi ? 1 : -1;
  let count = 0;
  let cur = fromMidi;
  while (cur !== toMidi) {
    cur += step;
    if (!isBlackKey(cur)) {
      count += step;
    }
  }
  if (count === 0) {
    return step;
  }
  return count;
}

export function getFingerLabel(finger: FingerNumber): string {
  switch (finger) {
    case 1:
      return 'Thumb (1)';
    case 2:
      return 'Index (2)';
    case 3:
      return 'Middle (3)';
    case 4:
      return 'Ring (4)';
    case 5:
      return 'Pinky (5)';
  }
}

export function getHandLabel(hand: SingleHand): string {
  return hand === 'right' ? 'Right Hand' : 'Left Hand';
}

export function buildDirectionalCorrectionCopy(
  expectedMidi: number,
  playedMidi: number,
  hand: SingleHand,
  finger: FingerNumber
): {
  semitoneDelta: number;
  whiteKeyDelta: number;
  direction: 'left' | 'right' | 'exact';
  headline: string;
  actionInstruction: string;
} {
  const expectedName = midiToNoteName(expectedMidi);
  const playedName = midiToNoteName(playedMidi);
  const semitoneDelta = playedMidi - expectedMidi;
  const whiteKeyDelta = countWhiteKeyDelta(playedMidi, expectedMidi);

  if (semitoneDelta === 0) {
    return {
      semitoneDelta: 0,
      whiteKeyDelta: 0,
      direction: 'exact',
      headline: `Spot on! You played ${expectedName}`,
      actionInstruction: `${getHandLabel(hand)} • ${getFingerLabel(finger)}`,
    };
  }

  const direction: 'left' | 'right' = expectedMidi < playedMidi ? 'left' : 'right';
  const absWhite = Math.abs(whiteKeyDelta);
  const tooHighOrLow = semitoneDelta > 0 ? 'too high' : 'too low';
  const targetIsBlack = isBlackKey(expectedMidi);
  const playedIsBlack = isBlackKey(playedMidi);

  let distancePhrase: string;
  if (Math.abs(semitoneDelta) === 12) {
    distancePhrase = '1 full octave';
  } else if (targetIsBlack && !playedIsBlack && Math.abs(semitoneDelta) === 1) {
    distancePhrase = `up to the black sharp key (${expectedName})`;
  } else {
    distancePhrase = `${absWhite} white ${absWhite === 1 ? 'key' : 'keys'}`;
  }

  const headline = `You played ${playedName} (${Math.abs(semitoneDelta)} ${
    Math.abs(semitoneDelta) === 1 ? 'semitone' : 'semitones'
  } ${tooHighOrLow})`;

  const moveVerb =
    targetIsBlack && !playedIsBlack && Math.abs(semitoneDelta) === 1
      ? `Slide ${direction.toUpperCase()} onto black key ${expectedName}`
      : `Move ${distancePhrase} ${direction.toUpperCase()} to ${expectedName}`;

  const actionInstruction = `${moveVerb} • Use ${getHandLabel(hand)} ${getFingerLabel(finger)}`;

  return {
    semitoneDelta,
    whiteKeyDelta,
    direction,
    headline,
    actionInstruction,
  };
}

export function inferClefForMidi(midi: number, hand?: SingleHand): Clef {
  if (hand === 'left') return 'bass';
  if (hand === 'right') return 'treble';
  return midi >= 60 ? 'treble' : 'bass';
}
