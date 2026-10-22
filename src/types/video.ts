import type { MistakeCategory } from './coach';
import type { FingerNumber, ScoreData, SingleHand } from './music';

export interface VideoChapter {
  timeSec: number;
  title: string;
  keyTakeaway: string;
  narration: string;
  demoNotesMidi: number[];
  hand?: SingleHand;
  finger?: FingerNumber;
}

export interface VideoInteractiveCheckpoint {
  prompt: string;
  instructions: string;
  targetMidis: number[];
  targetNoteNames: string[];
  hand: SingleHand;
  fingers: FingerNumber[];
}

export interface VideoLesson {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  durationLabel: string;
  durationSec: number;
  category:
    | 'Posture & Landmarks'
    | 'Sight Reading'
    | 'Rhythm & Tempo'
    | 'Chords & Accompaniment'
    | 'Hand Coordination';
  addressesMistakes: MistakeCategory[];
  linkedLessonIds: string[];
  summary: string;
  keyCheckpoints: string[];
  youtubeVideoId: string;
  youtubeStartSec?: number;
  interactiveDemoScore: ScoreData;
  chapters: VideoChapter[];
  interactiveCheckpoint: VideoInteractiveCheckpoint;
}
