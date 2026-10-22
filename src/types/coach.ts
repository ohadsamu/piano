import type { FingerNumber, Hand, SingleHand } from './music';

export interface NoteAttemptRecord {
  noteId: string;
  measureIndex: number;
  beatStart: number;
  expectedMidi: number;
  expectedNoteName: string;
  hand: SingleHand;
  finger: FingerNumber;
  status: 'correct_first_try' | 'correct_after_hint' | 'missed';
  wrongMidisPlayed: number[];
  firstSemitoneDelta: number;
  timingErrorMs: number;
  hesitationMs: number;
  chordSpreadMs: number;
}

export type MistakeCategory =
  | 'ADJACENT_KEY_SLIP'
  | 'LANDMARK_DISPLACEMENT'
  | 'OCTAVE_SHIFT'
  | 'INTERVAL_MISJUDGE'
  | 'CHROMATIC_ACCIDENTAL_MISS'
  | 'RUSHING_BEAT'
  | 'DRAGGING_HESITATION'
  | 'SHORT_NOTE_CLIPPING'
  | 'CHORD_TRANSITION_STALL'
  | 'TWO_HAND_DESYNC';

export interface DetectedIssue {
  category: MistakeCategory;
  severity: 'high' | 'medium' | 'low';
  title: string;
  diagnosisExplanation: string;
  actionableFixTip: string;
  affectedMeasures: number[];
  exampleDetail: string;
  recommendedVideoIds: string[];
}

export interface MeasureHealthSummary {
  measureIndex: number;
  totalNotes: number;
  firstTryCount: number;
  hintedCount: number;
  missedCount: number;
  avgTimingErrorMs: number;
  maxHesitationMs: number;
  troubleScore: number;
}

export interface RemediationStage {
  stageNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  mode: 'wait_mode' | 'slow_practice';
  tempoMultiplier: number;
  handFilter: Hand;
  measureRange: [number, number];
  targetCleanReps: number;
}

export interface RemediationPlan {
  id: string;
  title: string;
  summary: string;
  measureRange: [number, number];
  focusHand: Hand;
  stages: RemediationStage[];
  linkedVideoIds: string[];
}

export interface CoachDiagnosisReport {
  overallAccuracyPct: number;
  firstTryPct: number;
  starsEarned: 0 | 1 | 2 | 3;
  meanTimingErrorMs: number;
  rhythmTendency: 'on_beat' | 'rushing' | 'dragging';
  measureSummaries: MeasureHealthSummary[];
  troubleMeasures: number[];
  detectedIssues: DetectedIssue[];
  remediationPlan: RemediationPlan | null;
  recommendedVideos: string[];
  encouragementHeadline: string;
  teacherSummary: string;
}
