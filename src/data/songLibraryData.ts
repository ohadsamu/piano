import type {
  Clef,
  FingerNumber,
  NoteDurationType,
  ScoreData,
  ScoreNoteEvent,
  SingleHand,
} from '../types';
import { inferClefForMidi, midiToNoteName } from '../utils/midiUtils';
import { CURRICULUM_LESSONS } from './curriculumData';

export interface SongLibraryEntry {
  id: string;
  title: string;
  artist: string;
  genre: 'Classical' | 'Pop & Film' | 'Folk & Traditional';
  difficulty: 'Beginner 1' | 'Beginner 2' | 'Elementary';
  recommendedVideoId: string;
  score: ScoreData;
}

function songNote(
  prefix: string,
  measureIndex: number,
  beatStart: number,
  durationBeats: number,
  midi: number,
  hand: SingleHand,
  finger: FingerNumber,
  opts?: {
    clef?: Clef;
    durationType?: NoteDurationType;
    chordSymbol?: string;
    techniqueTip?: string;
    lyric?: string;
  }
): ScoreNoteEvent {
  const durationType: NoteDurationType =
    opts?.durationType ??
    (durationBeats >= 4
      ? 'whole'
      : durationBeats >= 1.5
      ? 'half'
      : durationBeats >= 1
      ? 'quarter'
      : 'eighth');

  return {
    id: `${prefix}-m${measureIndex}-b${beatStart}-${hand}-${midi}`,
    midi,
    noteName: midiToNoteName(midi),
    measureIndex,
    beatStart,
    durationBeats,
    durationType,
    hand,
    clef: opts?.clef ?? inferClefForMidi(midi, hand),
    finger,
    chordSymbol: opts?.chordSymbol,
    techniqueTip: opts?.techniqueTip,
    lyric: opts?.lyric,
  };
}

const odeToJoyLesson = CURRICULUM_LESSONS.find((l) => l.id === 'lesson-02-ode-to-joy')!;
const minuetInGLesson = CURRICULUM_LESSONS.find((l) => l.id === 'lesson-07-two-hand-conversation')!;
const furEliseLesson = CURRICULUM_LESSONS.find((l) => l.id === 'lesson-08-fur-elise-gymnopedie')!;

