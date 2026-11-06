import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CoachDiagnosisReport, Hand, PracticeSessionSnapshot } from '../types';
import type { PracticeEngine } from '../engines/PracticeEngine';
import { sharedAudioEngine } from '../engines/AudioEngine';
import type { PracticeHandlers, SettingsHandlers } from '../components/practice/types';
import { isTimedMode, type LessonFlow } from './useLessonFlow';
import type { NoteInputsApi } from './useNoteInputs';
import type { ProfileApi } from './useProfile';

export type SheetName = 'settings' | 'tips' | 'input' | 'intro' | null;

/** Stage mode of the running remediation drill, if any. */
export function remediationStageMode(flow: LessonFlow, snap: PracticeSessionSnapshot) {
  if (snap.mode !== 'remediation_drill' || flow.barFocus?.kind !== 'plan') return undefined;
  return flow.barFocus.plan.stages[snap.remediationStageIndex]?.mode;
}

export function isSnapshotTimed(flow: LessonFlow, snap: PracticeSessionSnapshot): boolean {
  return isTimedMode(snap.mode, remediationStageMode(flow, snap));
}

/** Spec §4.3 rule 3, including remediation stages that run untimed. */
export function shouldAutoStartFor(flow: LessonFlow | null, snap: PracticeSessionSnapshot): boolean {
  if (snap.isCompleted) return false;
  if (snap.isPlaying && !snap.isPaused) return false;
  if (snap.mode === 'key_discovery' || snap.mode === 'wait_mode') return true;
  return !!flow && snap.mode === 'remediation_drill' && remediationStageMode(flow, snap) === 'wait_mode';
}

interface ControllerArgs {
  engine: PracticeEngine;
  snapshot: PracticeSessionSnapshot;
  flow: LessonFlow;
  inputs: NoteInputsApi;
  profileApi: ProfileApi;
  report: CoachDiagnosisReport | null;
  openSheet(name: SheetName): void;
  goHome(): void;
}

/** Turns the engine + flow into the plain handlers PracticeScreen receives. */
export function usePracticeController({
  engine,
  snapshot,
  flow,
  inputs,
  profileApi,
  report,
  openSheet,
  goHome,
}: ControllerArgs) {
  const [showMeUntil, setShowMeUntil] = useState(0);
  const [focusNonce, setFocusNonce] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);

  // Timed steps get a one-bar count-in: otherwise the first note is due the instant Start is
  // tapped, and nobody can move a hand from the button to the key that fast.
  const [countIn, setCountIn] = useState<number | null>(null);
  const countTimerRef = useRef<number | undefined>(undefined);
  const cancelCountIn = useCallback(() => {
    if (countTimerRef.current !== undefined) window.clearInterval(countTimerRef.current);
    countTimerRef.current = undefined;
    setCountIn(null);
  }, []);
  const flowStart = flow.start;
  const beatsPerBar = flow.score.timeSignature[0] || 4;
  const startWithCountIn = useCallback(() => {
    const snap = engine.getSnapshot();
    if (countTimerRef.current !== undefined) return;
    if (!isSnapshotTimed(flow, snap) || snap.mode === 'auto_demo' || snap.isCompleted) {
      flowStart();
      return;
    }
    void sharedAudioEngine.init();
    const beats = Math.max(2, Math.min(4, beatsPerBar));
    const beatMs = 60000 / Math.max(20, snap.effectiveBpm || 60);
    let left = beats;
    setCountIn(left);
    sharedAudioEngine.playMetronomeClick(true);
    countTimerRef.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        cancelCountIn();
        flowStart();
        return;
      }
      setCountIn(left);
      sharedAudioEngine.playMetronomeClick(false);
    }, beatMs);
  }, [engine, flow, flowStart, beatsPerBar, cancelCountIn]);

  // A step change, mode change or unmount drops a pending count-in.
  useEffect(() => cancelCountIn, [flow.step, flow.song, snapshot.mode, cancelCountIn]);

  const showMe = useCallback(() => {
    const midis = engine.getSnapshot().activeTargetMidis;
    void sharedAudioEngine.init().then(() => {
      midis.forEach((m) => sharedAudioEngine.playNote(m, 0.8, 0.8));
    });
    setShowMeUntil(Date.now() + 1200);
    setFocusNonce((n) => n + 1);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setShowMeUntil(0), 1250);
  }, [engine]);

  const skipNote = useCallback(() => {
    const midis = engine.getSnapshot().activeTargetMidis;
    midis.forEach((m) => inputs.pressKey(m));
    window.setTimeout(() => midis.forEach((m) => inputs.releaseKey(m)), 120);
  }, [engine, inputs]);

  const handlers: PracticeHandlers = useMemo(
    () => ({
      start: startWithCountIn,
      pause: () => {
        cancelCountIn();
        engine.pause();
      },
      resume: startWithCountIn,
      restart: () => {
        cancelCountIn();
        flow.restart();
      },
      showMe,
      skipNote,
      slower: () => engine.setTempoMultiplier(Math.max(0.4, engine.getSnapshot().tempoMultiplier - 0.15)),
      next: () => {
        if (flow.lesson && flow.step?.type === 'video_intro') {
          profileApi.markStepDone(flow.lesson.id, flow.step.stepNumber);
        }
        flow.next();
      },
      skipStep: flow.skipStep,
      practiseBar: (m: number) => flow.practiseBar(m, report),
      clearLoop: flow.clearLoop,
      selectStep: flow.selectStep,
      changeMode: flow.changeMode,
      keyDown: inputs.pressKey,
      keyUp: inputs.releaseKey,
      openSettings: () => openSheet('settings'),
      openTips: () => openSheet('tips'),
      openInput: () => openSheet('input'),
      openIntroVideo: () => openSheet('intro'),
      goHome: () => {
        cancelCountIn();
        goHome();
      },
    }),
    [engine, flow, showMe, skipNote, profileApi, report, inputs, openSheet, goHome, startWithCountIn, cancelCountIn]
  );

  const settings: SettingsHandlers = useMemo(
    () => ({
      setHand: (h: Hand) => {
        // After completion the engine would restart (and run) the pass on a filter change;
        // reset to "ready" first so a timed step doesn't take off by itself.
        if (engine.getSnapshot().isCompleted) flow.restart();
        engine.setHandFilter(h);
      },
      setSpeed: (m: number) => engine.setTempoMultiplier(m),
      toggleMetronome: () => engine.setMetronomeEnabled(!engine.getSnapshot().metronomeEnabled),
      toggleBacking: () => engine.setAccompanimentEnabled(!engine.getSnapshot().accompanimentEnabled),
      toggleNoteNames: () => engine.setShowNoteNames(!engine.getSnapshot().showNoteNames),
      toggleFalling: () => profileApi.setShowFalling(!profileApi.profile.showFalling),
      toggleHandGuide: () => engine.setShowOverheadHands(!engine.getSnapshot().showOverheadHands),
      skipStep: flow.skipStep,
    }),
    [engine, profileApi, flow]
  );

  return {
    handlers,
    settings,
    showMeActive: showMeUntil > 0,
    countIn,
    cancelCountIn,
    focusNonce,
    timed: isSnapshotTimed(flow, snapshot),
  };
}
