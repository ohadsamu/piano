import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Music,
  Smartphone,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { requestMusicStandWakeLock } from '../../utils/wakeLock';
import type {
  CoachDiagnosisReport,
  Hand,
  Lesson,
  NoteInputEvent,
  PracticeMode,
  PracticeSessionSnapshot,
  RemediationPlan,
  ScoreData,
  VideoLesson,
  VisualizerMode,
} from '../../types';
import type { SongLibraryEntry } from '../../data/songLibraryData';
import { TransportControlBar } from '../layout/TransportControlBar';
import { StepGuideStepper } from '../coaching/StepGuideStepper';
import { LiveCoachBanner } from '../coaching/LiveCoachBanner';
import { GrandStaffView } from '../visualizers/GrandStaffView';
import { FallingNotesCanvas } from '../visualizers/FallingNotesCanvas';
import { OverheadHandGuide } from '../visualizers/OverheadHandGuide';
import { InteractiveKeyboard } from '../visualizers/InteractiveKeyboard';
import { InteractiveVideoPlayer } from '../video/InteractiveVideoPlayer';

interface PracticeStudioViewProps {
  lessons: Lesson[];
  songs: SongLibraryEntry[];
  activeLesson: Lesson;
  activeSongId: string | null;
  activeStepIndex: number;
  completedStepNumbers: number[];
  snapshot: PracticeSessionSnapshot;
  visualizerMode: VisualizerMode;
  diagnosisReport: CoachDiagnosisReport | null;
  activeVideo: VideoLesson;
  lastNoteInput: NoteInputEvent | null;
  onSelectLesson: (lessonId: string, stepIndex?: number) => void;
  onSelectSong: (songId: string | null) => void;
  onSelectStep: (stepIndex: number) => void;
  onAdvanceNextStep: () => void;
  onChangeMode: (mode: PracticeMode) => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onStartOrResume: () => void;
  onPause: () => void;
  onRestart: () => void;
  onChangeTempoMultiplier: (mult: number) => void;
  onChangeHandFilter: (hand: Hand) => void;
  onSetLoopRange: (range: [number, number] | null) => void;
  onToggleMetronome: () => void;
  onToggleAccompaniment: () => void;
  onToggleShowNoteNames: () => void;
  onToggleShowOverheadHands: () => void;
  onVirtualNoteOn: (midi: number, velocity?: number) => void;
  onVirtualNoteOff: (midi: number) => void;
  onPlayNote: (midi: number, velocity?: number, durationSec?: number) => void;
  onPlayChord: (midis: number[], velocity?: number, durationSec?: number) => void;
  onOpenFixMeModal: () => void;
  onSimulateMistakeDemo: () => void;
  onOpenVideoDrawer: (videoId?: string) => void;
  onStartRemediationPlan: (plan: RemediationPlan) => void;
}

