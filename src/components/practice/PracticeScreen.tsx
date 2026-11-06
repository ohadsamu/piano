import React, { useEffect, useMemo } from 'react';
import { Settings } from 'lucide-react';
import type {
  CoachDiagnosisReport,
  LessonStep,
  PracticeSessionSnapshot,
  ScoreData,
  VideoLesson,
} from '../../types';
import { requestMusicStandWakeLock, releaseMusicStandWakeLock } from '../../utils/wakeLock';
import { stepProgress } from '../../utils/progress';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { COPY } from '../copy';
import { AppHeader } from '../shell/AppHeader';
import { Sheet } from '../shell/Sheet';
import { StepHeader } from './StepHeader';
import { StepList } from './StepList';
import { PromptCard, type InputHint } from './PromptCard';
import { StaffPanel } from './StaffPanel';
import { ResultsPanel, resultsHeadline, type ResultsKind } from './ResultsPanel';
import { IntroStep } from './IntroStep';
import { KeyboardDock } from './KeyboardDock';
import type { PracticeHandlers, TargetNote } from './types';

export interface PracticeResults {
  kind: ResultsKind;
  played: boolean;
  report: CoachDiagnosisReport | null;
  nextLabel: string | null;
  barNumber: number | null;
}

export interface PracticeScreenProps {
  title: string;
  steps?: LessonStep[];
  stepIndex: number;
  completedSteps: number[];
  step?: LessonStep | null;
  snapshot: PracticeSessionSnapshot;
  score: ScoreData;
  timed: boolean;
  results: PracticeResults;
  troubleMeasures: number[];
  introVideo: VideoLesson | null;
  introNextLabel: string;
  heldMidis: number[];
  inputHint: InputHint;
  showQwertyLabels: boolean;
  showMeActive: boolean;
  /** Beats left in the count-in before a timed step starts. */
  countIn?: number | null;
  focusNonce: number;
  showFalling: boolean;
  headerExtra?: React.ReactNode;
  on: PracticeHandlers;
}

function useTargets(snapshot: PracticeSessionSnapshot, score: ScoreData, step?: LessonStep | null) {
  return useMemo(() => {
    if (snapshot.mode === 'key_discovery') {
      const p = step?.discoveryPrompts?.[snapshot.discoveryIndex];
      const prompt = snapshot.isCompleted ? null : p ?? null;
      const targets: TargetNote[] = prompt
        ? [{ midi: prompt.targetMidi, hand: prompt.hand, finger: prompt.finger, noteName: prompt.targetNoteName }]
        : [];
      return { targets, prompt, upcoming: false };
    }
    const toTarget = (n: ScoreData['notes'][number]): TargetNote => ({
      midi: n.midi,
      hand: n.hand,
      finger: n.finger,
      noteName: n.noteName,
    });
    const active = score.notes.filter((n) => {
      const st = snapshot.noteStatuses[n.id];
      return st === 'active_target' || st === 'hint_active';
    });
    if (active.length > 0 || snapshot.isCompleted) return { targets: active.map(toTarget), prompt: null, upcoming: false };
    // Nothing active yet (count-in rests, or between notes in a timed step): show what comes next.
    const upcoming = score.notes
      .filter((n) => snapshot.noteStatuses[n.id] === 'upcoming')
      .sort((a, b) => a.beatStart - b.beatStart);
    const first = upcoming[0];
    const next = first ? upcoming.filter((n) => Math.abs(n.beatStart - first.beatStart) < 0.04) : [];
    return { targets: next.map(toTarget), prompt: null, upcoming: next.length > 0 };
  }, [snapshot.mode, snapshot.discoveryIndex, snapshot.noteStatuses, snapshot.isCompleted, score, step]);
}

