import { describe, expect, it } from 'vitest';
import type { LessonStep, NoteEvaluationStatus, PracticeMode } from '../../types';
import {
  firstIncompleteStepIndex,
  lessonProgress,
  stepLabel,
  stepProgress,
} from '../progress';

function snap(
  mode: PracticeMode,
  over: Partial<{
    isCompleted: boolean;
    discoveryCompletedCount: number;
    noteStatuses: Record<string, NoteEvaluationStatus>;
  }> = {}
) {
  return {
    mode,
    isCompleted: false,
    discoveryCompletedCount: 0,
    noteStatuses: {},
    ...over,
  };
}

const discoveryStep = {
  discoveryPrompts: [{}, {}, {}],
} as unknown as LessonStep;

const lesson = {
  steps: [1, 2, 3, 4, 5].map((n) => ({ stepNumber: n })) as unknown as LessonStep[],
};

describe('stepProgress', () => {
  it('counts keys mid-way through key discovery', () => {
    expect(stepProgress(snap('key_discovery', { discoveryCompletedCount: 1 }), discoveryStep)).toEqual({
      done: 1,
      total: 3,
      unit: 'keys',
    });
  });

  it('reports all keys when key discovery is completed', () => {
    expect(
      stepProgress(snap('key_discovery', { isCompleted: true, discoveryCompletedCount: 2 }), discoveryStep)
    ).toEqual({ done: 3, total: 3, unit: 'keys' });
  });

  it('counts resolved notes in wait mode with mixed statuses', () => {
    const p = stepProgress(
      snap('wait_mode', {
        noteStatuses: {
          a: 'correct_first_try',
          b: 'correct_after_hint',
          c: 'missed',
          d: 'active_target',
          e: 'hint_active',
          f: 'upcoming',
          g: 'wrong_pitch',
        },
      })
    );
    expect(p).toEqual({ done: 3, total: 7, unit: 'notes' });
  });

  it('prefers the engine counters when present (missed notes are not "done")', () => {
    const p = stepProgress({
      ...snap('slow_practice', { noteStatuses: { a: 'missed', b: 'correct_first_try' } }),
      completedNoteCount: 1,
      totalNoteCount: 2,
    });
    expect(p).toEqual({ done: 1, total: 2, unit: 'notes' });
    expect(
      stepProgress(
        { ...snap('key_discovery', { isCompleted: true }), completedNoteCount: 2, totalNoteCount: 3 },
        discoveryStep
      )
    ).toEqual({ done: 3, total: 3, unit: 'keys' });
  });

  it('handles an empty noteStatuses map', () => {
    expect(stepProgress(snap('wait_mode'))).toEqual({ done: 0, total: 0, unit: 'notes' });
  });
});

describe('firstIncompleteStepIndex', () => {
  it('returns 0 when no steps are done', () => {
    expect(firstIncompleteStepIndex(lesson, undefined)).toBe(0);
    expect(firstIncompleteStepIndex(lesson, { completedStepNumbers: [] })).toBe(0);
  });

  it('returns the first gap when some steps are done', () => {
    expect(firstIncompleteStepIndex(lesson, { completedStepNumbers: [1] })).toBe(1);
    expect(firstIncompleteStepIndex(lesson, { completedStepNumbers: [1, 2, 4] })).toBe(2);
  });

  it('returns the last step when all are done', () => {
    expect(firstIncompleteStepIndex(lesson, { completedStepNumbers: [1, 2, 3, 4, 5] })).toBe(4);
  });
});

describe('lessonProgress', () => {
  it('summarises done counts and state', () => {
    expect(lessonProgress(lesson, undefined).state).toBe('new');
    expect(lessonProgress(lesson, { completedStepNumbers: [1, 2] })).toMatchObject({
      doneCount: 2,
      total: 5,
      state: 'started',
    });
    expect(lessonProgress(lesson, { completedStepNumbers: [1, 2, 3, 4, 5] }).state).toBe('done');
  });
});

describe('stepLabel', () => {
  it('uses plain-language labels', () => {
    expect(stepLabel({ type: 'wait_mode' })).toBe('At your pace');
    expect(stepLabel({ type: 'slow_flow' })).toBe('Slow play-along');
  });
});
