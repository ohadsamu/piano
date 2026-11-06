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
    // Public-domain replacement for a copyrighted pop song: "Jingle Bells"
    // (James Lord Pierpont, 1857). Same skills: RH 5-finger C position melody
    // over LH bass roots C3 / F3 / G3.
    id: 'song-jingle-bells',
    title: 'Jingle Bells (Chorus)',
    artist: 'James Lord Pierpont (1857)',
    genre: 'Folk & Traditional',
    difficulty: 'Beginner 2',
    recommendedVideoId: 'vid-06-left-hand-anchor-and-groove',
    score: {
      id: 'song-score-jingle-bells',
      title: 'Jingle Bells (Chorus)',
      subtitle: 'Right Hand C Position Melody · Left Hand Bass Notes C, F & G',
      bpm: 88,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 8,
      totalBeats: 32,
      notes: [
        // Measure 1 (C): E4 E4 E4(half)
        songNote('jgl', 0, 0, 4, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Left Hand Pinky (5) holds Bass C (C3) for the whole measure',
        }),
        songNote('jgl', 0, 0, 1, 64, 'right', 3, {
          techniqueTip: 'Right Hand in C position: Thumb (1) on C4, so E4 is Middle Finger (3)',
          lyric: 'Jin-',
        }),
        songNote('jgl', 0, 1, 1, 64, 'right', 3, { lyric: 'gle' }),
        songNote('jgl', 0, 2, 2, 64, 'right', 3, { durationType: 'half', lyric: 'bells —' }),
        // Measure 2 (C): E4 E4 E4(half)
        songNote('jgl', 1, 4, 4, 48, 'left', 5, { clef: 'bass', chordSymbol: 'C', durationType: 'whole' }),
        songNote('jgl', 1, 4, 1, 64, 'right', 3, { lyric: 'jin-' }),
        songNote('jgl', 1, 5, 1, 64, 'right', 3, { lyric: 'gle' }),
        songNote('jgl', 1, 6, 2, 64, 'right', 3, { durationType: 'half', lyric: 'bells —' }),
        // Measure 3 (C): E4 G4 C4 D4
        songNote('jgl', 2, 8, 4, 48, 'left', 5, { clef: 'bass', chordSymbol: 'C', durationType: 'whole' }),
        songNote('jgl', 2, 8, 1, 64, 'right', 3, { lyric: 'jin-' }),
        songNote('jgl', 2, 9, 1, 67, 'right', 5, {
          techniqueTip: 'Skip up to G4 with Pinky (5), then drop to C4 with Thumb (1)',
          lyric: 'gle',
        }),
        songNote('jgl', 2, 10, 1, 60, 'right', 1, { lyric: 'all' }),
        songNote('jgl', 2, 11, 1, 62, 'right', 2, { lyric: 'the' }),
        // Measure 4 (C): E4(whole)
        songNote('jgl', 3, 12, 4, 48, 'left', 5, { clef: 'bass', chordSymbol: 'C', durationType: 'whole' }),
        songNote('jgl', 3, 12, 4, 64, 'right', 3, {
          durationType: 'whole',
          techniqueTip: 'Hold E4 for all 4 beats',
          lyric: 'way — — —',
        }),
        // Measure 5 (F): F4 F4 F4 F4
        songNote('jgl', 4, 16, 4, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'whole',
          techniqueTip: 'Left Hand Index (2) moves to F3',
        }),
        songNote('jgl', 4, 16, 1, 65, 'right', 4, { lyric: 'Oh' }),
        songNote('jgl', 4, 17, 1, 65, 'right', 4, { lyric: 'what' }),
        songNote('jgl', 4, 18, 1, 65, 'right', 4, { lyric: 'fun' }),
        songNote('jgl', 4, 19, 1, 65, 'right', 4, { lyric: 'it' }),
        // Measure 6 (C): F4 E4 E4 E4(eighth) E4(eighth)
        songNote('jgl', 5, 20, 4, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Left Hand Pinky (5) back home on C3',
        }),
        songNote('jgl', 5, 20, 1, 65, 'right', 4, { lyric: 'is' }),
        songNote('jgl', 5, 21, 1, 64, 'right', 3, { lyric: 'to' }),
        songNote('jgl', 5, 22, 1, 64, 'right', 3, { lyric: 'ride' }),
        songNote('jgl', 5, 23, 0.5, 64, 'right', 3, {
          durationType: 'eighth',
          techniqueTip: 'Two quick half-beat notes: count "4-and"',
          lyric: 'in',
        }),
        songNote('jgl', 5, 23.5, 0.5, 64, 'right', 3, { durationType: 'eighth', lyric: 'a' }),
        // Measure 7 (G7): G4 G4 F4 D4
        songNote('jgl', 6, 24, 4, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G7',
          durationType: 'whole',
          techniqueTip: 'Left Hand Thumb (1) on G3',
        }),
        songNote('jgl', 6, 24, 1, 67, 'right', 5, { lyric: 'one' }),
        songNote('jgl', 6, 25, 1, 67, 'right', 5, { lyric: 'horse' }),
        songNote('jgl', 6, 26, 1, 65, 'right', 4, { lyric: 'o-' }),
        songNote('jgl', 6, 27, 1, 62, 'right', 2, { lyric: 'pen' }),
        // Measure 8 (C): C4(whole)
        songNote('jgl', 7, 28, 4, 48, 'left', 5, { clef: 'bass', chordSymbol: 'C', durationType: 'whole' }),
        songNote('jgl', 7, 28, 4, 60, 'right', 1, {
          durationType: 'whole',
          techniqueTip: 'Both hands land on C together. Hold for 4 beats!',
          lyric: 'sleigh! — — —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [55, 60], style: 'bass_pulse', velocity: 46 },
        { beatStart: 4, durationBeats: 4, midiNotes: [55, 60], style: 'bass_pulse', velocity: 46 },
        { beatStart: 8, durationBeats: 4, midiNotes: [55, 60], style: 'bass_pulse', velocity: 46 },
        { beatStart: 12, durationBeats: 4, midiNotes: [55, 60], style: 'warm_pad', velocity: 46 },
        { beatStart: 16, durationBeats: 4, midiNotes: [57, 60], style: 'bass_pulse', velocity: 46 },
        { beatStart: 20, durationBeats: 4, midiNotes: [55, 60], style: 'bass_pulse', velocity: 46 },
        { beatStart: 24, durationBeats: 4, midiNotes: [53, 59], style: 'bass_pulse', velocity: 48 },
        { beatStart: 28, durationBeats: 4, midiNotes: [52, 55, 60], style: 'warm_pad', velocity: 52 },
      ],
    },
  },
  {
    id: 'song-minuet-in-g',
    title: 'Minuet in G (Simplified)',
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
      totalMeasures: 5,
      totalBeats: 20,
      notes: [
        // Measure 1: C -> G (LH C3, G3; RH E5, D5)
        songNote('can', 0, 0, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Left Hand Pinky (5) on C3 + Right Hand Pinky (5) on E5',
        }),
        songNote('can', 0, 0, 2, 76, 'right', 5, {
          durationType: 'half',
          techniqueTip: 'Right Hand rests on A4–E5: Thumb (1) on A4, Pinky (5) on E5',
          lyric: 'Soar —',
        }),
        songNote('can', 0, 2, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'Left Hand Thumb (1) on G3 + Right Hand Ring (4) on D5',
        }),
        songNote('can', 0, 2, 2, 74, 'right', 4, { durationType: 'half', lyric: 'ing —' }),
        // Measure 2: Am -> Em (LH A3, E3; RH C5, B4)
        songNote('can', 1, 4, 2, 57, 'left', 1, { clef: 'bass', chordSymbol: 'Am', durationType: 'half' }),
        songNote('can', 1, 4, 2, 72, 'right', 3, { durationType: 'half', lyric: 'gen -' }),
        songNote('can', 1, 6, 2, 52, 'left', 3, { clef: 'bass', chordSymbol: 'Em', durationType: 'half' }),
        songNote('can', 1, 6, 2, 71, 'right', 2, { durationType: 'half', lyric: 'tly —' }),
        // Measure 3: F -> C (LH F3, C3; RH A4, G4)
        songNote('can', 2, 8, 2, 53, 'left', 2, { clef: 'bass', chordSymbol: 'F', durationType: 'half' }),
        songNote('can', 2, 8, 2, 69, 'right', 1, { durationType: 'half', lyric: 'step -' }),
        songNote('can', 2, 10, 2, 48, 'left', 5, { clef: 'bass', chordSymbol: 'C', durationType: 'half' }),
        songNote('can', 2, 10, 2, 67, 'right', 1, {
          durationType: 'half',
          techniqueTip: 'Slide your Right Thumb (1) down one white key to G4',
          lyric: 'ping —',
        }),
        // Measure 4: F -> G (LH F3, G3; RH A4, B4)
        songNote('can', 3, 12, 2, 53, 'left', 2, { clef: 'bass', chordSymbol: 'F', durationType: 'half' }),
        songNote('can', 3, 12, 2, 69, 'right', 2, { durationType: 'half', lyric: 'home -' }),
        songNote('can', 3, 14, 2, 55, 'left', 1, { clef: 'bass', chordSymbol: 'G', durationType: 'half' }),
        songNote('can', 3, 14, 2, 71, 'right', 3, { durationType: 'half', lyric: 'ward —' }),
        // Measure 5: C (both hands land home)
        songNote('can', 4, 16, 4, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Both hands land together and hold for 4 beats',
        }),
        songNote('can', 4, 16, 4, 72, 'right', 4, { durationType: 'whole', lyric: 'home — — —' }),
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
        { beatStart: 16, durationBeats: 4, midiNotes: [55, 60, 64], style: 'warm_pad', velocity: 52 },
      ],
    },
  },
];

export function getSongById(id: string): SongLibraryEntry {
  return SONG_LIBRARY.find((song) => song.id === id) ?? SONG_LIBRARY[0];
}
