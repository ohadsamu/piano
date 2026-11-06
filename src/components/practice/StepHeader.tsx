import React from 'react';
import { Check } from 'lucide-react';
import type { LessonStep, PracticeMode } from '../../types';
import { COPY, MODE_LABEL, STEP_LABEL, stepOfLabel } from '../copy';
import type { StepProgress } from '../../utils/progress';
import { ProgressMeter } from './ProgressMeter';
import type { SongMode } from './types';

export interface StepHeaderProps {
  steps?: LessonStep[];
  stepIndex: number;
  completedSteps: number[];
  progress: StepProgress | null;
  listening?: boolean;
  /** Song mode */
  songMode?: PracticeMode | null;
  onChangeMode?(mode: SongMode): void;
  /** "Practising bar N" line */
  loopBar?: number | null;
  onClearLoop?(): void;
  onSelectStep(stepIndex: number): void;
  /** Hide the dots (desktop rail shows them). */
  hideDots?: boolean;
}

const SONG_MODES: SongMode[] = ['wait_mode', 'slow_practice', 'auto_demo'];

export const StepDots: React.FC<{
  steps: LessonStep[];
  stepIndex: number;
  completedSteps: number[];
  onSelectStep(i: number): void;
}> = ({ steps, stepIndex, completedSteps, onSelectStep }) => (
  <ol className="flex items-center shrink-0 -mr-2" aria-label="Steps">
    {steps.map((s, i) => {
      const done = completedSteps.includes(s.stepNumber);
      const current = i === stepIndex;
      return (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelectStep(i)}
            aria-label={`Step ${s.stepNumber}: ${STEP_LABEL[s.type]}${done ? ', done' : ''}`}
            aria-current={current ? 'step' : undefined}
            className="w-11 h-11 flex items-center justify-center rounded-control hover:bg-ebony-iron"
          >
            <span
              className={`flex items-center justify-center rounded-full ${
                current
                  ? 'w-4 h-4 ring-2 ring-brass ring-offset-2 ring-offset-ebony-lacquer ' +
                    (done ? 'bg-state-ok' : 'bg-brass')
                  : done
                  ? 'w-4 h-4 bg-state-ok'
                  : 'w-3 h-3 border-2 border-ink-muted'
              }`}
            >
              {done && <Check className="w-3 h-3 text-ebony-void" strokeWidth={3} aria-hidden="true" />}
            </span>
          </button>
        </li>
      );
    })}
  </ol>
);

export const StepHeader: React.FC<StepHeaderProps> = ({
  steps,
  stepIndex,
  completedSteps,
  progress,
  listening,
  songMode,
  onChangeMode,
  loopBar,
  onClearLoop,
  onSelectStep,
  hideDots,
}) => {
  const step = steps?.[stepIndex];
  return (
    <div className="shrink-0 border-b border-ink-primary/10 bg-ebony-lacquer">
      <div className="mx-auto max-w-[1200px] px-4 pt-1 pb-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 min-h-11">
          {step && steps ? (
            <>
              <p className="flex-1 min-w-0 text-xs-13 sm:text-base leading-tight text-ink-secondary">
                {stepOfLabel(step.stepNumber, steps.length, STEP_LABEL[step.type])}
              </p>
              {!hideDots && (
                <StepDots steps={steps} stepIndex={stepIndex} completedSteps={completedSteps} onSelectStep={onSelectStep} />
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 w-full flex-wrap">
              <p className="text-base text-ink-secondary">Song</p>
              <div role="radiogroup" aria-label="How to play the song" className="flex rounded-control bg-ebony-spruce p-0.5">
                {SONG_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={songMode === m}
                    onClick={() => onChangeMode?.(m)}
                    className={`h-11 px-3 rounded-control text-xs-13 sm:text-base font-semibold whitespace-nowrap ${
                      songMode === m ? 'bg-brass text-ebony-void' : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {progress && <ProgressMeter {...progress} listening={listening} />}
        {loopBar !== null && loopBar !== undefined && (
          <div className="flex items-center justify-between gap-2 text-xs-13 text-ink-secondary">
            <span>Practising bar {loopBar + 1}</span>
            <button
              type="button"
              onClick={onClearLoop}
              className="h-11 px-2 -my-2 rounded-control text-brass font-semibold hover:bg-ebony-iron"
            >
              {COPY.backToFullPiece}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepHeader;
