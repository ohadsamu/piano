export type Hand = 'right' | 'left' | 'both';
export type SingleHand = 'right' | 'left';
export type Clef = 'treble' | 'bass';
export type FingerNumber = 1 | 2 | 3 | 4 | 5;

export type NoteDurationType = 'whole' | 'half' | 'quarter' | 'eighth';

export interface ScoreNoteEvent {
  /** Unique deterministic ID within the score (e.g., "m0-b0-rh-60") */
  id: string;
  /** MIDI note number (48 = C3, 60 = Middle C4, 72 = C5, 83 = B5) */
  midi: number;
  /** Scientific pitch notation (e.g., "C4", "F#4") */
  noteName: string;
  /** 0-indexed measure number */
  measureIndex: number;
  /** Global beat position from start of score (quarter note = 1.0 beat) */
  beatStart: number;
  /** Duration in beats (whole = 4, half = 2, quarter = 1, eighth = 0.5) */
  durationBeats: number;
  durationType: NoteDurationType;
  hand: SingleHand;
  clef: Clef;
  /** Recommended finger (1 = Thumb, 2 = Index, 3 = Middle, 4 = Ring, 5 = Pinky) */
  finger: FingerNumber;
  /** Optional chord symbol displayed above the staff (e.g., "C", "Am", "G7") */
  chordSymbol?: string;
  /** Optional pedagogical coaching tip for this specific note transition */
  techniqueTip?: string;
  /** Optional lyric or solfege syllable */
  lyric?: string;
}

export interface AccompanimentEvent {
  beatStart: number;
  durationBeats: number;
  midiNotes: number[];
  style: 'warm_pad' | 'bass_pulse' | 'arpeggio' | 'percussion_accent';
  velocity: number;
}

export interface ScoreData {
  id: string;
  title: string;
  subtitle: string;
  /** Target 100% tempo in Beats Per Minute */
  bpm: number;
  timeSignature: [number, number];
  keySignature: string;
  totalMeasures: number;
  totalBeats: number;
  notes: ScoreNoteEvent[];
  accompaniment: AccompanimentEvent[];
}
