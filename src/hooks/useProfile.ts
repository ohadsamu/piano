import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CoachDiagnosisReport, MicCalibrationConfig } from '../types';
import {
  loadUserProfile,
  saveUserProfile,
  type LessonProgressRecord,
  type PersistedUserProfile,
  type PreferredInput,
} from '../utils/storage';

function emptyRecord(lessonId: string): LessonProgressRecord {
  return {
    lessonId,
    completedStepNumbers: [],
    starsEarned: 0,
    bestAccuracyPct: 0,
    attemptsCount: 0,
    lastPlayedIso: new Date().toISOString(),
  };
}

/** Pure updater: marks a step done (and folds in the report when there is one). */
export function applyStepDone(
  prev: PersistedUserProfile,
  lessonId: string,
  stepNumber: number,
  report?: CoachDiagnosisReport | null
): PersistedUserProfile {
  const existing = prev.lessonProgress[lessonId] ?? emptyRecord(lessonId);
  const completedStepNumbers = Array.from(
    new Set([...existing.completedStepNumbers, stepNumber])
  ).sort((a, b) => a - b);
  const xpGain = report ? (report.starsEarned > 0 ? report.starsEarned * 40 : 25) : 30;
  const next: LessonProgressRecord = {
    ...existing,
    completedStepNumbers,
    lastPlayedIso: new Date().toISOString(),
  };
  if (report) {
    next.starsEarned = Math.max(existing.starsEarned, report.starsEarned) as 0 | 1 | 2 | 3;
    next.bestAccuracyPct = Math.max(existing.bestAccuracyPct, report.overallAccuracyPct);
    next.attemptsCount = existing.attemptsCount + 1;
    next.lastDiagnosis = report;
  }
  const skipped = prev.skippedSteps?.[lessonId];
  return {
    ...prev,
    xp: prev.xp + xpGain,
    lessonProgress: { ...prev.lessonProgress, [lessonId]: next },
    skippedSteps: skipped
      ? { ...prev.skippedSteps, [lessonId]: skipped.filter((n) => n !== stepNumber) }
      : prev.skippedSteps,
  };
}

/** Pure updater: records a skip. Awards nothing and adds no check mark. */
export function applyStepSkipped(
  prev: PersistedUserProfile,
  lessonId: string,
  stepNumber: number
): PersistedUserProfile {
  const done = prev.lessonProgress[lessonId]?.completedStepNumbers ?? [];
  if (done.includes(stepNumber)) return prev;
  const list = prev.skippedSteps?.[lessonId] ?? [];
  return {
    ...prev,
    skippedSteps: {
      ...(prev.skippedSteps ?? {}),
      [lessonId]: Array.from(new Set([...list, stepNumber])).sort((a, b) => a - b),
    },
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<PersistedUserProfile>(() => loadUserProfile());

  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  const markStepDone = useCallback(
    (lessonId: string, stepNumber: number, report?: CoachDiagnosisReport | null) =>
      setProfile((prev) => applyStepDone(prev, lessonId, stepNumber, report)),
    []
  );

  const markStepSkipped = useCallback(
    (lessonId: string, stepNumber: number) =>
      setProfile((prev) => applyStepSkipped(prev, lessonId, stepNumber)),
    []
  );

  const markVideoWatched = useCallback(
    (videoId: string) =>
      setProfile((prev) =>
        prev.watchedVideoIds.includes(videoId)
          ? prev
          : { ...prev, xp: prev.xp + 40, watchedVideoIds: [...prev.watchedVideoIds, videoId] }
      ),
    []
  );

  const recordWorkout = useCallback(
    (workoutId: string, xp: number) =>
      setProfile((prev) => ({
        ...prev,
        xp: prev.xp + xp,
        completedWorkoutCounts: {
          ...prev.completedWorkoutCounts,
          [workoutId]: (prev.completedWorkoutCounts[workoutId] ?? 0) + 1,
        },
      })),
    []
  );

  const setMicCalibration = useCallback(
    (cfg: Partial<MicCalibrationConfig>) =>
      setProfile((prev) => ({ ...prev, micCalibration: { ...prev.micCalibration, ...cfg } })),
    []
  );

  const setPreferredInput = useCallback(
    (preferredInput: PreferredInput) => setProfile((prev) => ({ ...prev, preferredInput })),
    []
  );

  const setActiveLesson = useCallback(
    (activeLessonId: string) =>
      setProfile((prev) =>
        prev.activeLessonId === activeLessonId ? prev : { ...prev, activeLessonId }
      ),
    []
  );

  const setShowFalling = useCallback(
    (showFalling: boolean) => setProfile((prev) => ({ ...prev, showFalling })),
    []
  );

  return useMemo(
    () => ({
      profile,
      markStepDone,
      markStepSkipped,
      markVideoWatched,
      recordWorkout,
      setMicCalibration,
      setPreferredInput,
      setActiveLesson,
      setShowFalling,
    }),
    [
      profile,
      markStepDone,
      markStepSkipped,
      markVideoWatched,
      recordWorkout,
      setMicCalibration,
      setPreferredInput,
      setActiveLesson,
      setShowFalling,
    ]
  );
}

export type ProfileApi = ReturnType<typeof useProfile>;
