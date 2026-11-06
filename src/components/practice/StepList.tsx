import React from 'react';
import { Check } from 'lucide-react';
import type { LessonStep } from '../../types';
import { STEP_LABEL } from '../copy';

export interface StepListProps {
  steps: LessonStep[];
  stepIndex: number;
  completedSteps: number[];
  onSelectStep(i: number): void;
}

/** Desktop rail (≥1024px) version of the step dots. */
export const StepList: React.FC<StepListProps> = ({ steps, stepIndex, completedSteps, onSelectStep }) => (
  <nav aria-label="Steps" className="w-[220px] shrink-0 border-r border-ink-primary/10 py-4 pr-3">
    <h2 className="px-3 pb-2 text-xs-13 text-ink-muted">Steps</h2>
    <ol className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const done = completedSteps.includes(s.stepNumber);
        const current = i === stepIndex;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelectStep(i)}
              aria-current={current ? 'step' : undefined}
              className={`w-full min-h-11 flex items-center gap-3 px-3 py-2 rounded-control text-left ${
                current ? 'bg-ebony-spruce text-ink-primary' : 'text-ink-secondary hover:bg-ebony-spruce/60 hover:text-ink-primary'
              }`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs-13 tabular-nums ${
                  done
                    ? 'bg-state-ok text-ebony-void'
                    : current
                    ? 'border-2 border-brass text-brass'
                    : 'border border-ink-muted text-ink-muted'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.stepNumber}
              </span>
              <span className="text-base leading-snug">
                {STEP_LABEL[s.type]}
                {done && <span className="sr-only">, done</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default StepList;
