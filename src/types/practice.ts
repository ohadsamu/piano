import type { Hand, ScoreNoteEvent } from './music';

export type PracticeMode =
  | 'key_discovery'
  | 'wait_mode'
  | 'slow_practice'
  | 'performance'
  | 'remediation_drill'
  | 'auto_demo';

export type VisualizerMode = 'both' | 'sheet' | 'falling';

export type NoteEvaluationStatus =
  | 'upcoming'
  | 'active_target'
  | 'hint_active'
  | 'correct_first_try'
  | 'correct_after_hint'
  | 'wrong_pitch'
  | 'missed';

export interface LiveCorrectionFeedback {
  timestampMs: number;
  expectedNote: ScoreNoteEvent;
  playedMidi: number;
  playedNoteName: string;
  /** playedMidi - expectedNote.midi */
  semitoneDelta: number;
  /** Signed count of white keys to move left (-) or right (+) */
  whiteKeyDelta: number;
  direction: 'left' | 'right' | 'exact';
  headline: string;
  actionInstruction: string;
}

export interface BeatChordGroup {
  groupIndex: number;
  beatStart: number;
  measureIndex: number;
  notes: ScoreNoteEvent[];
  satisfiedNoteIds: Set<string>;
}

export interface PracticeSessionSnapshot {
  mode: PracticeMode;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  currentBeat: number;
  currentMeasure: number;
  effectiveBpm: number;
  tempoMultiplier: number;
  handFilter: Hand;
  loopRange: [number, number] | null;
  metronomeEnabled: boolean;
  accompanimentEnabled: boolean;
  showNoteNames: boolean;
  showFingerNumbers: boolean;
  showOverheadHands: boolean;
  noteStatuses: Record<string, NoteEvaluationStatus>;
  activeTargetMidis: number[];
  hintedMidis: number[];
  wrongPlayedMidis: number[];
  currentlyHeldMidis: number[];
  liveCorrection: LiveCorrectionFeedback | null;
  discoveryIndex: number;
  discoveryCompletedCount: number;
  streak: number;
  maxStreak: number;
  remediationStageIndex: number;
  remediationCleanPasses: number;
}
