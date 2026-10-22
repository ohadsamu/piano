import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import type {
  CoachDiagnosisReport,
  DetectedIssue,
  MeasureHealthSummary,
  RemediationPlan,
  VideoLesson,
} from '../../types';

export interface FixMeModalProps {
  isOpen: boolean;
  report: CoachDiagnosisReport | null;
  videos?: VideoLesson[];
  onClose: () => void;
  onStartRemediation?: (plan: RemediationPlan) => void;
  /** Alias for onStartRemediation */
  onStartRemediationDrill?: (plan: RemediationPlan) => void;
  onWatchVideo?: (videoId: string) => void;
  onLoopMeasure?: (measureIndex: number) => void;
  onRetrySong?: () => void;
  onNextStepOrLesson?: () => void;
  nextStepLabel?: string;
  className?: string;
}

export const FixMeModal: React.FC<FixMeModalProps> = ({
  isOpen,
  report,
  videos = [],
  onClose,
  onStartRemediation,
  onStartRemediationDrill,
  onWatchVideo,
  onLoopMeasure,
  onRetrySong,
  onNextStepOrLesson,
  nextStepLabel,
  className = '',
}) => {
  if (!isOpen || !report) return null;

  const triggerRemediation = (plan: RemediationPlan) => {
    if (onStartRemediation) {
      onStartRemediation(plan);
    } else if (onStartRemediationDrill) {
      onStartRemediationDrill(plan);
    }
  };

  const rhythmBadge = (() => {
    if (report.rhythmTendency === 'rushing') {
      return {
        label: `Rushing (${Math.round(report.meanTimingErrorMs)}ms early)`,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.14)',
      };
    }
    if (report.rhythmTendency === 'dragging') {
      return {
        label: `Dragging (+${Math.round(Math.abs(report.meanTimingErrorMs))}ms late)`,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.14)',
      };
    }
    return {
      label: `On Beat (${
        report.meanTimingErrorMs >= 0 ? '+' : ''
      }${Math.round(report.meanTimingErrorMs)}ms)`,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.14)',
    };
  })();

  // Match recommendedVideoIds to rich VideoLesson objects if available
  const resolvedPrescribedVideos = report.recommendedVideos.map((vidId) => {
    const found = videos.find((v) => v.id === vidId);
    return (
      found ?? {
        id: vidId,
        title: vidId
          .replace(/^vid-\d+-/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        subtitle: 'Targeted technique coaching for this passage',
        instructor: 'Clara Vance · Conservatory Coach',
        durationLabel: '2:30',
        category: 'Posture & Landmarks' as const,
      }
    );
  });

  const renderMeasureHealthBar = (m: MeasureHealthSummary) => {
    const isTrouble =
      report.troubleMeasures.includes(m.measureIndex) || m.troubleScore >= 35;
    const isWarning = !isTrouble && (m.hintedCount > 0 || m.troubleScore >= 15);

    const barColor = isTrouble
      ? '#F43F5E'
      : isWarning
      ? '#F59E0B'
      : '#10B981';
    const statusLabel = isTrouble
      ? 'Needs Fix'
      : isWarning
      ? 'Hint Used'
      : 'Clean';

    const firstTryRatio =
      m.totalNotes > 0
        ? Math.round((m.firstTryCount / m.totalNotes) * 100)
        : 100;

    return (
      <button
        key={m.measureIndex}
        type="button"
        onClick={() => onLoopMeasure?.(m.measureIndex)}
        className="flex flex-col justify-between p-2.5 rounded-lg bg-[#161922] hover:bg-[#1E2230] border transition-all text-left group"
        style={{
          borderColor: isTrouble
            ? 'rgba(244, 63, 94, 0.55)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.45)'
            : 'rgba(16, 185, 129, 0.35)',
        }}
        title={`Click to isolate Bar ${m.measureIndex + 1}`}
      >
        <div className="flex items-center justify-between w-full mb-1.5">
          <span className="font-tabular text-xs font-bold text-[#F5F2EB]">
            BAR {m.measureIndex + 1}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded font-tabular"
            style={{
              backgroundColor: `${barColor}22`,
              color: barColor,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#090B0F] overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(18, firstTryRatio)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#B8B2A6] font-tabular">
          <span>
            {m.firstTryCount}/{m.totalNotes} 1st-try
          </span>
          <span>
            {m.avgTimingErrorMs >= 0 ? '+' : ''}
            {Math.round(m.avgTimingErrorMs)}ms
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fix-me-modal-title"
    >
      <div className="relative w-full max-w-5xl max-h-[92dvh] flex flex-col rounded-xl bg-[#0D0F14] border border-[#E5A93C]/40 shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top Conservatory Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 px-5 py-4 bg-[#161922] border-b border-white/10 shrink-0">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#E5A93C]/15 border border-[#E5A93C]/50 flex items-center justify-center text-[#E5A93C] shrink-0">
              {report.detectedIssues.length === 0 || report.starsEarned === 3 ? (
                <Trophy className="w-5 h-5 text-[#E5A93C]" />
              ) : (
                <Wrench className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-tabular font-bold uppercase tracking-wider text-[#E5A93C]">
                  {report.detectedIssues.length === 0 || report.starsEarned === 3
                    ? 'Conservatory Stage Performance · Mastery Report'
                    : 'Identify My Play & Fix Me · Conservatory Diagnostic'}
                </span>
              </div>
              <h2
                id="fix-me-modal-title"
                className="font-editorial text-xl sm:text-2xl font-semibold text-[#F5F2EB] mt-0.5"
              >
                {report.encouragementHeadline}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2230] hover:bg-[#282D40] border border-white/10 text-[#B8B2A6] hover:text-white text-xs font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Return to Song</span>
          </button>
        </div>

        {/* Scrollable Diagnostic Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 1. Performance Telemetry Ribbon (Stars, Accuracy, First-Try %, Timing Tendency) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stars Earned */}
            <div className="p-3.5 rounded-lg bg-[#161922] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#B8B2A6] font-medium">
                  Stage Rating
                </div>
                <div className="font-tabular text-lg font-bold text-[#F5F2EB] mt-0.5">
                  {report.starsEarned} / 3 Stars
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= report.starsEarned
                        ? 'text-[#E5A93C] fill-[#E5A93C]'
                        : 'text-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* First-Try Accuracy */}
            <div className="p-3.5 rounded-lg bg-[#161922] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#B8B2A6] font-medium">
                  First-Try Accuracy
                </div>
                <div className="font-tabular text-xl font-bold text-[#38BDF8] mt-0.5">
                  {Math.round(report.firstTryPct)}%
                </div>
              </div>
              <Target className="w-6 h-6 text-[#38BDF8]/80" />
            </div>

            {/* Overall Note Completion */}
            <div className="p-3.5 rounded-lg bg-[#161922] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#B8B2A6] font-medium">
                  Overall Accuracy
                </div>
                <div className="font-tabular text-xl font-bold text-[#10B981] mt-0.5">
                  {Math.round(report.overallAccuracyPct)}%
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-[#10B981]/80" />
            </div>

            {/* Rhythm & Timing Tendency */}
            <div className="p-3.5 rounded-lg bg-[#161922] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#B8B2A6] font-medium">
                  Timing Pocket
                </div>
                <div
                  className="font-tabular text-sm font-bold mt-1 px-2 py-0.5 rounded inline-block"
                  style={{
                    color: rhythmBadge.color,
                    backgroundColor: rhythmBadge.bg,
                  }}
                >
                  {rhythmBadge.label}
                </div>
              </div>
              <Clock className="w-6 h-6 text-[#E5A93C]/80" />
            </div>
          </div>

          {/* Teacher Summary Note */}
          <div className="p-4 rounded-lg bg-[#161922]/90 border border-[#E5A93C]/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#E5A93C] shrink-0 mt-0.5" />
            <p className="text-sm text-[#F5F2EB] leading-relaxed">
              <strong className="text-[#E5A93C] mr-1.5">
                Teacher Summary:
              </strong>
              {report.teacherSummary}
            </p>
          </div>

          {/* 2. Measure-by-Measure Health Map */}
          {report.measureSummaries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-editorial text-base font-semibold text-[#F5F2EB]">
                  Measure-by-Measure Health Map
                </h3>
                <span className="text-xs text-[#B8B2A6]">
                  Click any measure bar to isolate &amp; loop it on the staff
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {report.measureSummaries.map(renderMeasureHealthBar)}
              </div>
            </div>
          )}

          {/* 3. Two-Column Core: Detected Issues (Left) & 3-Step Fix Drill + Videos (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: What We Heard & Physical Hand Diagnosis */}
            <div className="lg:col-span-7 space-y-3.5">
              <h3 className="font-editorial text-base font-semibold text-[#F5F2EB] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <span>What We Heard &amp; Physical Hand Fixes</span>
              </h3>

              {report.detectedIssues.length === 0 ? (
                <div className="p-5 rounded-lg bg-[#161922] border border-[#10B981]/35 text-sm text-[#A7F3D0] flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                  <span>
                    Zero recurring technique slips detected! Your hand placement,
                    finger transitions, and rhythmic pulse were clean across all
                    measures.
                  </span>
                </div>
              ) : (
                report.detectedIssues.map((issue: DetectedIssue, idx: number) => {
                  const sevColor =
                    issue.severity === 'high'
                      ? '#F43F5E'
                      : issue.severity === 'medium'
                      ? '#F59E0B'
                      : '#38BDF8';

                  return (
                    <div
                      key={`${issue.category}-${idx}`}
                      className="p-4 rounded-lg bg-[#161922] border border-white/10 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded font-tabular text-[10px] font-bold uppercase"
                            style={{
                              backgroundColor: `${sevColor}22`,
                              color: sevColor,
                              border: `1px solid ${sevColor}55`,
                            }}
                          >
                            {issue.severity} priority
                          </span>
                          <h4 className="font-semibold text-[#F5F2EB] text-sm">
                            {issue.title}
                          </h4>
                        </div>

                        {issue.affectedMeasures.length > 0 && (
                          <span className="font-tabular text-xs text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded">
                            Bars{' '}
                            {issue.affectedMeasures
                              .map((m) => m + 1)
                              .join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Concrete Example from User's Play */}
                      <div className="px-3 py-2 rounded bg-[#0D0F14] border border-white/5 font-tabular text-xs text-[#F59E0B]">
                        <strong>Observed in your play:</strong>{' '}
                        {issue.exampleDetail}
                      </div>

                      {/* Teacher Explanation */}
                      <p className="text-xs sm:text-[13px] text-[#B8B2A6] leading-relaxed">
                        {issue.diagnosisExplanation}
                      </p>

                      {/* Physical Fix Cue */}
                      <div className="pt-1 flex items-start gap-2 text-xs sm:text-[13px] text-[#F5F2EB]">
                        <Flame className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#10B981]">
                            Physical Hand Fix:{' '}
                          </strong>
                          {issue.actionableFixTip}
                        </div>
                      </div>

                      {/* Direct Video Link on Issue Card */}
                      {issue.recommendedVideoIds.length > 0 && onWatchVideo && (
                        <div className="pt-1 flex flex-wrap gap-2">
                          {issue.recommendedVideoIds.map((vidId) => (
                            <button
                              key={vidId}
                              type="button"
                              onClick={() => onWatchVideo(vidId)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E2230] hover:bg-[#282D40] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold transition-colors"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Watch Technique Clip</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: 3-Step Automated Remediation Drill + Prescribed Videos */}
            <div className="lg:col-span-5 space-y-4">
              {/* Automated 3-Stage Remediation Plan Card */}
              {report.remediationPlan && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-[#1E2230] to-[#161922] border border-[#E5A93C]/55 shadow-lg space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-[#E5A93C]/20 text-[#E5A93C] font-tabular text-[11px] font-bold uppercase tracking-wider">
                      Guided Micro-Drill
                    </span>
                    <span className="font-tabular text-xs text-[#B8B2A6]">
                      Bars {report.remediationPlan.measureRange[0] + 1}–
                      {report.remediationPlan.measureRange[1] + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-[#F5F2EB]">
                      {report.remediationPlan.title}
                    </h3>
                    <p className="text-xs text-[#B8B2A6] mt-1 leading-relaxed">
                      {report.remediationPlan.summary}
                    </p>
                  </div>

                  {/* 3 Progressive Stages */}
                  <div className="space-y-2">
                    {report.remediationPlan.stages.map((stage) => (
                      <div
                        key={stage.stageNumber}
                        className="p-2.5 rounded-lg bg-[#0D0F14]/90 border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C] text-[#E5A93C] font-tabular text-xs font-bold flex items-center justify-center shrink-0">
                            {stage.stageNumber}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-[#F5F2EB]">
                              {stage.title}
                            </div>
                            <div className="text-[11px] text-[#B8B2A6]">
                              {stage.subtitle}
                            </div>
                          </div>
                        </div>
                        <span className="font-tabular text-[11px] font-bold text-[#10B981] shrink-0">
                          {stage.targetCleanReps}x clean
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      report.remediationPlan &&
                      triggerRemediation(report.remediationPlan)
                    }
                    className="w-full py-2.5 px-4 rounded-lg bg-[#E5A93C] hover:bg-[#F0B849] text-[#090B0F] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,169,60,0.4)] transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start 3-Step Fix Drill Now</span>
                  </button>
                </div>
              )}

              {/* Prescribed Video Tutorials */}
              {resolvedPrescribedVideos.length > 0 && (
                <div className="p-4 rounded-xl bg-[#161922] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#38BDF8]" />
                    <h3 className="font-editorial text-base font-semibold text-[#F5F2EB]">
                      Prescribed Video Tutorials
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {resolvedPrescribedVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className="p-3 rounded-lg bg-[#1E2230] border border-white/10 hover:border-[#38BDF8]/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-tabular font-bold px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8]">
                              {vid.durationLabel}
                            </span>
                            <span className="text-[11px] text-[#B8B2A6] truncate">
                              {vid.instructor}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-[#F5F2EB] mt-1 truncate">
                            {vid.title}
                          </div>
                        </div>

                        {onWatchVideo && (
                          <button
                            type="button"
                            onClick={() => onWatchVideo(vid.id)}
                            className="px-3 py-1.5 rounded-md bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] text-xs font-bold shrink-0 inline-flex items-center gap-1"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Watch</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Modal Footer */}
        <div className="px-5 py-3.5 bg-[#161922] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#B8B2A6]">
            Tip: Practicing a 2-bar trouble spot slowly in Wait Mode fixes muscle
            memory 4× faster than restarting from Bar 1.
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onRetrySong && (
              <button
                type="button"
                onClick={onRetrySong}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E2230] hover:bg-[#282D40] border border-white/15 text-[#F5F2EB] text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Full Song</span>
              </button>
            )}

            {report.remediationPlan && (
              <button
                type="button"
                onClick={() =>
                  report.remediationPlan &&
                  triggerRemediation(report.remediationPlan)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F0B849] text-[#090B0F] text-xs font-bold transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Start 3-Step Fix Drill</span>
              </button>
            )}

            {onNextStepOrLesson && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNextStepOrLesson();
                }}
                className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#090B0F] font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-[0_0_14px_rgba(16,185,129,0.3)]"
              >
                <span>{nextStepLabel ?? 'Continue to Next Step →'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixMeModal;
