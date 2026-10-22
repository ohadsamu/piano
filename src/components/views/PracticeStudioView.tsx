import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Sliders,
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
  LiveMicTelemetry,
  NoteInputEvent,
  PracticeMode,
  PracticeSessionSnapshot,
  RemediationPlan,
  ScoreData,
  VideoLesson,
  VisualizerMode,
} from '../../types';
import type { SongLibraryEntry } from '../../data/songLibraryData';
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
  micTelemetry?: LiveMicTelemetry;
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
  micTelemetry,
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
  // E-Piano Studio Defaults: On-screen piano hidden by default, Studio Options popover closed
  const [hideUiKeyboard, setHideUiKeyboard] = useState<boolean>(true);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
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

  const stepShortLabels: Record<number, string> = {
    1: '1. Video',
    2: '2. Keys',
    3: '3. Wait',
    4: '4. Flow',
    5: '5. Perform',
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-[#0D0F14]">
      {/* ONE Unified, Minimalist Studio Control Bar */}
      <div className="bg-[#12151E] border-b border-[#F5F2EB]/10 px-3 sm:px-6 py-2">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Piece / Lesson Picker + Step Pills (or Song Mode Pills) */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <select
              aria-label="Select Lesson or Song"
              value={activeSongId ? `song:${activeSongId}` : `lesson:${activeLesson.id}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('song:')) {
                  onSelectSong(val.slice(5));
                } else if (val.startsWith('lesson:')) {
                  onSelectLesson(val.slice(7), 2);
                }
              }}
              className="bg-[#161922] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#F5F2EB]/15 text-xs sm:text-sm font-semibold text-[#F5F2EB] max-w-[165px] sm:max-w-[280px] truncate cursor-pointer focus:outline-none focus:border-[#E5A93C]"
            >
              <optgroup label="Curriculum Lessons" className="bg-[#161922] text-[#E5A93C]">
                {lessons.map((l) => (
                  <option key={l.id} value={`lesson:${l.id}`} className="bg-[#161922] text-[#F5F2EB]">
                    Unit 0{l.unitNumber}: {l.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Song Library" className="bg-[#161922] text-[#38BDF8]">
                {songs.map((s) => (
                  <option key={s.id} value={`song:${s.id}`} className="bg-[#161922] text-[#F5F2EB]">
                    🎵 {s.title} — {s.artist}
                  </option>
                ))}
              </optgroup>
            </select>

            {!activeSongId ? (
              <div className="flex items-center gap-0.5 bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10">
                {activeLesson.steps.map((st, idx) => {
                  const isDone = completedStepNumbers.includes(st.stepNumber);
                  const isActive = idx === activeStepIndex;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectStep(idx)}
                      className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#E5A93C] text-[#0D0F14] font-semibold'
                          : isDone
                          ? 'text-[#10B981] hover:text-[#F5F2EB]'
                          : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                      }`}
                      title={st.title}
                    >
                      <span className="hidden md:inline">
                        {stepShortLabels[st.stepNumber] ?? `S${st.stepNumber}`}
                      </span>
                      <span className="md:hidden">S{st.stepNumber}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-0.5 bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10">
                {(
                  [
                    { id: 'wait_mode', label: 'Wait' },
                    { id: 'slow_practice', label: 'Flow' },
                    { id: 'auto_demo', label: 'Listen' },
                  ] as Array<{ id: PracticeMode; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChangeMode(m.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      snapshot.mode === m.id
                        ? 'bg-[#E5A93C] text-[#0D0F14]'
                        : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Play/Restart + Hand Filter + Key Map Toggle + Studio Options Popover */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={snapshot.isPlaying && !snapshot.isPaused ? onPause : onStartOrResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3C66F] text-[#0D0F14] font-bold text-xs shadow-sm"
            >
              {snapshot.isPlaying && !snapshot.isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
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

            {/* Hand Filter */}
            <div className="flex items-center bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10">
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
                  className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    snapshot.handFilter === h.id
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                      : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Toggle Key Landmark Diagram */}
            <button
              type="button"
              onClick={() => setHideUiKeyboard((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !hideUiKeyboard
                  ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]'
                  : 'bg-[#161922] border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#F5F2EB]'
              }`}
              title="Show or hide the physical key landmark reference map"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Key Map</span>
            </button>

            {/* Studio Options Popover (Tempo, Metronome, Backing, Falling Notes, Diagnostic) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOptionsOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  optionsOpen
                    ? 'bg-[#1E2230] border-[#E5A93C]/50 text-[#F5F2EB]'
                    : 'bg-[#161922] border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#F5F2EB]'
                }`}
                title="Tempo, Metronome & View Options"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Options</span>
              </button>

              {optionsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#161922] border border-[#F5F2EB]/15 shadow-2xl p-4 z-40 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#F5F2EB]/10 pb-2">
                    <span className="font-semibold text-[#F5F2EB]">Studio Options</span>
                    <span className="font-tabular text-[#E5A93C]">{snapshot.effectiveBpm} BPM</span>
                  </div>

                  {/* Tempo Speed */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#B8B2A6]">Tempo Speed</span>
                    <div className="flex items-center gap-1 bg-[#0D0F14] p-0.5 rounded-lg">
                      {[0.6, 0.75, 1].map((mult) => (
                        <button
                          key={mult}
                          type="button"
                          onClick={() => onChangeTempoMultiplier(mult)}
                          className={`px-2 py-1 rounded text-[11px] font-tabular font-semibold ${
                            Math.abs(snapshot.tempoMultiplier - mult) < 0.05
                              ? 'bg-[#E5A93C] text-[#0D0F14]'
                              : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                          }`}
                        >
                          {Math.round(mult * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={onToggleMetronome}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0D0F14] hover:bg-[#1E2230] text-[#F5F2EB]"
                    >
                      <span>Metronome Click</span>
                      <span className={snapshot.metronomeEnabled ? 'text-[#10B981] font-bold' : 'text-[#7D8494]'}>
                        {snapshot.metronomeEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleAccompaniment}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0D0F14] hover:bg-[#1E2230] text-[#F5F2EB]"
                    >
                      <span>Backing Accompaniment</span>
                      <span className={snapshot.accompanimentEnabled ? 'text-[#10B981] font-bold' : 'text-[#7D8494]'}>
                        {snapshot.accompanimentEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleShowNoteNames}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0D0F14] hover:bg-[#1E2230] text-[#F5F2EB]"
                    >
                      <span>Note Names on Sheet</span>
                      <span className={snapshot.showNoteNames ? 'text-[#10B981] font-bold' : 'text-[#7D8494]'}>
                        {snapshot.showNoteNames ? 'On' : 'Off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleShowOverheadHands}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0D0F14] hover:bg-[#1E2230] text-[#F5F2EB]"
                    >
                      <span>Finger Arch Guide</span>
                      <span className={snapshot.showOverheadHands ? 'text-[#10B981] font-bold' : 'text-[#7D8494]'}>
                        {snapshot.showOverheadHands ? 'On' : 'Off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeVisualizerMode(visualizerMode === 'sheet' ? 'both' : 'sheet')
                      }
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0D0F14] hover:bg-[#1E2230] text-[#F5F2EB]"
                    >
                      <span>Falling Notes Cascade</span>
                      <span className={visualizerMode !== 'sheet' ? 'text-[#10B981] font-bold' : 'text-[#7D8494]'}>
                        {visualizerMode !== 'sheet' ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB]/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsOpen(false);
                        onOpenFixMeModal();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-semibold"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Coach Diagnostic</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleLoopTroubleMeasures}
                      className="px-3 py-1.5 rounded-lg bg-[#0D0F14] text-[#B8B2A6] hover:text-[#F5F2EB]"
                    >
                      {snapshot.loopRange ? 'Clear Loop' : 'Loop Bar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-3 flex flex-col gap-3">
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
            {/* Visualizers Stack: Unified Coaching Strip + Sheet Music + Finger Arch Guide */}
            <div className="flex flex-col">
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
                  micTelemetry={micTelemetry}
                  lastNoteInput={lastNoteInput}
                  midiConnected={midiConnected}
                  onToggleMic={onToggleMic}
                />
              )}
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
                      className="border border-[#F5F2EB]/10"
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

                  {(visualizerMode === 'both' || visualizerMode === 'falling') && (
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

              {/* Optional Key Landmark Diagram (Hidden by default since you play on your physical E-Piano) */}
              {!hideUiKeyboard && (
                <div className="relative rounded-b-2xl border border-[#F5F2EB]/15 shadow-2xl bg-[#090B0F]">
                  <div className="px-3 py-1 bg-[#12151E] border-b border-[#F5F2EB]/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#10B981] font-semibold">
                      🎹 Physical E-Piano Reference Map (C4 Crown = Middle C • Sky Blue = Target • Coral = Wrong Key)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setHideUiKeyboard(true)}
                        className="text-[#F43F5E] hover:underline font-semibold"
                      >
                        Hide Diagram
                      </button>
                    </div>
                  </div>

                  <InteractiveKeyboard
                    standMode={true}
                    currentlyHeldMidis={snapshot.currentlyHeldMidis}
                    activeTargetMidis={snapshot.activeTargetMidis}
                    activeTargetNotes={activeTargetNotes}
                    hintedMidis={snapshot.hintedMidis}
                    wrongPlayedMidis={snapshot.wrongPlayedMidis}
                    liveCorrection={snapshot.liveCorrection}
                    showNoteNames={snapshot.showNoteNames}
                    showFingerNumbers={snapshot.showFingerNumbers}
                    showQwertyLabels={false}
                    onNoteOn={onVirtualNoteOn}
                    onNoteOff={onVirtualNoteOff}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
