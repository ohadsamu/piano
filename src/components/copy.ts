import type { Hand, LessonStepType, PracticeMode } from '../types';

/** Single source of UI labels (spec §2.7). No emoji, no arrows. */

export const STEP_LABEL: Record<LessonStepType, string> = {
  video_intro: 'Watch first',
  key_discovery: 'Find the keys',
  wait_mode: 'At your pace',
  slow_flow: 'Slow play-along',
  stage_performance: 'Full speed',
};

export const MODE_LABEL: Record<PracticeMode, string> = {
  key_discovery: 'Find the keys',
  wait_mode: 'At your pace',
  slow_practice: 'Slow play-along',
  performance: 'Full speed',
  remediation_drill: 'Practise a bar',
  auto_demo: 'Hear it',
};

export const HAND_LABEL: Record<Hand, string> = {
  right: 'Right',
  left: 'Left',
  both: 'Both hands',
};

export const HAND_NAME: Record<'right' | 'left', string> = {
  right: 'right hand',
  left: 'left hand',
};

export const COPY = {
  brand: 'Nocturne',
  home: 'Home',
  back: 'Back',
  continue: 'Continue',
  pickUp: 'Pick up where you left off',
  startHere: 'Start here: your first lesson',
  lessons: 'Lessons',
  songs: 'Songs to play freely',
  quickDrills: 'Quick drills',
  quickDrillsHint: '5 min',
  settings: 'Settings',
  howYouPlay: 'How you play',
  whatToWorkOn: 'What to work on',
  start: 'Start',
  pressToStart: 'Press the glowing key to start',
  pressStartTimed: 'Press Start, then play along',
  showMe: 'Show me',
  skipNote: 'Skip this note',
  pause: 'Pause',
  resume: 'Resume',
  paused: 'Paused',
  slower: 'Slower',
  startOver: 'Start over',
  playAgain: 'Play again',
  stepDone: 'Step done',
  songDone: 'Song done',
  nothingPlayed: 'Nothing was played. Try again',
  skipStep: 'Skip step',
  skipStepHint: 'Moves on without marking this step done.',
  backToHome: 'Back to Home',
  playItYourself: 'Play it yourself',
  listening: 'Listening',
  watchIntro: 'Watch the intro',
  backToFullPiece: 'Back to full piece',
  turnOnMic: 'Turn on microphone',
  turnOffMic: 'Turn off microphone',
  tuneRoom: 'Tune to my room',
  micBlocked: "Microphone blocked. Allow it in your browser's site settings.",
  noTips: 'Play this step once to get tips.',
  hands: 'Hands',
  speed: 'Speed',
  metronome: 'Metronome',
  backing: 'Backing music',
  noteNames: 'Note names on the music',
  falling: 'Falling notes',
  handGuide: 'Hand guide picture',
  close: 'Close',
  upNext: 'Coming up',
  playNow: 'Play now',
  getReady: 'Get ready…',
  allDone: 'All lessons done',
} as const;

export function nextStepLabel(label: string, stepNumber: number): string {
  return `Next: ${label} (step ${stepNumber})`;
}

export function nextLessonLabel(title: string): string {
  return `Next lesson: ${title}`;
}

export function practiseBarLabel(measureIndex: number): string {
  return `Practise bar ${measureIndex + 1}`;
}

export function stepOfLabel(stepNumber: number, total: number, label: string): string {
  return `Step ${stepNumber} of ${total} · ${label}`;
}
