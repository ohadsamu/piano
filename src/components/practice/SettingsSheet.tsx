import React from 'react';
import type { Hand, PracticeSessionSnapshot } from '../../types';
import { Sheet } from '../shell/Sheet';
import { COPY, HAND_LABEL } from '../copy';
import type { SettingsHandlers } from './types';

export interface SettingsSheetProps {
  open: boolean;
  snapshot: PracticeSessionSnapshot;
  showFalling: boolean;
  /** Skip step is only offered inside a lesson. */
  canSkipStep: boolean;
  onClose(): void;
  on: SettingsHandlers;
}

const HANDS: Hand[] = ['right', 'left', 'both'];
const SPEEDS = [0.6, 0.75, 1];

const Segmented: React.FC<{
  label: string;
  options: { value: string; label: string; active: boolean; onSelect(): void }[];
}> = ({ label, options }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 py-2">
    <span className="text-base text-ink-primary">{label}</span>
    <div role="radiogroup" aria-label={label} className="flex rounded-control bg-ebony-lacquer p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.active}
          onClick={o.onSelect}
          className={`h-11 min-w-11 px-3 rounded-control text-base font-semibold tabular-nums ${
            o.active ? 'bg-brass text-ebony-void' : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

const Toggle: React.FC<{ label: string; on: boolean; onToggle(): void }> = ({ label, on, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onToggle}
    className="w-full min-h-11 flex items-center justify-between gap-3 py-2 text-left"
  >
    <span className="text-base text-ink-primary">{label}</span>
    <span
      aria-hidden="true"
      className={`relative w-11 h-6 rounded-full shrink-0 ${on ? 'bg-state-ok' : 'bg-ebony-iron border border-ink-primary/20'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-ink-primary ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </span>
  </button>
);

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  snapshot,
  showFalling,
  canSkipStep,
  onClose,
  on,
}) => (
  <Sheet
    open={open}
    title={COPY.settings}
    onClose={onClose}
    footer={
      canSkipStep ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs-13 text-ink-muted">{COPY.skipStepHint}</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              on.skipStep();
            }}
            className="h-11 px-3 rounded-control text-base text-ink-secondary underline underline-offset-4 hover:text-ink-primary"
          >
            {COPY.skipStep}
          </button>
        </div>
      ) : undefined
    }
  >
    <div className="divide-y divide-ink-primary/10">
      <Segmented
        label={COPY.hands}
        options={HANDS.map((h) => ({
          value: h,
          label: HAND_LABEL[h],
          active: snapshot.handFilter === h,
          onSelect: () => on.setHand(h),
        }))}
      />
      <Segmented
        label={COPY.speed}
        options={SPEEDS.map((m) => ({
          value: String(m),
          label: `${Math.round(m * 100)}%`,
          active: Math.abs(snapshot.tempoMultiplier - m) < 0.05,
          onSelect: () => on.setSpeed(m),
        }))}
      />
      <Toggle label={COPY.metronome} on={snapshot.metronomeEnabled} onToggle={on.toggleMetronome} />
      <Toggle label={COPY.backing} on={snapshot.accompanimentEnabled} onToggle={on.toggleBacking} />
      <Toggle label={COPY.noteNames} on={snapshot.showNoteNames} onToggle={on.toggleNoteNames} />
      <Toggle label={COPY.falling} on={showFalling} onToggle={on.toggleFalling} />
      <Toggle label={COPY.handGuide} on={snapshot.showOverheadHands} onToggle={on.toggleHandGuide} />
    </div>
  </Sheet>
);

export default SettingsSheet;
