import React from 'react';
import type { Lesson } from '../../types';
import { COPY, STEP_LABEL, stepOfLabel } from '../copy';

export interface ContinueCardProps {
  lesson: Lesson;
  stepIndex: number;
  doneCount: number;
  onContinue(): void;
}

/** The hero: one lesson, one button. */
export const ContinueCard: React.FC<ContinueCardProps> = ({ lesson, stepIndex, doneCount, onContinue }) => {
  const step = lesson.steps[stepIndex];
  const total = lesson.steps.length;
  return (
    <section aria-labelledby="continue-title" className="rounded-panel bg-ebony-spruce border border-ink-primary/10 overflow-hidden">
      <div className="h-[3px] bg-felt-crimson" aria-hidden="true" />
      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs-13 text-ink-secondary">Lesson {lesson.unitNumber}</p>
        <h2 id="continue-title" className="font-serif text-lg-25 font-semibold leading-tight text-ink-primary">
          {lesson.title}
        </h2>
        {step && <p className="text-base text-ink-secondary">{stepOfLabel(step.stepNumber, total, STEP_LABEL[step.type])}</p>}
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
            className="flex-1 h-2 rounded-full bg-ebony-iron overflow-hidden"
          >
            <div className="h-full bg-brass rounded-full" style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>
          <span className="text-xs-13 text-ink-secondary tabular-nums">
            {doneCount} of {total} steps done
          </span>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-1 h-12 w-full rounded-control bg-brass text-ebony-void text-md-20 font-semibold hover:bg-brass-light"
        >
          {doneCount === 0 && stepIndex === 0 ? COPY.start : COPY.continue}
        </button>
      </div>
    </section>
  );
};

export default ContinueCard;