function discoveryScore(t: TargetNote | undefined): ScoreData | null {
  if (!t) return null;
  return {
    id: `discovery-${t.midi}`,
    title: t.noteName ?? '',
    subtitle: '',
    bpm: 60,
    timeSignature: [4, 4],
    keySignature: 'C',
    totalMeasures: 1,
    totalBeats: 4,
    notes: [
      {
        id: `disc-${t.midi}`,
        midi: t.midi,
        noteName: t.noteName ?? '',
        measureIndex: 0,
        beatStart: 0,
        durationBeats: 4,
        durationType: 'whole',
        hand: t.hand ?? 'right',
        clef: t.hand === 'left' ? 'bass' : 'treble',
        finger: t.finger ?? 1,
      },
    ],
    accompaniment: [],
  };
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  title,
  steps,
  stepIndex,
  completedSteps,
  step,
  snapshot,
  score,
  timed,
  results,
  troubleMeasures,
  introVideo,
  introNextLabel,
  heldMidis,
  inputHint,
  showQwertyLabels,
  showMeActive,
  countIn = null,
  focusNonce,
  showFalling,
  headerExtra,
  on,
}) => {
  const short = useMediaQuery('(max-height: 560px)');
  const compactBar = useMediaQuery('(max-height: 480px)');
  const desktop = useMediaQuery('(min-width: 1024px)');
  const tablet = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    void requestMusicStandWakeLock();
    return () => void releaseMusicStandWakeLock();
  }, []);

  const isIntro = step?.type === 'video_intro';
  const isDiscovery = snapshot.mode === 'key_discovery';
  const listening = snapshot.mode === 'auto_demo';
  const { targets, prompt, upcoming } = useTargets(snapshot, score, step);
  const progress = isIntro ? null : stepProgress(snapshot, step);
  const done = snapshot.isCompleted && !isIntro;
  const phase = snapshot.isPaused ? 'paused' : snapshot.isPlaying ? 'playing' : 'ready';
  // Plain words, no "semitones": which key you hit and which way to move.
  const lc = snapshot.liveCorrection;
  const correction =
    lc && lc.direction !== 'exact' && lc.playedMidi !== lc.expectedNote?.midi
      ? `You played ${lc.playedNoteName}. Move ${lc.direction === 'right' ? 'right (higher)' : 'left (lower)'} to ${lc.expectedNote.noteName}.`
      : null;
  const loopBar = snapshot.loopRange ? snapshot.loopRange[0] : null;
  const staffScore = isDiscovery ? discoveryScore(targets[0]) : score;

  const settingsButton = (
    <button
      type="button"
      onClick={on.openSettings}
      aria-label={COPY.settings}
      className="w-11 h-11 flex items-center justify-center rounded-control text-ink-secondary hover:text-ink-primary hover:bg-ebony-iron"
    >
      <Settings className="w-5 h-5" aria-hidden="true" />
    </button>
  );

  const promptCard = (compact: boolean) => (
    <PromptCard
      phase={phase}
      timed={timed}
      listening={listening}
      targets={targets}
      upcoming={upcoming}
      discoveryPrompt={prompt}
      correction={correction}
      inputHint={inputHint}
      showMeActive={showMeActive}
      countIn={countIn}
      beat={snapshot.currentBeat}
      beatsPerMeasure={score.timeSignature[0] || 4}
      canSlowDown={snapshot.tempoMultiplier > 0.41}
      compact={compact}
      on={on}
    />
  );

  const resultsPanel = (inSheet = false) => (
    <ResultsPanel
      hideHeadline={inSheet}
      kind={results.kind}
      isDiscovery={isDiscovery}
      played={results.played}
      report={results.report}
      keysFound={progress?.total}
      nextLabel={results.nextLabel}
      barNumber={results.barNumber}
      onNext={on.next}
      onReplay={on.restart}
      onPractiseBar={on.practiseBar}
      onOpenTips={on.openTips}
      onSkipStep={on.skipStep}
      onHome={on.goHome}
      onPlayYourself={() => on.changeMode('wait_mode')}
      onBackToFull={on.clearLoop}
    />
  );

  const dock = (
    <KeyboardDock
      snapshot={snapshot}
      targets={isIntro || done ? [] : targets}
      heldMidis={heldMidis}
      showQwertyLabels={showQwertyLabels}
      focusNonce={focusNonce}
      extraHintMidis={showMeActive ? targets.map((t) => t.midi) : undefined}
      onKeyDown={on.keyDown}
      onKeyUp={on.keyUp}
    />
  );

  // Landscape phone: one 48px bar + the keyboard.
  if (compactBar) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 h-12 flex items-center gap-2 pl-1 pr-1 border-b border-ink-primary/10 bg-ebony-lacquer overflow-hidden">
          <button
            type="button"
            onClick={on.goHome}
            aria-label={COPY.home}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-control text-ink-secondary hover:bg-ebony-iron"
          >
            <span aria-hidden="true" className="text-lg-25 leading-none">‹</span>
          </button>
          <p className="hidden min-[900px]:block min-w-0 truncate font-serif text-base text-ink-primary">{title}</p>
          <div className="shrink-0 flex flex-col justify-center leading-tight text-xs-13 tabular-nums">
            {step && steps && (
              <span className="text-ink-secondary">
                Step {step.stepNumber}/{steps.length}
              </span>
            )}
            {progress && (
              <span className={progress.total > 0 && progress.done >= progress.total ? 'text-state-ok' : 'text-ink-primary'}>
                {listening ? `${COPY.listening}…` : `${progress.done} of ${progress.total} ${progress.unit}`}
              </span>
            )}
          </div>
          <div className="flex-1" />
          {isIntro ? (
            <button type="button" onClick={on.next} className="h-11 px-4 rounded-control bg-brass text-ebony-void font-semibold whitespace-nowrap">
              {introNextLabel}
            </button>
          ) : done ? null : (
            promptCard(true)
          )}
          {headerExtra}
          {settingsButton}
        </div>
        <div className="flex-1 min-h-0" />
        {dock}
        <Sheet open={done} title={resultsHeadline(results.kind, results.played, results.barNumber)} onClose={on.restart}>
          {resultsPanel(true)}
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <AppHeader
        title={title}
        onBack={on.goHome}
        right={
          <>
            {headerExtra}
            {settingsButton}
          </>
        }
      />
      <StepHeader
        steps={steps}
        stepIndex={stepIndex}
        completedSteps={completedSteps}
        progress={progress}
        listening={listening}
        songMode={steps ? null : snapshot.mode}
        onChangeMode={on.changeMode}
        loopBar={loopBar}
        onClearLoop={on.clearLoop}
        onSelectStep={on.selectStep}
        hideDots={desktop}
      />
      <div className="flex-1 min-h-0 flex mx-auto w-full max-w-[1200px]">
        {desktop && steps && (
          <StepList steps={steps} stepIndex={stepIndex} completedSteps={completedSteps} onSelectStep={on.selectStep} />
        )}
        <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain px-4 py-3 flex flex-col gap-4">
          {!short && !isIntro && staffScore && (
            <StaffPanel
              score={staffScore}
              snapshot={snapshot}
              isDiscovery={isDiscovery}
              targets={targets}
              troubleMeasures={troubleMeasures}
              showFalling={showFalling}
              scale={tablet ? 0.9 : 0.72}
              onPracticeBar={on.practiseBar}
            />
          )}
          {isIntro && step ? (
            <IntroStep step={step} video={introVideo} nextLabel={introNextLabel} onWatch={on.openIntroVideo} onNext={on.next} />
          ) : done ? (
            resultsPanel()
          ) : (
            promptCard(false)
          )}
        </main>
      </div>
      {dock}
    </div>
  );
};

export default PracticeScreen;
