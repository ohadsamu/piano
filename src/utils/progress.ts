import type {
  Lesson,
  LessonStep,
  NoteEvaluationStatus,
  PracticeSessionSnapshot,
} from '../types';
import type { LessonProgressRecord } from './storage';
import { STEP_LABEL } from '../components/copy';

const DONE = new Set<NoteEvaluationStatus>([
  'correct_first_try',
  'correct_after_hint',
  'missed',
]);

export interface StepProgress {
  done: number;
  total: number;
  unit: 'notes' | 'keys';
}

type ProgressSnapshot = Pick<
  PracticeSessionSnapshot,
  'mode' | 'isCompleted' | 'discoveryCompletedCount' | 'noteStatuses'
> &
  Partial<Pick<PracticeSessionSnapshot, 'completedNoteCount' | 'totalNoteCount'>>;

/**
 * Counts only what the engine has actually resolved for the current pass.
 * Prefers the engine's own completedNoteCount/totalNoteCount (scoped to hand filter + loop,
 * and counting only notes actually played right); falls back to spec §4.2 otherwise.
 */
export function stepProgress(
  snap: ProgressSnapshot,
  step?: Pick<LessonStep, 'discoveryPrompts'> | null
): StepProgress {
  const unit = snap.mode === 'key_discovery' ? 'keys' : 'notes';
  if (typeof snap.completedNoteCount === 'number' && typeof snap.totalNoteCount === 'number') {
    const total = snap.totalNoteCount;
    const done =
      unit === 'keys' && snap.isCompleted ? total : Math.min(total, snap.completedNoteCount);
    return { done, total, unit };
  }
  if (snap.mode === 'key_discovery') {
    const total = step?.discoveryPrompts?.length ?? 0;
    return {
      done: snap.isCompleted ? total : Math.min(total, snap.discoveryCompletedCount),
      total,
      unit: 'keys',
    };
  }
  const statuses = Object.values(snap.noteStatuses);
  return {
    done: statuses.filter((s) => DONE.has(s)).length,
    total: statuses.length,
    unit: 'notes',
  };
}

/** Index of the first step whose stepNumber isn't completed, or the last step if all are. */
export function firstIncompleteStepIndex(
  lesson: Pick<Lesson, 'steps'>,
  record?: Pick<LessonProgressRecord, 'completedStepNumbers'> | null
): number {
  const done = new Set(record?.completedStepNumbers ?? []);
  const idx = lesson.steps.findIndex((s) => !done.has(s.stepNumber));
  return idx === -1 ? Math.max(0, lesson.steps.length - 1) : idx;
}

export interface LessonProgressSummary {
  doneCount: number;
  total: number;
  fraction: number;
  state: 'done' | 'started' | 'new';
}

export function lessonProgress(
  lesson: Pick<Lesson, 'steps'>,
  record?: Pick<LessonProgressRecord, 'completedStepNumbers'> | null
): LessonProgressSummary {
  const stepNumbers = new Set(lesson.steps.map((s) => s.stepNumber));
  const doneCount = (record?.completedStepNumbers ?? []).filter((n) =>
    stepNumbers.has(n as LessonStep['stepNumber'])
  ).length;
  const total = lesson.steps.length;
  return {
    doneCount,
    total,
    fraction: total > 0 ? doneCount / total : 0,
    state: doneCount >= total && total > 0 ? 'done' : doneCount > 0 ? 'started' : 'new',
  };
}

export function stepLabel(step: Pick<LessonStep, 'type'>): string {
  return STEP_LABEL[step.type];
}
