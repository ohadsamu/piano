import type { Hand } from '../../types';
import type { TargetKeyAnnotation } from '../visualizers/InteractiveKeyboard';

export type TargetNote = TargetKeyAnnotation;

export type Selection =
  | { kind: 'lesson'; lessonId: string; stepIndex: number }
  | { kind: 'song'; songId: string };

export type SongMode = 'wait_mode' | 'slow_practice' | 'auto_demo';

export interface PracticeHandlers {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  showMe(): void;
  skipNote(): void;
  slower(): void;
  next(): void;
  skipStep(): void;
  practiseBar(measureIndex: number): void;
  clearLoop(): void;
  selectStep(stepIndex: number): void;
  changeMode(mode: SongMode): void;
  keyDown(midi: number): void;
  keyUp(midi: number): void;
  openSettings(): void;
  openTips(): void;
  openInput(): void;
  openIntroVideo(): void;
  goHome(): void;
}

export interface SettingsHandlers {
  setHand(h: Hand): void;
  setSpeed(mult: number): void;
  toggleMetronome(): void;
  toggleBacking(): void;
  toggleNoteNames(): void;
  toggleFalling(): void;
  toggleHandGuide(): void;
  skipStep(): void;
}
