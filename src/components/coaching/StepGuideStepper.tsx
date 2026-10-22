import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Gauge,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { LessonStep, LessonStepType } from '../../types';

export interface StepGuideStepperProps {
  steps: LessonStep[];
  /** 0-indexed active step index (0..4) */
  activeStepIndex?: number;
  /** Optional 1-indexed active step number (1..5) if caller prefers 1-based */
  currentStepNumber?: number;
  /** Set or array of completed step indices (0-indexed) */
  completedStepIndices?: number[];
  /** Set or array of completed step IDs */
  completedStepIds?: string[];
  /** Callback when user clicks a step pill */
  onSelectStep?: (stepIndex: number, step: LessonStep) => void;
  /** Callback to advance to the next step */
  onNextStep?: () => void;
  /** Callback to open the associated technique video */
  onWatchVideo?: (videoId?: string) => void;
  /** Compact header-only bar without the instruction drawer row */
  compact?: boolean;
  className?: string;
}

const STEP_SHORT_LABELS: Record<LessonStepType, string> = {
  video_intro: 'Video & Posture',
  key_discovery: 'Find Keys',
  wait_mode: 'Wait Mode',
  slow_flow: 'Slow Flow',
  stage_performance: 'Stage & Coach',
};

function getStepIcon(type: LessonStepType, className = 'w-3.5 h-3.5') {
  switch (type) {
    case 'video_intro':
      return <PlayCircle className={className} />;
    case 'key_discovery':
      return <Compass className={className} />;
    case 'wait_mode':
      return <PauseCircle className={className} />;
    case 'slow_flow':
      return <Gauge className={className} />;
    case 'stage_performance':
      return <Trophy className={className} />;
  }
}

export const StepGuideStepper: React.FC<StepGuideStepperProps> = ({
  steps,
  activeStepIndex,
  currentStepNumber,
  completedStepIndices = [],
  completedStepIds = [],
  onSelectStep,
  onNextStep,
  onWatchVideo,
  compact = false,
  className = '',
}) => {
  const resolvedIndex =
    activeStepIndex !== undefined
      ? activeStepIndex
      : currentStepNumber !== undefined
      ? Math.max(0, currentStepNumber - 1)
      : 0;

  const currentStep =
    steps[Math.min(Math.max(0, resolvedIndex), Math.max(0, steps.length - 1))];

  return (
    <div
      className={`w-full ${
        compact
          ? 'bg-transparent border-0 px-0 py-0'
          : 'bg-[#161922] border-b border-white/10 px-3 sm:px-5 py-2.5'
      } flex flex-col gap-2 ${className}`}
    >
      {/* Top Row: 5-Step Pedagogical Progression Track */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {steps.map((step, idx) => {
            const isActive = idx === resolvedIndex;
            const isDone = completedStepIndices.includes(idx) || completedStepIds.includes(step.id);
            const shortLabel = STEP_SHORT_LABELS[step.type] ?? step.title;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onSelectStep?.(idx, step)}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-[#E5A93C]/15 text-[#F5F2EB] border-[#E5A93C] shadow-[0_0_12px_rgba(229,169,60,0.22)]'
                      : isDone
                      ? 'bg-[#10B981]/10 text-[#A7F3D0] border-[#10B981]/35 hover:border-[#10B981]/60'
                      : 'bg-[#1E2230]/75 text-[#B8B2A6] border-white/10 hover:text-[#F5F2EB] hover:border-white/20'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center font-tabular text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#E5A93C] text-[#090B0F]'
                        : isDone
                        ? 'bg-[#10B981] text-[#090B0F]'
                        : 'bg-white/10 text-[#B8B2A6]'
                    }`}
                  >
                    {isDone && !isActive ? (
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    ) : (
                      step.stepNumber
                    )}
                  </span>

                  <span className="hidden md:inline-flex items-center gap-1">
                    {getStepIcon(
                      step.type,
                      `w-3.5 h-3.5 ${
                        isActive
                          ? 'text-[#E5A93C]'
                          : isDone
                          ? 'text-[#10B981]'
                          : 'text-[#7D8494]'
                      }`
                    )}
                  </span>

                  <span>
                    {step.stepNumber}. {shortLabel}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#7D8494]/50 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Quick Next Step / Video Action */}
        <div className="flex items-center gap-2 shrink-0">
          {currentStep?.videoId && onWatchVideo && (
            <button
              type="button"
              onClick={() => onWatchVideo(currentStep.videoId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E2230] hover:bg-[#282D40] border border-[#E5A93C]/40 text-[#E5A93C] text-xs font-semibold transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Technique Video</span>
            </button>
          )}

          {onNextStep && resolvedIndex < steps.length - 1 && (
            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#E5A93C]/20 hover:bg-[#E5A93C]/30 border border-[#E5A93C]/50 text-[#F5F2EB] text-xs font-semibold transition-colors"
            >
              <span>Step {resolvedIndex + 2}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#E5A93C]" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Current Step Pedagogical Instruction & Coach Tip */}
      {!compact && currentStep && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-1.5 border-t border-white/5 text-xs">
          <div className="flex items-start sm:items-center gap-2 text-[#F5F2EB]">
            <span className="px-2 py-0.5 rounded bg-[#E5A93C]/20 text-[#E5A93C] font-tabular font-bold text-[11px] uppercase tracking-wider shrink-0">
              Step {currentStep.stepNumber} Goal
            </span>
            <p className="text-[13px] font-medium leading-snug">
              <strong className="font-semibold text-white mr-1.5">
                {currentStep.title}:
              </strong>
              <span className="text-[#B8B2A6]">{currentStep.instruction}</span>
            </p>
          </div>

          {currentStep.coachTip && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E2230]/85 border border-white/10 text-[#B8B2A6] shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A93C] shrink-0" />
              <span className="text-[11px]">
                <strong className="text-[#F5F2EB]">Coach Tip:</strong>{' '}
                {currentStep.coachTip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepGuideStepper;
