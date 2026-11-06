import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CoachDiagnosisReport,
  Lesson,
  LessonStep,
  PracticeMode,
  RemediationPlan,
  ScoreData,
} from '../types';
import { CURRICULUM_LESSONS, SONG_LIBRARY, getLessonById } from '../data';
import type { SongLibraryEntry } from '../data/songLibraryData';
import type { PracticeEngine } from '../engines/PracticeEngine';
import { sharedAudioEngine } from '../engines/AudioEngine';
import type { Selection, SongMode } from '../components/practice/types';
import { firstIncompleteStepIndex } from '../utils/progress';
import type { ProfileApi } from './useProfile';

export function stepToMode(step: Pick<LessonStep, 'type'> | null | undefined): PracticeMode {
  switch (step?.type) {
    case 'key_discovery':
      return 'key_discovery';
    case 'slow_flow':
      return 'slow_practice';
    case 'stage_performance':
      return 'performance';
    default:
      return 'wait_mode';
  }
}

export function isTimedMode(mode: PracticeMode, stageMode?: string): boolean {
  if (mode === 'remediation_drill') return stageMode === 'slow_practice';
  return mode === 'slow_practice' || mode === 'performance' || mode === 'auto_demo';
}

/** Where "Next" goes after a lesson step. */
export type NextTarget =
  | { kind: 'step'; selection: Selection; step: LessonStep }
  | { kind: 'lesson'; selection: Selection; lesson: Lesson }
  | { kind: 'home' };

export type BarFocus =
  | { kind: 'plan'; plan: RemediationPlan; measureIndex: number }
  | { kind: 'loop'; measureIndex: number }
  | null;

export interface LessonFlowOptions {
  /** Legacy behaviour (Task 1): resume immediately after every load. */
  autoStart?: boolean;
}

export function selectionKey(sel: Selection): string {
  return sel.kind === 'lesson' ? `lesson:${sel.lessonId}:${sel.stepIndex}` : `song:${sel.songId}`;
}