export const PracticeStudioView: React.FC<PracticeStudioViewProps> = ({
  lessons,
  songs,
  activeLesson,
  activeSongId,
  activeStepIndex,
  completedStepNumbers,
  snapshot,
  visualizerMode,
  diagnosisReport,
  activeVideo,
  lastNoteInput,
  onSelectLesson,
  onSelectSong,
  onSelectStep,
  onAdvanceNextStep,
  onChangeMode,
  onChangeVisualizerMode,
  onStartOrResume,
  onPause,
  onRestart,
  onChangeTempoMultiplier,
  onChangeHandFilter,
  onSetLoopRange,
  onToggleMetronome,
  onToggleAccompaniment,
  onToggleShowNoteNames,
  onToggleShowOverheadHands,
  onVirtualNoteOn,
  onVirtualNoteOff,
  onPlayNote,
  onPlayChord,
  onOpenFixMeModal,
  onSimulateMistakeDemo,
  onOpenVideoDrawer,
}) => {
  // Auto-enable Electric Piano Music Stand Mode on smartphone/tablet widths (< 960px)
  const [standMode, setStandMode] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  );

  useEffect(() => {
    void requestMusicStandWakeLock();
  }, []);

  const activeSong = useMemo(
    () => (activeSongId ? songs.find((s) => s.id === activeSongId) ?? null : null),
    [activeSongId, songs]
  );

  const activeScore: ScoreData = activeSong ? activeSong.score : activeLesson.score;
  const currentStep = activeLesson.steps[activeStepIndex] ?? activeLesson.steps[0];
  const isVideoIntroStep = !activeSong && currentStep?.type === 'video_intro';

  // Active target note objects for keyboard & overhead hands
  const activeTargetNotes = useMemo(() => {
    if (snapshot.mode === 'key_discovery') {
      const prompts = currentStep?.discoveryPrompts ?? [];
      const p = prompts[snapshot.discoveryIndex];
      if (!p) return [];
      return [
        {
          id: p.id,
          midi: p.targetMidi,
          noteName: p.targetNoteName,
          measureIndex: 0,
          beatStart: 0,
          durationBeats: 1,
          durationType: 'quarter' as const,
          hand: p.hand,
          clef: p.hand === 'left' ? ('bass' as const) : ('treble' as const),
          finger: p.finger,
        },
      ];
    }

    return activeScore.notes.filter((n) => {
      const st = snapshot.noteStatuses[n.id];
      return st === 'active_target' || st === 'hint_active';
    });
  }, [
    activeScore.notes,
    currentStep?.discoveryPrompts,
    snapshot.discoveryIndex,
    snapshot.mode,
    snapshot.noteStatuses,
  ]);

  const troubleMeasures = diagnosisReport?.troubleMeasures ?? [];

  const handleToggleLoopTroubleMeasures = () => {
    if (snapshot.loopRange) {
      onSetLoopRange(null);
    } else if (troubleMeasures.length > 0) {
      const m = troubleMeasures[0];
      onSetLoopRange([m, m]);
    } else {
      const curM = Math.max(0, Math.min(activeScore.totalMeasures - 1, snapshot.currentMeasure));
      onSetLoopRange([curM, curM]);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-4rem)] bg-[#0D0F14]">
      {standMode ? (
        /* Single-Row Distraction-Free Music Stand Bar for Smartphone + Electric Piano */
        <div className="bg-[#12151E] border-b border-[#F5F2EB]/10 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select
              aria-label="Select Lesson"
              value={activeSongId ? '' : activeLesson.id}
              onChange={(e) => {
                if (e.target.value) onSelectLesson(e.target.value, 2);
              }}
              className="bg-[#161922] px-2.5 py-1 rounded-lg border border-[#F5F2EB]/15 text-xs font-semibold text-[#F5F2EB]"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#161922]">
                  Unit 0{l.unitNumber}: {l.title}
                </option>
              ))}
            </select>

            {/* Step Pills 1..5 */}
            <div className="flex items-center gap-1 bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10">
              {activeLesson.steps.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  className={`px-2 py-0.5 rounded text-[11px] font-tabular font-semibold ${
                    idx === activeStepIndex
                      ? 'bg-[#E5A93C] text-[#0D0F14]'
                      : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                  }`}
                  title={st.title}
                >
                  S{st.stepNumber}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mode Quick Switch */}
            {(
              [
                { id: 'wait_mode', label: 'Wait Mode' },
                { id: 'slow_practice', label: 'Slow 70%' },
                { id: 'performance', label: 'Perform' },
                { id: 'auto_demo', label: 'Listen' },
              ] as Array<{ id: PracticeMode; label: string }>
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeMode(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  snapshot.mode === m.id
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                    : 'bg-[#161922] text-[#B8B2A6]'
                }`}
              >
                {m.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onOpenFixMeModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40"
            >
              <Wrench className="w-3 h-3" />
              <span>Fix Play</span>
            </button>

            <button
              type="button"
              onClick={() => setStandMode(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
              title="Switch to Full Desktop Studio Controls"
            >
              <Smartphone className="w-3 h-3" />
              <span>Stand Mode: ON</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Studio Bar: Lesson / Repertoire Picker + 5-Step Guided Stepper */}
          <div className="bg-[#12151E] border-b border-[#F5F2EB]/10 px-4 py-2.5">
            <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              {/* Left: Lesson & Song Selector */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 bg-[#161922] px-3 py-1.5 rounded-xl border border-[#F5F2EB]/10">
                  <BookOpen className="w-4 h-4 text-[#E5A93C]" />
                  <label htmlFor="studio-lesson-select" className="sr-only">
                    Select Lesson
                  </label>
                  <select
                    id="studio-lesson-select"
                    value={activeSongId ? '' : activeLesson.id}
                    onChange={(e) => {
                      if (e.target.value) {
                        onSelectLesson(e.target.value, 0);
                      }
                    }}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-[#F5F2EB] focus:outline-none cursor-pointer"
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#161922] text-[#F5F2EB]">
                        Unit 0{l.unitNumber}: {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Song Library Free-Roam Picker */}
                <div className="flex items-center gap-2 bg-[#161922] px-3 py-1.5 rounded-xl border border-[#F5F2EB]/10">
                  <Music className="w-4 h-4 text-[#38BDF8]" />
                  <label htmlFor="studio-song-select" className="sr-only">
                    Or Pick a Repertoire Song
                  </label>
                  <select
                    id="studio-song-select"
                    value={activeSongId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onSelectSong(val ? val : null);
                    }}
                    className="bg-transparent text-xs font-medium text-[#B8B2A6] hover:text-[#F5F2EB] focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#161922] text-[#B8B2A6]">
                      Song Library ({songs.length} Repertoire Pieces)...
                    </option>
                    {songs.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#161922] text-[#F5F2EB]">
                        🎵 {s.title} — {s.artist} ({s.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Electric Piano Music Stand Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setStandMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-[#161922] border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#10B981] hover:border-[#10B981]/40 transition-colors"
                  title="Electric Piano Stand Mode: Collapses the touch UI keyboard into a slim landmark & mistake indicator strip so Sheet Music is huge on your music stand"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Piano Stand Mode</span>
                </button>

                {/* Quick "Analyze & Fix My Play" Demo Trigger */}
                <button
                  type="button"
                  onClick={onSimulateMistakeDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E2230] hover:bg-[#282D3E] text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/35 transition-colors"
                  title="Run an instant diagnostic demo showing how the Coach detects neighbor slips, octave shifts, and rhythm rushing and builds a 3-step Fix Drill"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Demo &ldquo;Fix My Play&rdquo; Coach</span>
                </button>
              </div>

              {/* Right: 5-Step Lesson Stepper */}
              {!activeSong && (
                <div className="flex-1 max-w-4xl">
                  <StepGuideStepper
                    steps={activeLesson.steps}
                    activeStepIndex={activeStepIndex}
                    completedStepIndices={completedStepNumbers.map((n) => n - 1)}
                    onSelectStep={(idx) => onSelectStep(idx)}
                    onNextStep={onAdvanceNextStep}
                    onWatchVideo={(vidId) => onOpenVideoDrawer(vidId ?? activeLesson.primaryVideoId)}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Transport & Practice Mode Controls */}
          <TransportControlBar
            mode={snapshot.mode}
            onChangeMode={onChangeMode}
            visualizerMode={visualizerMode}
            onChangeVisualizerMode={onChangeVisualizerMode}
            isPlaying={snapshot.isPlaying}
            isPaused={snapshot.isPaused}
            onStartOrResume={onStartOrResume}
            onPause={onPause}
            onRestart={onRestart}
            currentMeasure={snapshot.currentMeasure}
            totalMeasures={activeScore.totalMeasures}
            beatsPerMeasure={activeScore.timeSignature[0]}
            currentBeat={snapshot.currentBeat}
            effectiveBpm={snapshot.effectiveBpm}
            baseBpm={activeScore.bpm}
            tempoMultiplier={snapshot.tempoMultiplier}
            onChangeTempoMultiplier={onChangeTempoMultiplier}
            handFilter={snapshot.handFilter}
            onChangeHandFilter={onChangeHandFilter}
            loopRange={snapshot.loopRange}
            onToggleLoopTroubleMeasures={handleToggleLoopTroubleMeasures}
            metronomeEnabled={snapshot.metronomeEnabled}
            onToggleMetronome={onToggleMetronome}
            accompanimentEnabled={snapshot.accompanimentEnabled}
            onToggleAccompaniment={onToggleAccompaniment}
            showNoteNames={snapshot.showNoteNames}
            onToggleShowNoteNames={onToggleShowNoteNames}
            showOverheadHands={snapshot.showOverheadHands}
            onToggleShowOverheadHands={onToggleShowOverheadHands}
            onOpenFixMeCoach={onOpenFixMeModal}
            onOpenVideoCoach={() => onOpenVideoDrawer(activeLesson.primaryVideoId)}
            troubleMeasuresCount={troubleMeasures.length}
          />
        </>
      )}
      {/* Main Interactive Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-2 flex flex-col justify-between gap-2">
        {/* Step 1 Video Intro Banner OR Active Visualizers (Grand Staff + Falling Notes) */}
        {isVideoIntroStep ? (
          <div className="space-y-3">
            <div className="bg-[#161922] border border-[#E5A93C]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#E5A93C] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Step 1 of 5: {currentStep.title}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F2EB] mt-0.5">
                  {currentStep.instruction}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectStep(2)}
                  className="px-3.5 py-2 rounded-xl bg-[#1E2230] hover:bg-[#282D3E] text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/30"
                >
                  Skip to Step 3: Wait Mode
                </button>
                <button
                  type="button"
                  onClick={onAdvanceNextStep}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E5A93C] hover:bg-[#F3C66F] text-xs font-semibold text-[#0D0F14] shadow-md"
                >
                  <span>Continue to Step 2: Find the Keys</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <InteractiveVideoPlayer
              video={activeVideo}
              currentlyHeldMidis={snapshot.currentlyHeldMidis}
              onPlayNote={onPlayNote}
              onPlayChord={onPlayChord}
              lastNoteInput={lastNoteInput}
              onNoteOn={onVirtualNoteOn}
              onNoteOff={onVirtualNoteOff}
              onCompleteCheckpoint={onAdvanceNextStep}
            />
          </div>
        ) : (
          <>
            {/* Live Corrective Coach Banner ("Identify My Play & Fix Me" + Step Prompts) */}
            <LiveCoachBanner
              snapshot={snapshot}
              activeNotes={activeTargetNotes}
              discoveryPrompts={currentStep?.discoveryPrompts ?? []}
              remediationPlan={diagnosisReport?.remediationPlan ?? null}
              onOpenFixMe={onOpenFixMeModal}
              onOpenVideo={(vidId) =>
                onOpenVideoDrawer(vidId ?? activeLesson.primaryVideoId)
              }
              troubleCount={troubleMeasures.length}
            />

            {/* Visualizers Stack: Grand Staff Sheet Music & Falling Notes Cascade + Flush Keybed */}
            <div className="flex flex-col">
              {(visualizerMode === 'both' || visualizerMode === 'sheet') && (
                <GrandStaffView
                  score={activeScore}
                  currentBeat={snapshot.currentBeat}
                  noteStatuses={snapshot.noteStatuses}
                  activeTargetMidis={snapshot.activeTargetMidis}
                  hintedMidis={snapshot.hintedMidis}
                  handFilter={snapshot.handFilter}
                  loopRange={snapshot.loopRange}
                  troubleMeasures={troubleMeasures}
                  showNoteNames={snapshot.showNoteNames}
                  showFingerNumbers={snapshot.showFingerNumbers}
                  className="rounded-t-2xl border border-[#F5F2EB]/10"
                  onSelectMeasure={(m) => {
                    if (
                      snapshot.loopRange &&
                      snapshot.loopRange[0] === m &&
                      snapshot.loopRange[1] === m
                    ) {
                      onSetLoopRange(null);
                    } else {
                      onSetLoopRange([m, m]);
                    }
                  }}
                  onFixMeasure={(m) => {
                    onSetLoopRange([m, m]);
                    onChangeMode('wait_mode');
                  }}
                />
              )}

              {(visualizerMode === 'both' || visualizerMode === 'falling') &&
                (!standMode || visualizerMode === 'falling') && (
                  <div
                    className={`relative ${
                      visualizerMode === 'falling' ? 'h-[260px]' : 'h-[112px]'
                    }`}
                  >
                    <FallingNotesCanvas
                      score={activeScore}
                      currentBeat={snapshot.currentBeat}
                      noteStatuses={snapshot.noteStatuses}
                      currentlyHeldMidis={snapshot.currentlyHeldMidis}
                      activeTargetMidis={snapshot.activeTargetMidis}
                      hintedMidis={snapshot.hintedMidis}
                      wrongPlayedMidis={snapshot.wrongPlayedMidis}
                      handFilter={snapshot.handFilter}
                      loopRange={snapshot.loopRange}
                      showNoteNames={snapshot.showNoteNames}
                      showFingerNumbers={snapshot.showFingerNumbers}
                      className={`w-full h-full border border-b-0 border-[#F5F2EB]/10 ${
                        visualizerMode === 'falling' ? 'rounded-t-2xl' : 'border-t-0'
                      }`}
                    />
                  </div>
                )}

              {/* Interactive 3-Octave Concert Grand Piano Keybed (or Slim Stand Reference Strip) */}
              <div className="relative rounded-b-2xl border border-[#F5F2EB]/15 shadow-2xl bg-[#090B0F]">
                {standMode && (
                  <div className="px-3 py-1 bg-[#12151E] border-b border-[#F5F2EB]/10 flex items-center justify-between text-[11px]">
                    <span className="text-[#10B981] font-semibold">
                      🎹 Electric Piano Stand Strip • Play on your physical keys (C4 Crown = Middle C • Amber = Hint • Coral = Wrong Key)
                    </span>
                    <button
                      type="button"
                      onClick={() => setStandMode(false)}
                      className="text-[#38BDF8] hover:underline font-semibold"
                    >
                      Expand Full Keys
                    </button>
                  </div>
                )}

                {snapshot.showOverheadHands && !standMode && (
                  <div className="pointer-events-none absolute -top-20 left-0 right-0 z-20 opacity-90">
                    <OverheadHandGuide
                      score={activeScore}
                      currentBeat={snapshot.currentBeat}
                      activeNotes={activeTargetNotes}
                      hintedMidis={snapshot.hintedMidis}
                      handFilter={snapshot.handFilter}
                      visible={snapshot.showOverheadHands}
                      className="!bg-transparent !border-0"
                    />
                  </div>
                )}

                <InteractiveKeyboard
                  standMode={standMode}
                  currentlyHeldMidis={snapshot.currentlyHeldMidis}
                  activeTargetMidis={snapshot.activeTargetMidis}
                  activeTargetNotes={activeTargetNotes}
                  hintedMidis={snapshot.hintedMidis}
                  wrongPlayedMidis={snapshot.wrongPlayedMidis}
                  liveCorrection={snapshot.liveCorrection}
                  showNoteNames={snapshot.showNoteNames}
                  showFingerNumbers={snapshot.showFingerNumbers}
                  showQwertyLabels={!standMode}
                  onNoteOn={onVirtualNoteOn}
                  onNoteOff={onVirtualNoteOff}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
