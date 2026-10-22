import type { CoachDiagnosisReport, MicCalibrationConfig } from '../types';

export interface LessonProgressRecord {
  lessonId: string;
  completedStepNumbers: number[];
  starsEarned: 0 | 1 | 2 | 3;
  bestAccuracyPct: number;
  attemptsCount: number;
  lastPlayedIso: string;
  lastDiagnosis?: CoachDiagnosisReport;
}

export interface PersistedUserProfile {
  xp: number;
  streakDays: number;
  lastPracticeDate: string;
  activeLessonId: string;
  lessonProgress: Record<string, LessonProgressRecord>;
  watchedVideoIds: string[];
  completedWorkoutCounts: Record<string, number>;
  micCalibration: MicCalibrationConfig;
}

const STORAGE_KEY = 'nocturne_ivory_studio_profile_v1';

const DEFAULT_PROFILE: PersistedUserProfile = {
  xp: 250,
  streakDays: 3,
  lastPracticeDate: new Date().toISOString().slice(0, 10),
  activeLessonId: 'lesson-01-middle-c-walk',
  lessonProgress: {
    'lesson-01-middle-c-walk': {
      lessonId: 'lesson-01-middle-c-walk',
      completedStepNumbers: [1],
      starsEarned: 0,
      bestAccuracyPct: 0,
      attemptsCount: 0,
      lastPlayedIso: new Date().toISOString(),
    },
  },
  watchedVideoIds: [],
  completedWorkoutCounts: {},
  micCalibration: {
    rmsThreshold: 0.0025,
    yinThreshold: 0.22,
    stabilityFrames: 1,
  },
};

export function loadUserProfile(): PersistedUserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<PersistedUserProfile>;
    const savedMic = parsed.micCalibration;
    // Auto-migrate legacy insensitive 0.012 threshold down to 0.0025 for E-Piano sensitivity
    const migratedMic: MicCalibrationConfig = {
      ...DEFAULT_PROFILE.micCalibration,
      ...(savedMic ?? {}),
      rmsThreshold:
        savedMic?.rmsThreshold && savedMic.rmsThreshold >= 0.01
          ? 0.0025
          : savedMic?.rmsThreshold ?? DEFAULT_PROFILE.micCalibration.rmsThreshold,
      yinThreshold:
        savedMic?.yinThreshold && savedMic.yinThreshold <= 0.16
          ? 0.22
          : savedMic?.yinThreshold ?? DEFAULT_PROFILE.micCalibration.yinThreshold,
      stabilityFrames: 1,
    };
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      lessonProgress: {
        ...DEFAULT_PROFILE.lessonProgress,
        ...(parsed.lessonProgress ?? {}),
      },
      micCalibration: migratedMic,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveUserProfile(profile: PersistedUserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors in private mode
  }
}
