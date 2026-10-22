import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Music,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Sparkles,
  Trophy,
  Volume2,
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
  micActive?: boolean;
  midiConnected?: boolean;
  onToggleMic?: () => void;
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
  onSimulateMistakeDemo?: () => void;
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
  micActive,
  midiConnected,
  onToggleMic,
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
  const activeStep = activeLesson.steps[activeStepIndex] ?? activeLesson.steps[0];
  const currentStep = activeStep;
  const isVideoIntroStep = !activeSong && currentStep?.type === 'video_intro';

  const discoveryPrompts = currentStep?.discoveryPrompts ?? [];
  const activeDiscoveryPrompt =
    snapshot.mode === 'key_discovery'
      ? discoveryPrompts[snapshot.discoveryIndex] ?? discoveryPrompts[0] ?? null
      : null;

  const discoveryScore: ScoreData | null = useMemo(() => {
    if (!activeDiscoveryPrompt) return null;
    return {
      id: `discovery-${activeDiscoveryPrompt.id}`,
      title: `Landmark Key: ${activeDiscoveryPrompt.targetNoteName}`,
      subtitle: activeDiscoveryPrompt.instruction,
      bpm: 60,
      timeSignature: [4, 4],
      keySignature: 'C',
      totalMeasures: 1,
      totalBeats: 4,
      notes: [
        {
          id: `disc-note-${activeDiscoveryPrompt.id}`,
          midi: activeDiscoveryPrompt.targetMidi,
          noteName: activeDiscoveryPrompt.targetNoteName,
          measureIndex: 0,
          beatStart: 0,
          durationBeats: 4,
          durationType: 'whole' as const,
          hand: activeDiscoveryPrompt.hand,
          clef: activeDiscoveryPrompt.hand === 'left' ? ('bass' as const) : ('treble' as const),
          finger: activeDiscoveryPrompt.finger,
        },
      ],
      accompaniment: [],
    };
  }, [activeDiscoveryPrompt]);

  // Active target note objects for keyboard & overhead hands
  const activeTargetNotes = useMemo(() => {
    if (snapshot.mode === 'key_discovery') {
      const p = activeDiscoveryPrompt;
      if (!p) return [];
      return [
        {
          id: p.id,
          midi: p.targetMidi,
          noteName: p.targetNoteName,
          measureIndex: 0,
          beatStart: 0,
          durationBeats: 4,
          durationType: 'whole' as const,
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
    activeDiscoveryPrompt,
    activeScore.notes,
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
        <div className="bg-[#12151E] border-b border-[#F5F2EB]/10 px-2.5 sm:px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            <select
              aria-label="Select Curriculum Unit or Song"
              value={activeSongId ? `song:${activeSongId}` : `lesson:${activeLesson.id}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('song:')) {
                  onSelectSong(val.slice(5));
                } else if (val.startsWith('lesson:')) {
                  onSelectLesson(val.slice(7), 2);
                }
              }}
              className="bg-[#161922] px-2 py-1 rounded-lg border border-[#E5A93C]/40 text-xs font-semibold text-[#F5F2EB] max-w-[190px] sm:max-w-[260px] truncate"
            >
              <optgroup label="Curriculum Units" className="bg-[#161922] text-[#E5A93C]">
                {lessons.map((l) => (
                  <option key={l.id} value={`lesson:${l.id}`} className="bg-[#161922] text-[#F5F2EB]">
                    Unit 0{l.unitNumber}: {l.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Repertoire Songs" className="bg-[#161922] text-[#38BDF8]">
                {songs.map((s) => (
                  <option key={s.id} value={`song:${s.id}`} className="bg-[#161922] text-[#F5F2EB]">
                    🎵 {s.title} — {s.artist}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Step Pills 1..5 when in Curriculum Unit */}
            {!activeSongId && (
              <div className="flex items-center gap-0.5 bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10">
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
            )}

            {/* Compact Play/Pause & Restart */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={snapshot.isPlaying && !snapshot.isPaused ? onPause : onStartOrResume}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E5A93C] hover:bg-[#F3C66F] text-[#0D0F14] font-bold text-[11px] shadow-sm"
                title={snapshot.isPlaying && !snapshot.isPaused ? 'Pause' : 'Play / Resume'}
              >
                {snapshot.isPlaying && !snapshot.isPaused ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="p-1.5 rounded-lg bg-[#161922] hover:bg-[#1E2230] text-[#B8B2A6] hover:text-[#F5F2EB] border border-[#F5F2EB]/10"
                title="Restart Piece"
                aria-label="Restart Piece"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compact RH / LH / Both Hand Filter Pills */}
            <div className="flex items-center gap-0.5 bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10">
              {(
                [
                  { id: 'right', label: 'RH' },
                  { id: 'left', label: 'LH' },
                  { id: 'both', label: 'Both' },
                ] as Array<{ id: Hand; label: string }>
              ).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onChangeHandFilter(h.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    snapshot.handFilter === h.id
                      ? 'bg-[#38BDF8]/25 text-[#38BDF8]'
                      : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
          <div className="bg-[#12151E] border-b border-[#F5F2EB]/10 px-3 sm:px-4 py-2">
            <div className="max-w-[1600px] mx-auto flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-2">
              {/* Left: Lesson & Song Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`flex items-center gap-2 bg-[#161922] px-3 py-1.5 rounded-xl border ${
                    !activeSongId
                      ? 'border-[#E5A93C]/50'
                      : 'border-[#F5F2EB]/10'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#E5A93C] shrink-0" />
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
                    className="bg-transparent text-xs sm:text-sm font-semibold text-[#F5F2EB] focus:outline-none cursor-pointer max-w-[220px] sm:max-w-none truncate"
                  >
                    <option value="" disabled className="bg-[#161922] text-[#7D8494]">
                      Select Curriculum Unit...
                    </option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#161922] text-[#F5F2EB]">
                        Unit 0{l.unitNumber}: {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Song Library Free-Roam Picker */}
                <div
                  className={`flex items-center gap-2 bg-[#161922] px-3 py-1.5 rounded-xl border ${
                    activeSongId
                      ? 'border-[#38BDF8]/50'
                      : 'border-[#F5F2EB]/10'
                  }`}
                >
                  <Music className="w-4 h-4 text-[#38BDF8] shrink-0" />
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
                    className="bg-transparent text-xs font-medium text-[#B8B2A6] hover:text-[#F5F2EB] focus:outline-none cursor-pointer max-w-[220px] sm:max-w-none truncate"
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
              </div>

              {/* Right: 5-Step Lesson Stepper */}
              {!activeSong && (
                <div className="w-full 2xl:flex-1 min-w-0">
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
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-2.5 sm:px-4 py-2 flex flex-col justify-between gap-2">
        {/* Rewarding Step / Piece Complete Celebration Banner */}
        {snapshot.isCompleted && (
          <div className="border-2 border-[#10B981] bg-gradient-to-r from-[#161922] via-[#1A2421] to-[#161922] rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_36px_rgba(16,185,129,0.2)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-[#E5A93C]" />
                </div>
                <h3 className="font-editorial text-lg sm:text-xl font-semibold text-[#F5F2EB]">
                  🎉 {activeSong ? activeSong.title : `Step ${activeStep.stepNumber}: ${activeStep.title}`} Complete!
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-tabular">
                <span className="px-2.5 py-1 rounded-lg bg-[#0D0F14]/80 border border-[#10B981]/30 text-[#10B981] font-semibold">
                  {snapshot.mode === 'key_discovery'
                    ? `Landmarks Found: ${discoveryPrompts.length}/${discoveryPrompts.length} (100%)`
                    : `First-Try Accuracy: ${diagnosisReport?.firstTryPct ?? 100}%`}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0D0F14]/80 border border-[#38BDF8]/30 text-[#38BDF8] font-semibold">
                  Best Streak: {snapshot.maxStreak} notes
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0D0F14]/80 border border-[#E5A93C]/30 text-[#E5A93C] font-semibold">
                  XP Earned: +{(diagnosisReport?.starsEarned || 2) * 40} XP
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161922] hover:bg-[#1E2230] text-xs font-semibold text-[#F5F2EB] border border-[#F5F2EB]/15"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
              <button
                type="button"
                onClick={onOpenFixMeModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E2230] hover:bg-[#282D3E] text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/35"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Coach Diagnostic</span>
              </button>
              <button
                type="button"
                onClick={onAdvanceNextStep}
                className="flex items-center gap-1.5 bg-[#E5A93C] hover:bg-[#F3C66F] text-[#090B0F] font-bold px-5 py-2 rounded-xl shadow-lg text-xs sm:text-sm"
              >
                <span>Continue to Next Step →</span>
              </button>
            </div>
          </div>
        )}

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
              <div className="flex flex-wrap items-center gap-2 shrink-0">
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
            {(snapshot.mode !== 'key_discovery' ||
              (snapshot.liveCorrection &&
                snapshot.liveCorrection.direction !== 'exact')) && (
              <LiveCoachBanner
                snapshot={snapshot}
                activeNotes={activeTargetNotes}
                discoveryPrompts={discoveryPrompts}
                remediationPlan={diagnosisReport?.remediationPlan ?? null}
                onOpenFixMe={onOpenFixMeModal}
                onOpenVideo={(vidId) =>
                  onOpenVideoDrawer(vidId ?? activeLesson.primaryVideoId)
                }
                troubleCount={troubleMeasures.length}
                micActive={micActive}
                midiConnected={midiConnected}
                onToggleMic={onToggleMic}
              />
            )}

            {/* Visualizers Stack: Step 2 Landmark Discovery Stage OR Grand Staff Sheet Music & Falling Notes Cascade + Flush Keybed */}
            <div className="flex flex-col">
              {snapshot.mode === 'key_discovery' && activeDiscoveryPrompt && discoveryScore ? (
                <div className="bg-[#161922] border border-[#38BDF8]/30 rounded-t-2xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Left Column: Physical Piano Landmark Orientation */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-xs font-semibold text-[#38BDF8]">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Step 2: Physical Key Discovery</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {discoveryPrompts.map((p, idx) => {
                          const isDone = idx < snapshot.discoveryIndex || snapshot.isCompleted;
                          const isCurrent = idx === snapshot.discoveryIndex && !snapshot.isCompleted;
                          return (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-tabular font-semibold border ${
                                isDone
                                  ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]'
                                  : isCurrent
                                  ? 'bg-[#E5A93C]/20 border-[#E5A93C] text-[#E5A93C]'
                                  : 'bg-[#0D0F14] border-[#F5F2EB]/10 text-[#7D8494]'
                              }`}
                            >
                              {isDone && <CheckCircle2 className="w-3 h-3" />}
                              <span>
                                Landmark {idx + 1} of {discoveryPrompts.length}: {p.targetNoteName}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <h2 className="font-editorial text-lg sm:text-2xl font-semibold text-[#F5F2EB] leading-snug">
                      {activeDiscoveryPrompt.instruction}
                    </h2>

                    <div className="bg-[#0D0F14] border border-[#38BDF8]/35 rounded-xl p-3 text-xs sm:text-sm text-[#B8B2A6]">
                      <strong className="text-[#38BDF8]">🔎 Physical Piano Landmark: </strong>
                      {activeDiscoveryPrompt.landmarkHint}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {!micActive && !midiConnected && onToggleMic && (
                        <button
                          type="button"
                          onClick={onToggleMic}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-xs font-semibold text-[#090B0F] shadow-[0_0_14px_rgba(16,185,129,0.35)] transition-all"
                        >
                          <span>🎹 Enable Mic for Real Piano</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onPlayNote(activeDiscoveryPrompt.targetMidi, 0.85, 0.8)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E2230] hover:bg-[#282D3E] text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/35 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Hear Reference Note ({activeDiscoveryPrompt.targetNoteName})</span>
                      </button>
                      <button
                        type="button"
                        onClick={onAdvanceNextStep}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E5A93C]/20 hover:bg-[#E5A93C]/30 text-xs font-semibold text-[#E5A93C] border border-[#E5A93C]/40 transition-colors"
                      >
                        <span>Skip to Step 3: Wait Mode →</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Single-Note Grand Staff Sight-Reading Link */}
                  <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#F5F2EB]/15">
                    <GrandStaffView
                      score={discoveryScore}
                      currentBeat={0}
                      activeTargetMidis={[activeDiscoveryPrompt.targetMidi]}
                      hintedMidis={snapshot.hintedMidis}
                      showNoteNames={true}
                      showFingerNumbers={true}
                    />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

              {/* Dedicated Overhead Hand & Finger Arch Guide Strip */}
              {snapshot.showOverheadHands && (
                <div className="h-24 sm:h-28 bg-[#0A0C10] border-x border-t border-[#F5F2EB]/10 relative overflow-hidden">
                  <OverheadHandGuide
                    score={discoveryScore ?? activeScore}
                    currentBeat={snapshot.mode === 'key_discovery' ? 0 : snapshot.currentBeat}
                    activeNotes={activeTargetNotes}
                    hintedMidis={snapshot.hintedMidis}
                    handFilter={snapshot.handFilter}
                    visible={snapshot.showOverheadHands}
                    className="!bg-transparent !border-0 h-full"
                  />
                </div>
              )}

              {/* Interactive 3-Octave Concert Grand Piano Keybed (or Slim Stand Reference Strip) */}
              <div className="relative rounded-b-2xl border border-[#F5F2EB]/15 shadow-2xl bg-[#090B0F]">
                {standMode && (
                  <div className="px-3 py-1 bg-[#12151E] border-b border-[#F5F2EB]/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#10B981] font-semibold">
                      🎹 Electric Piano Stand Strip • Play on your physical keys (C4 Crown = Middle C • Amber = Hint • Coral = Wrong Key)
                    </span>
                    <button
                      type="button"
                      onClick={() => setStandMode(false)}
                      className="text-[#38BDF8] hover:underline font-semibold shrink-0"
                    >
                      Expand Full Keys
                    </button>
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
