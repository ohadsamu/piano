import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Compass,
  Mic,
  PlayCircle,
  Wrench,
} from 'lucide-react';
import type {
  KeyDiscoveryPrompt,
  LiveCorrectionFeedback,
  LiveMicTelemetry,
  NoteInputEvent,
  PracticeMode,
  PracticeSessionSnapshot,
  RemediationPlan,
  ScoreNoteEvent,
} from '../../types';
import { getFingerLabel, getHandLabel } from '../../utils/midiUtils';

export interface LiveCoachBannerProps {
  mode?: PracticeMode;
  liveCorrection?: LiveCorrectionFeedback | null;
  activeNotes?: ScoreNoteEvent[];
  discoveryPrompts?: KeyDiscoveryPrompt[];
  discoveryIndex?: number;
  discoveryCompletedCount?: number;
  streak?: number;
  remediationPlan?: RemediationPlan | null;
  remediationStageIndex?: number;
  remediationCleanPasses?: number;
  snapshot?: PracticeSessionSnapshot;
  activePrompt?: KeyDiscoveryPrompt | null;
  onOpenFixMe?: () => void;
  onOpenFixMeModal?: () => void;
  onOpenVideo?: (videoId?: string) => void;
  onWatchVideo?: (videoId?: string) => void;
  recommendedVideoId?: string;
  lessonStepTitle?: string;
  micActive?: boolean;
  micTelemetry?: LiveMicTelemetry;
  lastNoteInput?: NoteInputEvent | null;
  midiConnected?: boolean;
  onToggleMic?: () => void;
  troubleCount?: number;
  className?: string;
}

