import { useCallback, useState, type MutableRefObject } from 'react';
import type { CoachDiagnosisReport, NoteAttemptRecord, PracticeSessionSnapshot } from '../types';
import { CoachDiagnosisEngine } from '../engines/CoachDiagnosisEngine';
import type { PracticeResults } from '../components/practice/PracticeScreen';
import { COPY, nextLessonLabel, nextStepLabel } from '../components/copy';
import { stepLabel } from '../utils/progress';
import type { LessonFlow } from './useLessonFlow';
import type { ProfileApi } from './useProfile';

const coachEngine = new CoachDiagnosisEngine();

type Completion = { key: string; results: Omit<PracticeResults, 'nextLabel'> & { marked: boolean } };

/**
 * Turns engine completion into truthful progress (spec §4.3 rule 7): a step is marked done
 * only when the engine completed it and, for timed steps, something was actually played.
 */
export function useStepCompletion(
  profileApi: ProfileApi,
  flowRef: MutableRefObject<LessonFlow | null>,
  currentKey: string,
  setReport: (r: CoachDiagnosisReport) => void
) {
  const [completion, setCompletion] = useState<Completion | null>(null);

  const onComplete = useCallback(
    (attempts: NoteAttemptRecord[], snap: PracticeSessionSnapshot) => {
      const flow = flowRef.current;
      if (!flow) return;
      const key = currentKey;
      const played = attempts.some((a) => a.status !== 'missed');
      const barNumber = flow.barFocus?.measureIndex ?? null;
      if (snap.mode === 'auto_demo') {
        return setCompletion({ key, results: { kind: 'demo', played: true, report: null, barNumber, marked: false } });
      }
      if (snap.mode === 'key_discovery') {
        if (flow.lesson && flow.step) profileApi.markStepDone(flow.lesson.id, flow.step.stepNumber);
        return setCompletion({ key, results: { kind: 'step', played: true, report: null, barNumber, marked: true } });
      }
      // Diagnose only after a completed pass with something played.
      const r = played ? coachEngine.analyzeSession(flow.score, attempts, snap.mode) : null;
      if (r) setReport(r);
      const kind = flow.barFocus ? 'bar' : flow.song ? 'song' : 'step';
      const marked = kind === 'step' && played && !!flow.lesson && !!flow.step;
      if (marked) profileApi.markStepDone(flow.lesson!.id, flow.step!.stepNumber, r);
      setCompletion({ key, results: { kind, played, report: r, barNumber, marked } });
    },
    [profileApi, flowRef, currentKey, setReport]
  );

  const resultsFor = (flow: LessonFlow): { results: PracticeResults; nextLabel: string } => {
    const nt = flow.nextTarget;
    const nextLabel =
      nt.kind === 'step'
        ? nextStepLabel(stepLabel(nt.step), nt.step.stepNumber)
        : nt.kind === 'lesson'
        ? nextLessonLabel(nt.lesson.title)
        : COPY.backToHome;
    const done = completion?.key === currentKey ? completion.results : null;
    return {
      nextLabel,
      results: {
        kind: done?.kind ?? (flow.song ? 'song' : 'step'),
        played: done?.played ?? true,
        report: done?.report ?? null,
        barNumber: done?.barNumber ?? null,
        nextLabel: done?.marked ? nextLabel : null,
      },
    };
  };

  return { onComplete, resultsFor };
}