export const SONG_LIBRARY: Array<{
  id: string;
  title: string;
  artist: string;
  genre: 'Classical' | 'Pop & Film' | 'Folk & Traditional';
  difficulty: 'Beginner 1' | 'Beginner 2' | 'Elementary';
  recommendedVideoId: string;
  score: ScoreData;
}> = [
  {
    id: 'song-ode-to-joy',
    title: 'Ode to Joy',
    artist: 'Ludwig van Beethoven',
    genre: 'Classical',
    difficulty: 'Beginner 1',
    recommendedVideoId: 'vid-03-steps-vs-skips',
    score: {
      ...odeToJoyLesson.score,
      id: 'song-score-ode-to-joy',
    },
  },
  {
    id: 'song-twinkle-twinkle',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional / W.A. Mozart Theme',
    genre: 'Folk & Traditional',
    difficulty: 'Beginner 1',
    recommendedVideoId: 'vid-03-steps-vs-skips',
    score: {
      id: 'song-score-twinkle-twinkle',
      title: 'Twinkle Twinkle Little Star',
      subtitle: 'Treble & Bass Duet Arrangement · C Major',
      bpm: 78,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: C4 C4 G4 G4 with LH C3 anchor
        songNote('twk', 0, 0, 4, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Left Hand Pinky (5) sustains C3 across Measure 1',
        }),
        songNote('twk', 0, 0, 1, 60, 'right', 1, {
          techniqueTip: 'Right Hand Thumb (1) on Middle C (C4)',
          lyric: 'Twin-',
        }),
        songNote('twk', 0, 1, 1, 60, 'right', 1, { lyric: 'kle' }),
        songNote('twk', 0, 2, 1, 67, 'right', 4, {
          techniqueTip: 'Jump a 5th up to G4 with Ring Finger (4) so Pinky (5) is free for A4!',
          lyric: 'twin-',
        }),
        songNote('twk', 0, 3, 1, 67, 'right', 4, { lyric: 'kle' }),
        // Measure 2: A4 A4 G4(half) with LH F3 -> E3
        songNote('twk', 1, 4, 2, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'half',
        }),
        songNote('twk', 1, 4, 1, 69, 'right', 5, {
          techniqueTip: 'Pinky (5) plays A4 effortlessly',
          lyric: 'lit-',
        }),
        songNote('twk', 1, 5, 1, 69, 'right', 5, { lyric: 'tle' }),
        songNote('twk', 1, 6, 2, 52, 'left', 3, {
          clef: 'bass',
          chordSymbol: 'C/E',
          durationType: 'half',
        }),
        songNote('twk', 1, 6, 2, 67, 'right', 4, {
          durationType: 'half',
          lyric: 'star —',
        }),
        // Measure 3: F4 F4 E4 E4
        songNote('twk', 2, 8, 2, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'half',
        }),
        songNote('twk', 2, 8, 1, 65, 'right', 4, {
          techniqueTip: 'Shift back to standard 5-finger C position: F4 with Ring Finger (4)',
          lyric: 'How',
        }),
        songNote('twk', 2, 9, 1, 65, 'right', 4, { lyric: 'I' }),
        songNote('twk', 2, 10, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
        }),
        songNote('twk', 2, 10, 1, 64, 'right', 3, { lyric: 'won-' }),
        songNote('twk', 2, 11, 1, 64, 'right', 3, { lyric: 'der' }),
        // Measure 4: D4 D4 C4(half)
        songNote('twk', 3, 12, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G7',
          durationType: 'half',
        }),
        songNote('twk', 3, 12, 1, 62, 'right', 2, { lyric: 'what' }),
        songNote('twk', 3, 13, 1, 62, 'right', 2, { lyric: 'you' }),
        songNote('twk', 3, 14, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
        }),
        songNote('twk', 3, 14, 2, 60, 'right', 1, {
          durationType: 'half',
          lyric: 'are —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55, 64], style: 'warm_pad', velocity: 45 },
        { beatStart: 4, durationBeats: 2, midiNotes: [53, 57, 60], style: 'warm_pad', velocity: 45 },
        { beatStart: 6, durationBeats: 2, midiNotes: [52, 55, 60], style: 'warm_pad', velocity: 45 },
        { beatStart: 8, durationBeats: 2, midiNotes: [53, 57, 60], style: 'arpeggio', velocity: 45 },
        { beatStart: 10, durationBeats: 2, midiNotes: [48, 52, 55], style: 'arpeggio', velocity: 45 },
        { beatStart: 12, durationBeats: 2, midiNotes: [43, 50, 59], style: 'bass_pulse', velocity: 46 },
        { beatStart: 14, durationBeats: 2, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 50 },
      ],
    },
  },
  {
    id: 'song-let-it-be',
    title: 'Let It Be (Chords & Melody)',
    artist: 'The Beatles (Conservatory Arrangement)',
    genre: 'Pop & Film',
    difficulty: 'Beginner 2',
    recommendedVideoId: 'vid-06-left-hand-anchor-and-groove',
    score: {
      id: 'song-score-let-it-be',
      title: 'Let It Be (Chords & Melody)',
      subtitle: 'Pop Ballad · C – G – Am – F Anthem Progression',
      bpm: 74,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1 (C Major): LH C3 + RH melody/chord pulse G4 G4 G4 A4
        songNote('lib', 0, 0, 4, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Left Hand Pinky (5) anchors Bass C3 across the measure',
        }),
        songNote('lib', 0, 0, 1, 67, 'right', 5, {
          techniqueTip: 'Right Hand sings the iconic G4 melody note',
          lyric: 'When',
        }),
        songNote('lib', 0, 1, 1, 67, 'right', 5, { lyric: 'I' }),
        songNote('lib', 0, 2, 1, 67, 'right', 5, { lyric: 'find' }),
        songNote('lib', 0, 3, 1, 69, 'right', 5, {
          techniqueTip: 'Reach Pinky (5) 1 key right to A4',
          lyric: 'my-',
        }),
        // Measure 2 (G Major): LH G3 + RH G4 E4 D4(half)
        songNote('lib', 1, 4, 4, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G',
          durationType: 'whole',
          techniqueTip: 'Left Hand Thumb (1) on G3',
        }),
        songNote('lib', 1, 4, 1, 67, 'right', 4, { lyric: 'self' }),
        songNote('lib', 1, 5, 1, 64, 'right', 3, { lyric: 'in' }),
        songNote('lib', 1, 6, 2, 62, 'right', 2, {
          durationType: 'half',
          lyric: 'times —',
        }),
        // Measure 3 (A Minor): LH A3 + RH C4 C4 G4 A4
        songNote('lib', 2, 8, 4, 57, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'Am',
          durationType: 'whole',
          techniqueTip: 'Step Left Hand Thumb (1) to A3 for emotional A Minor',
        }),
        songNote('lib', 2, 8, 1, 60, 'right', 1, { lyric: 'Mother' }),
        songNote('lib', 2, 9, 1, 64, 'right', 2, { lyric: 'Ma-' }),
        songNote('lib', 2, 10, 1, 67, 'right', 4, { lyric: 'ry' }),
        songNote('lib', 2, 11, 1, 69, 'right', 5, { lyric: 'comes' }),
        // Measure 4 (F Major -> C): LH F3 + RH G4 F4 E4(half)
        songNote('lib', 3, 12, 4, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'whole',
          techniqueTip: 'Left Hand Index (2) anchors warm F3',
        }),
        songNote('lib', 3, 12, 1, 67, 'right', 4, { lyric: 'Let' }),
        songNote('lib', 3, 13, 1, 65, 'right', 3, { lyric: 'it' }),
        songNote('lib', 3, 14, 2, 64, 'right', 2, {
          durationType: 'half',
          lyric: 'be —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 2, midiNotes: [60, 64], style: 'warm_pad', velocity: 48 },
        { beatStart: 2, durationBeats: 2, midiNotes: [60, 64], style: 'bass_pulse', velocity: 48 },
        { beatStart: 4, durationBeats: 2, midiNotes: [59, 62], style: 'warm_pad', velocity: 48 },
        { beatStart: 6, durationBeats: 2, midiNotes: [59, 62], style: 'bass_pulse', velocity: 48 },
        { beatStart: 8, durationBeats: 2, midiNotes: [60, 64], style: 'warm_pad', velocity: 48 },
        { beatStart: 10, durationBeats: 2, midiNotes: [60, 64], style: 'bass_pulse', velocity: 48 },
        { beatStart: 12, durationBeats: 4, midiNotes: [57, 60], style: 'warm_pad', velocity: 50 },
      ],
    },
  },
  {
    id: 'song-minuet-in-g',
    title: 'Minuet in G',
    artist: 'Christian Petzold / J.S. Bach Notebook',
    genre: 'Classical',
    difficulty: 'Elementary',
    recommendedVideoId: 'vid-08-two-hand-independence',
    score: {
      ...minuetInGLesson.score,
      id: 'song-score-minuet-in-g',
    },
  },
  {
    id: 'song-fur-elise',
    title: 'Für Elise (Theme)',
    artist: 'Ludwig van Beethoven',
    genre: 'Classical',
    difficulty: 'Elementary',
    recommendedVideoId: 'vid-07-black-keys-and-accidentals',
    score: {
      ...furEliseLesson.score,
      id: 'song-score-fur-elise',
    },
  },
  {
    id: 'song-canon-in-d',
    title: 'Canon in D (Beginner Arrangement)',
    artist: 'Johann Pachelbel (Transposed to C Major)',
    genre: 'Classical',
    difficulty: 'Beginner 2',
    recommendedVideoId: 'vid-08-two-hand-independence',
    score: {
      id: 'song-score-canon-in-d',
      title: 'Canon in C (Pachelbel Progression)',
      subtitle: 'Johann Pachelbel · Two-Hand Ground Bass & Lyrical Melody',
      bpm: 72,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: C Major (LH C3 half, G3 half; RH E5 half, D5 half)
        songNote('can', 0, 0, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Canon Ground Bass: Left Hand Pinky (5) on C3 + Right Hand Pinky (5) on E5',
        }),
        songNote('can', 0, 0, 2, 76, 'right', 5, {
          durationType: 'half',
          lyric: 'Soar —',
        }),
        songNote('can', 0, 2, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'Left Hand Thumb (1) on G3 + Right Hand Ring (4) on D5',
        }),
        songNote('can', 0, 2, 2, 74, 'right', 4, {
          durationType: 'half',
          lyric: 'ing —',
        }),
        // Measure 2: Am -> Em (LH A3 half, E3 half; RH C5 half, B4 half)
        songNote('can', 1, 4, 2, 57, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'Am',
          durationType: 'half',
        }),
        songNote('can', 1, 4, 2, 72, 'right', 3, {
          durationType: 'half',
          lyric: 'gen -',
        }),
        songNote('can', 1, 6, 2, 52, 'left', 3, {
          clef: 'bass',
          chordSymbol: 'Em',
          durationType: 'half',
        }),
        songNote('can', 1, 6, 2, 71, 'right', 2, {
          durationType: 'half',
          lyric: 'tly —',
        }),
        // Measure 3: F -> C (LH F3 half, C3 half; RH A4 half, G4 half)
        songNote('can', 2, 8, 2, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'half',
        }),
        songNote('can', 2, 8, 2, 69, 'right', 1, {
          durationType: 'half',
          lyric: 'step -',
        }),
        songNote('can', 2, 10, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
        }),
        songNote('can', 2, 10, 2, 67, 'right', 2, {
          durationType: 'half',
          lyric: 'ping —',
        }),
        // Measure 4: F -> G7 -> C (LH F3 half, G3 half; RH A4 half, B4 quarter, C5 quarter)
        songNote('can', 3, 12, 2, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'half',
        }),
        songNote('can', 3, 12, 2, 69, 'right', 3, {
          durationType: 'half',
          lyric: 'home -',
        }),
        songNote('can', 3, 14, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G7',
          durationType: 'half',
        }),
        songNote('can', 3, 14, 1, 71, 'right', 4, {
          durationType: 'quarter',
          lyric: 'ward',
        }),
        songNote('can', 3, 15, 1, 72, 'right', 5, {
          chordSymbol: 'C',
          durationType: 'quarter',
          lyric: 'now',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 2, midiNotes: [60, 64, 67], style: 'arpeggio', velocity: 46 },
        { beatStart: 2, durationBeats: 2, midiNotes: [59, 62, 67], style: 'arpeggio', velocity: 46 },
        { beatStart: 4, durationBeats: 2, midiNotes: [60, 64, 69], style: 'arpeggio', velocity: 46 },
        { beatStart: 6, durationBeats: 2, midiNotes: [59, 64, 67], style: 'arpeggio', velocity: 46 },
        { beatStart: 8, durationBeats: 2, midiNotes: [60, 65, 69], style: 'arpeggio', velocity: 46 },
        { beatStart: 10, durationBeats: 2, midiNotes: [60, 64, 67], style: 'arpeggio', velocity: 46 },
        { beatStart: 12, durationBeats: 2, midiNotes: [60, 65, 69], style: 'warm_pad', velocity: 48 },
        { beatStart: 14, durationBeats: 2, midiNotes: [59, 62, 67], style: 'warm_pad', velocity: 50 },
      ],
    },
  },
];

export function getSongById(id: string): SongLibraryEntry {
  return SONG_LIBRARY.find((song) => song.id === id) ?? SONG_LIBRARY[0];
}