export function useLessonFlow(
  engine: PracticeEngine,
  selection: Selection,
  profileApi: ProfileApi,
  navigate: (target: Selection | 'home') => void,
  opts: LessonFlowOptions = {}
) {
  const { profile, markStepSkipped } = profileApi;
  const lesson: Lesson | null =
    selection.kind === 'lesson' ? getLessonById(selection.lessonId) : null;
  const song: SongLibraryEntry | null =
    selection.kind === 'song' ? SONG_LIBRARY.find((s) => s.id === selection.songId) ?? null : null;
  const stepIndex = lesson
    ? Math.max(0, Math.min(lesson.steps.length - 1, selection.kind === 'lesson' ? selection.stepIndex : 0))
    : 0;
  const step: LessonStep | null = lesson ? lesson.steps[stepIndex] ?? null : null;
  const score: ScoreData = song?.score ?? lesson?.score ?? CURRICULUM_LESSONS[0].score;
  const mode = stepToMode(step);

  const [barFocus, setBarFocus] = useState<BarFocus>(null);
  const [loadCount, setLoadCount] = useState(0);
  const autoStartRef = useRef(!!opts.autoStart);
  autoStartRef.current = !!opts.autoStart;

  const key = selectionKey(selection);

  const maybeAutoStart = useCallback(() => {
    if (autoStartRef.current) {
      void sharedAudioEngine.init();
      engine.resume();
    }
  }, [engine]);

  // Load the score / step whenever the selection changes. Never auto-starts unless opted in.
  useEffect(() => {
    setBarFocus(null);
    if (song) {
      engine.loadScore(song.score, {
        mode: 'wait_mode',
        tempoMultiplier: 1,
        handFilter: 'both',
        loopRange: null,
      });
      maybeAutoStart();
      return;
    }
    if (!lesson || !step) return;
    if (engine.getScore() !== lesson.score) {
      engine.loadScore(lesson.score, { mode, lessonStep: step });
    } else {
      engine.startPractice(mode, { lessonStep: step, AutoStart: false });
    }
    if (step.type !== 'video_intro') maybeAutoStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loadCount, engine]);

  const start = useCallback(() => {
    void sharedAudioEngine.init();
    engine.resume();
  }, [engine]);

  const startStep = useCallback(() => {
    setBarFocus(null);
    if (song) {
      const snap = engine.getSnapshot();
      const songMode: SongMode =
        snap.mode === 'slow_practice' || snap.mode === 'auto_demo' ? snap.mode : 'wait_mode';
      engine.startPractice(songMode, {
        tempoMultiplier: songMode === 'slow_practice' ? 0.65 : 1,
        handFilter: snap.handFilter,
        loopRange: null,
        AutoStart: false,
      });
    } else if (step) {
      engine.startPractice(mode, { lessonStep: step, AutoStart: false });
    }
  }, [engine, song, step, mode]);

  const restart = useCallback(() => {
    const snap = engine.getSnapshot();
    if (barFocus?.kind === 'plan') {
      engine.startPractice('remediation_drill', {
        remediationPlan: barFocus.plan,
        AutoStart: false,
      });
    } else if (barFocus?.kind === 'loop') {
      engine.startPractice('wait_mode', {
        tempoMultiplier: 1,
        handFilter: snap.handFilter,
        loopRange: [barFocus.measureIndex, barFocus.measureIndex],
        AutoStart: false,
      });
    } else {
      startStep();
    }
    maybeAutoStart();
  }, [engine, barFocus, startStep, maybeAutoStart]);

  const practiseBar = useCallback(
    (measureIndex: number, report?: CoachDiagnosisReport | null) => {
      const plan = report?.remediationPlan ?? null;
      if (plan && plan.measureRange[0] <= measureIndex && measureIndex <= plan.measureRange[1]) {
        setBarFocus({ kind: 'plan', plan, measureIndex });
        engine.startPractice('remediation_drill', { remediationPlan: plan, AutoStart: false });
      } else {
        setBarFocus({ kind: 'loop', measureIndex });
        engine.startPractice('wait_mode', {
          tempoMultiplier: 1,
          handFilter: engine.getSnapshot().handFilter,
          loopRange: [measureIndex, measureIndex],
          AutoStart: false,
        });
      }
      maybeAutoStart();
    },
    [engine, maybeAutoStart]
  );

  const clearLoop = useCallback(() => {
    startStep();
  }, [startStep]);

  const changeMode = useCallback(
    (next: SongMode) => {
      setBarFocus(null);
      engine.startPractice(next, {
        tempoMultiplier: next === 'slow_practice' ? 0.65 : 1,
        handFilter: engine.getSnapshot().handFilter,
        loopRange: null,
        AutoStart: false,
      });
      maybeAutoStart();
    },
    [engine, maybeAutoStart]
  );

  const nextTarget: NextTarget = useMemo(() => {
    if (!lesson) return { kind: 'home' };
    if (stepIndex + 1 < lesson.steps.length) {
      return {
        kind: 'step',
        selection: { kind: 'lesson', lessonId: lesson.id, stepIndex: stepIndex + 1 },
        step: lesson.steps[stepIndex + 1],
      };
    }
    const idx = CURRICULUM_LESSONS.findIndex((l) => l.id === lesson.id);
    const nextLesson = idx >= 0 ? CURRICULUM_LESSONS[idx + 1] : undefined;
    if (!nextLesson) return { kind: 'home' };
    return {
      kind: 'lesson',
      lesson: nextLesson,
      selection: {
        kind: 'lesson',
        lessonId: nextLesson.id,
        stepIndex: firstIncompleteStepIndex(nextLesson, profile.lessonProgress[nextLesson.id]),
      },
    };
  }, [lesson, stepIndex, profile.lessonProgress]);

  const next = useCallback(() => {
    navigate(nextTarget.kind === 'home' ? 'home' : nextTarget.selection);
  }, [navigate, nextTarget]);

  const skipStep = useCallback(() => {
    if (lesson && step) markStepSkipped(lesson.id, step.stepNumber);
    next();
  }, [lesson, step, markStepSkipped, next]);

  const selectStep = useCallback(
    (idx: number) => {
      if (!lesson) return;
      const clamped = Math.max(0, Math.min(lesson.steps.length - 1, idx));
      if (clamped === stepIndex) {
        setLoadCount((c) => c + 1);
      } else {
        navigate({ kind: 'lesson', lessonId: lesson.id, stepIndex: clamped });
      }
    },
    [lesson, stepIndex, navigate]
  );

  /** Reload the current step from scratch (e.g. when coming back to it from Home). */
  const reload = useCallback(() => setLoadCount((c) => c + 1), []);

  return {
    reload,
    lesson,
    song,
    step,
    stepIndex,
    score,
    mode,
    barFocus,
    nextTarget,
    start,
    next,
    skipStep,
    restart,
    practiseBar,
    clearLoop,
    changeMode,
    selectStep,
  };
}

export type LessonFlow = ReturnType<typeof useLessonFlow>;