export const LiveCoachBanner: React.FC<LiveCoachBannerProps> = ({
  mode: propMode,
  liveCorrection: propCorrection,
  activeNotes = [],
  discoveryPrompts = [],
  discoveryIndex: propDiscoveryIdx,
  discoveryCompletedCount: propDiscoveryDone,
  streak: propStreak,
  remediationPlan = null,
  remediationStageIndex: propRemediationIdx,
  remediationCleanPasses: propRemediationPasses,
  snapshot,
  activePrompt: propActivePrompt,
  onOpenFixMe,
  onOpenFixMeModal,
  onOpenVideo,
  onWatchVideo,
  recommendedVideoId,
  micActive,
  micTelemetry,
  lastNoteInput,
  midiConnected,
  onToggleMic,
  troubleCount = 0,
  className = '',
}) => {
  const mode = propMode ?? snapshot?.mode ?? 'wait_mode';
  const liveCorrection = propCorrection ?? snapshot?.liveCorrection ?? null;
  const discoveryIndex = propDiscoveryIdx ?? snapshot?.discoveryIndex ?? 0;
  const discoveryCompletedCount =
    propDiscoveryDone ?? snapshot?.discoveryCompletedCount ?? 0;
  const streak = propStreak ?? snapshot?.streak ?? 0;
  const remediationStageIndex =
    propRemediationIdx ?? snapshot?.remediationStageIndex ?? 0;
  const remediationCleanPasses =
    propRemediationPasses ?? snapshot?.remediationCleanPasses ?? 0;
  const handleFixMe = onOpenFixMe ?? onOpenFixMeModal;
  const handleWatchVideo = onOpenVideo ?? onWatchVideo;
  const showMicCta = !micActive && !midiConnected && Boolean(onToggleMic);
  // 1. High-Priority State: Live Directional Correction (User Struck a Wrong Key)
  if (liveCorrection && liveCorrection.direction !== 'exact') {
    const isMoveLeft = liveCorrection.direction === 'left';
    const absWhite = Math.abs(liveCorrection.whiteKeyDelta);

    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full bg-[#1C161D] border-b border-[#F59E0B]/55 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-[inset_0_0_24px_rgba(244,63,94,0.12)] ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F43F5E]/20 border border-[#F43F5E] text-[#F43F5E] shrink-0">
            <AlertCircle className="w-4 h-4" />
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
            <span className="text-[15px] sm:text-[16px] font-semibold text-[#F5F2EB] leading-snug">
              {liveCorrection.headline}
            </span>
            <span className="hidden sm:inline text-[#F59E0B] font-bold">→</span>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#F59E0B] leading-snug">
              {liveCorrection.actionInstruction}
            </span>
          </div>
        </div>

        {/* Visual Mini Key-Delta Badge + Video/Fix Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0F14] border border-white/15 font-tabular text-xs">
            {isMoveLeft ? (
              <>
                <span className="px-1.5 py-0.5 rounded bg-[#F59E0B] text-[#090B0F] font-bold">
                  {liveCorrection.expectedNote.noteName} Target (
                  {liveCorrection.expectedNote.finger})
                </span>
                <span className="inline-flex items-center text-[#F59E0B] font-bold px-1">
                  <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
                  {absWhite} key{absWhite === 1 ? '' : 's'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F43F5E]/25 border border-[#F43F5E] text-[#FDA4AF] font-semibold">
                  {liveCorrection.playedNoteName} Played
                </span>
              </>
            ) : (
              <>
                <span className="px-1.5 py-0.5 rounded bg-[#F43F5E]/25 border border-[#F43F5E] text-[#FDA4AF] font-semibold">
                  {liveCorrection.playedNoteName} Played
                </span>
                <span className="inline-flex items-center text-[#F59E0B] font-bold px-1">
                  {absWhite} key{absWhite === 1 ? '' : 's'}
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F59E0B] text-[#090B0F] font-bold">
                  {liveCorrection.expectedNote.noteName} Target (
                  {liveCorrection.expectedNote.finger})
                </span>
              </>
            )}
          </div>

          {handleWatchVideo && (
            <button
              type="button"
              onClick={() => {
                const delta = Math.abs(liveCorrection.semitoneDelta);
                const contextualVid =
                  recommendedVideoId ??
                  (delta >= 5
                    ? 'vid-02-middle-c-landmark'
                    : delta >= 3
                    ? 'vid-03-steps-vs-skips'
                    : 'vid-01-posture-arch');
                handleWatchVideo(contextualVid);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1E2230] hover:bg-[#282D40] border border-[#E5A93C]/45 text-[#E5A93C] text-xs font-semibold transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Watch Hand Fix</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Key Discovery Mode Prompt & Landmark Hint
  if (mode === 'key_discovery' && (discoveryPrompts.length > 0 || propActivePrompt)) {
    const activePrompt =
      propActivePrompt ??
      discoveryPrompts[Math.min(discoveryIndex, discoveryPrompts.length - 1)];

    return (
      <div
        role="status"
        className={`w-full bg-[#141A26] border-b border-[#38BDF8]/35 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8] text-[#38BDF8] shrink-0">
            <Compass className="w-4 h-4" />
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className="font-tabular text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8]">
              Landmark Check {Math.min(discoveryCompletedCount + 1, Math.max(1, discoveryPrompts.length))} /{' '}
              {Math.max(1, discoveryPrompts.length)}
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-[#F5F2EB]">
              {activePrompt.instruction}
            </span>
            <span className="text-xs text-[#B8B2A6] italic">
              • {activePrompt.landmarkHint}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {showMicCta && (
            <button
              type="button"
              onClick={onToggleMic}
              className="bg-[#10B981] hover:bg-[#34D399] text-[#090B0F] font-semibold text-xs px-3 py-1.5 rounded-xl shadow-[0_0_14px_rgba(16,185,129,0.35)] transition-all whitespace-nowrap"
            >
              🎹 Enable Mic for Real Piano
            </button>
          )}
          <span className="px-2.5 py-1 rounded bg-[#0D0F14] border border-white/10 font-tabular text-xs font-semibold text-[#E5A93C]">
            Target: {activePrompt.targetNoteName} ({getHandLabel(activePrompt.hand)}{' '}
            {getFingerLabel(activePrompt.finger)})
          </span>
        </div>
      </div>
    );
  }

  // 3. Guided 3-Stage Remediation Drill Mode
  if (mode === 'remediation_drill' && remediationPlan) {
    const currentStage =
      remediationPlan.stages[
        Math.min(remediationStageIndex, remediationPlan.stages.length - 1)
      ];

    return (
      <div
        role="status"
        className={`w-full bg-[#191A24] border-b border-[#E5A93C]/50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C] text-[#E5A93C] shrink-0">
            <Wrench className="w-3.5 h-3.5" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#E5A93C] text-[#090B0F] font-tabular text-xs font-bold">
              FIX DRILL · STAGE {currentStage?.stageNumber ?? 1} OF{' '}
              {remediationPlan.stages.length}
            </span>
            <span className="text-sm font-semibold text-[#F5F2EB]">
              {currentStage?.title}
            </span>
            <span className="text-xs text-[#B8B2A6]">
              — {currentStage?.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded bg-[#10B981]/15 border border-[#10B981]/40 font-tabular text-xs font-bold text-[#34D399]">
            Clean Reps: {remediationCleanPasses} /{' '}
            {currentStage?.targetCleanReps ?? 2}
          </span>
        </div>
      </div>
    );
  }

  // 4. Unified Calm Coaching Strip (Merges E-Piano Listener Status + Target Note + Coach Trigger)
  const primaryNote = activeNotes[0];
  const isListening = Boolean(micActive || midiConnected);
  const heardLabel =
    micTelemetry?.detectedNoteName || lastNoteInput?.noteName || null;

  return (
    <div
      role="status"
      className={`w-full rounded-t-2xl border border-b-0 px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 transition-colors ${
        isListening
          ? 'bg-[#11181B] border-[#10B981]/35'
          : 'bg-[#141824] border-[#F5F2EB]/10'
      } ${className}`}
    >
      {/* Left + Center: Listening Readiness & Target Note to Play on E-Piano */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        {isListening ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-xs font-semibold text-[#10B981] shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            <span>{midiConnected ? 'MIDI' : 'Listening'}</span>
            {heardLabel && (
              <span className="font-tabular text-[#F5F2EB] font-bold">
                · Heard {heardLabel}
              </span>
            )}
          </span>
        ) : (
          <span className="text-xs sm:text-sm font-medium text-[#B8B2A6]">
            🎹 Play on your physical E-Piano:
          </span>
        )}

        {primaryNote ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="text-[#B8B2A6]">Target:</span>
            {activeNotes.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-tabular text-xs sm:text-sm font-bold border"
                style={{
                  backgroundColor:
                    n.hand === 'left'
                      ? 'rgba(129, 140, 248, 0.16)'
                      : 'rgba(56, 189, 248, 0.16)',
                  borderColor: n.hand === 'left' ? '#818CF8' : '#38BDF8',
                  color: '#F5F2EB',
                }}
              >
                <span>{n.noteName}</span>
                <span className="opacity-85 font-medium">
                  · {n.hand === 'left' ? 'Left Hand' : 'Right Hand'} {getFingerLabel(n.finger)}
                </span>
              </span>
            ))}
            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#34D399] font-tabular text-xs font-semibold">
                ✓ {streak} in a row
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs sm:text-sm text-[#B8B2A6]">
            Press Play or strike the highlighted note on your E-Piano.
          </span>
        )}
      </div>

      {/* Right: Single Primary Action (Start Listening when off, or quiet Fix Play when needed) */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {showMicCta && (
          <button
            type="button"
            onClick={onToggleMic}
            className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#090B0F] font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Start Listening</span>
          </button>
        )}

        {handleFixMe && troubleCount > 0 && (
          <button
            type="button"
            onClick={handleFixMe}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 border border-[#F59E0B]/40 text-[#F59E0B] text-xs font-semibold transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Fix Play ({troubleCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveCoachBanner;
