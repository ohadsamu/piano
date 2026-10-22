import type { FingerNumber, Hand, ScoreData, SingleHand } from './music';

export type CurriculumTrackId = 'soloist' | 'chords' | 'synthesis';

export type LessonStepType =
  | 'video_intro'
  | 'key_discovery'
  | 'wait_mode'
  | 'slow_flow'
  | 'stage_performance';

export interface KeyDiscoveryPrompt {
  id: string;
  targetMidi: number;
  targetNoteName: string;
  hand: SingleHand;
  finger: FingerNumber;
  instruction: string;
  landmarkHint: string;
}

export interface LessonStep {
  id: string;
  stepNumber: 1 | 2 | 3 | 4 | 5;
  type: LessonStepType;
  title: string;
  instruction: string;
  coachTip: string;
  videoId?: string;
  discoveryPrompts?: KeyDiscoveryPrompt[];
  tempoMultiplier?: number;
  handFilter?: Hand;
  measureRange?: [number, number];
}

export interface Lesson {
  id: string;
  trackId: CurriculumTrackId;
  unitNumber: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 'Beginner 1' | 'Beginner 2' | 'Elementary';
  skillsTaught: string[];
  targetNotes: string[];
  primaryVideoId: string;
  remedialVideoIds: string[];
  score: ScoreData;
  steps: LessonStep[];
}

export type WorkoutType = 'flashcard_sprint' | 'ear_pitch_match' | 'chord_switcher';

export interface WorkoutCard {
  id: string;
  promptLabel: string;
  clef: 'treble' | 'bass';
  targetMidis: number[];
  targetNoteNames: string[];
  hand: SingleHand;
  fingers: FingerNumber[];
  mnemonicHint: string;
  anchorMidi?: number;
  anchorNoteName?: string;
}

export interface WorkoutDefinition {
  id: string;
  type: WorkoutType;
  title: string;
  subtitle: string;
  durationSec: number;
  description: string;
  pedagogicalGoal: string;
  cards: WorkoutCard[];
}
