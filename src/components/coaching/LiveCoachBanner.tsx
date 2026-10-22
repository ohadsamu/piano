import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Compass,
  Flame,
  Music2,
  PlayCircle,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type {
  KeyDiscoveryPrompt,
  LiveCorrectionFeedback,
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
  onOpenFixMe?: () => void;
  onOpenVideo?: (videoId?: string) => void;
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
  onOpenFixMe,
  onOpenVideo,
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

          {onOpenVideo && (
            <button
              type="button"
              onClick={() => {
                const delta = Math.abs(liveCorrection.semitoneDelta);
                const contextualVid =
                  delta >= 5
                    ? 'vid-02-middle-c-landmark'
                    : delta >= 3
                    ? 'vid-03-steps-vs-skips'
                    : 'vid-01-posture-arch';
                onOpenVideo(contextualVid);
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
  if (mode === 'key_discovery' && discoveryPrompts.length > 0) {
    const activePrompt =
      discoveryPrompts[Math.min(discoveryIndex, discoveryPrompts.length - 1)];

    return (
      <div
        role="status"
        className={`w-full bg-[#141A26] border-b border-[#38BDF8]/35 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8] text-[#38BDF8] shrink-0">
            <Compass className="w-4 h-4" />
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-tabular text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8]">
              Landmark Check { Math.min(discoveryCompletedCount + 1, discoveryPrompts.length) } /{' '}
              {discoveryPrompts.length}
            </span>
            <span className="text-[15px] font-semibold text-[#F5F2EB]">
              {activePrompt.instruction}
            </span>
            <span className="text-xs text-[#B8B2A6] italic">
              • {activePrompt.landmarkHint}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
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

  // 4. Standard Flow / Wait Mode / Stage Guidance Banner
  const primaryNote = activeNotes[0];
  const chordNames = Array.from(
    new Set(activeNotes.map((n) => n.chordSymbol).filter(Boolean))
  ).join(' / ');

  return (
    <div
      role="status"
      className={`w-full bg-[#131620] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E5A93C]/15 border border-[#E5A93C]/45 text-[#E5A93C] shrink-0">
          <Music2 className="w-3.5 h-3.5" />
        </span>

        {primaryNote ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[#F5F2EB]">
              {mode === 'wait_mode' ? 'Wait Mode Target:' : 'Current Target:'}
            </span>
            {activeNotes.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-tabular text-xs font-bold border"
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
                <span className="opacity-80">
                  ({n.hand === 'left' ? 'LH' : 'RH'} {getFingerLabel(n.finger)})
                </span>
              </span>
            ))}
            {chordNames && (
              <span className="px-2 py-0.5 rounded bg-[#E5A93C]/15 text-[#E5A93C] font-tabular text-xs font-bold">
                Chord: {chordNames}
              </span>
            )}
            {primaryNote.techniqueTip && (
              <span className="text-xs text-[#B8B2A6] inline-flex items-center gap-1 ml-1">
                <Sparkles className="w-3 h-3 text-[#E5A93C]" />
                {primaryNote.techniqueTip}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-[#B8B2A6]">
            Keep your knuckles gently curved and play the illuminated target keys.
          </span>
        )}
      </div>

      {/* Right Side: Streak Counter + On-Demand "Fix Me" Diagnostic Trigger */}
      <div className="flex items-center gap-2.5">
        {streak >= 3 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] font-tabular text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-[#E5A93C]" />
            {streak} Note Streak!
          </span>
        )}

        {onOpenFixMe && (
          <button
            type="button"
            onClick={onOpenFixMe}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E2230] hover:bg-[#282D42] border border-[#E5A93C]/50 text-[#F5F2EB] text-xs font-semibold transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Identify &amp; Fix Me</span>
            {troubleCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#F43F5E] text-white font-tabular text-[10px] font-bold">
                {troubleCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveCoachBanner;
