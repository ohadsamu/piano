import React from 'react';
import { COPY } from '../copy';

export interface ProgressMeterProps {
  done: number;
  total: number;
  unit: 'notes' | 'keys';
  /** Hear it mode: nothing to count. */
  listening?: boolean;
  compact?: boolean;
}

export const ProgressMeter: React.FC<ProgressMeterProps> = ({ done, total, unit, listening, compact }) => {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  const complete = total > 0 && done >= total;
  const label = listening
    ? `${COPY.listening}…`
    : total === 0
    ? 'No notes for this hand or bar'
    : `${done} of ${total} ${unit}`;

  return (
    <div className={`flex items-center gap-3 ${compact ? 'min-w-[140px]' : 'w-full'}`}>
      <div
        role="progressbar"
        aria-label="Step progress"
        aria-valuemin={0}
        aria-valuemax={listening ? undefined : total}
        aria-valuenow={listening ? undefined : done}
        aria-valuetext={label}
        className="relative flex-1 h-2 rounded-full bg-ebony-iron overflow-hidden"
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-200 ${
            complete ? 'bg-state-ok' : 'bg-brass'
          }`}
          style={{ width: listening ? '0%' : `${pct}%` }}
        />
      </div>
      <span
        className={`shrink-0 text-xs-13 tabular-nums ${complete ? 'text-state-ok' : 'text-ink-secondary'}`}
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
};

export default ProgressMeter;
