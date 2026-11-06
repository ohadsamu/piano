import React from 'react';
import type { KeyDiscoveryPrompt } from '../../types';
import { MIDI_TO_QWERTY_LABEL } from '../../utils/keyboardLayout';
import { COPY, HAND_NAME } from '../copy';
import type { TargetNote } from './types';

export type PromptPhase = 'ready' | 'playing' | 'paused';
export type InputHint = 'qwerty' | 'piano' | 'none';

export interface PromptCardActions {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  showMe(): void;
  skipNote(): void;
  slower(): void;
}

export interface PromptCardProps {
  phase: PromptPhase;
  timed: boolean;
  /** Hear it: the app plays, input is ignored. */
  listening?: boolean;
  targets: TargetNote[];
  /** Timed steps: true while the shown note is still ahead of the playhead. */
  upcoming?: boolean;
  discoveryPrompt?: KeyDiscoveryPrompt | null;
  correction?: string | null;
  inputHint: InputHint;
  showMeActive?: boolean;
  /** Beats left in the count-in (timed steps), or null. */
  countIn?: number | null;
  beat?: number;
  beatsPerMeasure?: number;
  canSlowDown?: boolean;
  compact?: boolean;
  on: PromptCardActions;
}

const btnBase =
  'h-11 px-3 sm:px-4 rounded-control text-base font-semibold whitespace-nowrap inline-flex items-center justify-center disabled:opacity-40';
export const BTN_PRIMARY = `${btnBase} bg-brass text-ebony-void hover:bg-brass-light`;
export const BTN_SECONDARY = `${btnBase} bg-ebony-iron text-ink-primary border border-ink-primary/15 hover:border-ink-primary/35`;
export const BTN_HINT = `${btnBase} bg-ebony-iron text-state-hint border border-state-hint/40 hover:border-state-hint`;

function noteNames(targets: TargetNote[]): string {
  return targets.map((t) => t.noteName ?? '').filter(Boolean).join(' ');
}

function handWord(targets: TargetNote[]): string | null {
  const hands = new Set(targets.map((t) => t.hand).filter(Boolean));
  if (hands.size === 0) return null;
  if (hands.size > 1) return 'both hands';
  return HAND_NAME[[...hands][0] as 'right' | 'left'];
}

export const PromptCard: React.FC<PromptCardProps> = ({
  phase,
  timed,
  listening,
  targets,
  upcoming = false,
  discoveryPrompt,
  correction,
  inputHint,
  showMeActive,
  countIn = null,
  beat = 0,
  beatsPerMeasure = 4,
  canSlowDown = true,
  compact,
  on,
}) => {
  const names = noteNames(targets);
  const hand = handWord(targets);
  const fingers = targets.map((t) => t.finger).filter(Boolean);
  const keys = targets.map((t) => MIDI_TO_QWERTY_LABEL[t.midi]).filter(Boolean);
  const singleHand = targets[0]?.hand;
  const noteColour = showMeActive
    ? 'text-state-hint'
    : singleHand === 'left' && hand !== 'both hands'
    ? 'text-hand-left'
    : 'text-hand-right';

  let instruction: string | null = null;
  if (phase === 'paused' && countIn === null) instruction = null;
  else if (listening) instruction = phase === 'ready' ? 'Press Start to hear the piece.' : 'Listen and watch the keys.';
  else if (countIn !== null) instruction = `${COPY.getReady} ${countIn}`;
  else if (phase === 'ready') instruction = timed ? COPY.pressStartTimed : COPY.pressToStart;
  else if (discoveryPrompt) instruction = discoveryPrompt.instruction;

  const actions = (() => {
    if (countIn !== null) {
      return (
        <span className="h-11 inline-flex items-center font-serif text-xl-31 font-semibold text-brass tabular-nums" aria-hidden="true">
          {countIn}
        </span>
      );
    }
    if (phase === 'paused') {
      return (
        <>
          <button type="button" className={BTN_PRIMARY} onClick={on.resume}>
            {COPY.resume}
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={on.restart}>
            {COPY.startOver}
          </button>
        </>
      );
    }
    if (timed || listening) {
      return phase === 'ready' ? (
        <button type="button" className={BTN_PRIMARY} onClick={on.start}>
          {COPY.start}
        </button>
      ) : (
        <>
          <button type="button" className={BTN_SECONDARY} onClick={on.pause}>
            {COPY.pause}
          </button>
          {!listening && (
            <button type="button" className={BTN_SECONDARY} onClick={on.slower} disabled={!canSlowDown}>
              {COPY.slower}
            </button>
          )}
        </>
      );
    }
    return (
      <>
        {phase === 'ready' && (
          <button type="button" className={BTN_PRIMARY} onClick={on.start}>
            {COPY.start}
          </button>
        )}
        <button type="button" className={BTN_HINT} onClick={on.showMe} disabled={targets.length === 0}>
          {COPY.showMe}
        </button>
        <button type="button" className={BTN_SECONDARY} onClick={on.skipNote} disabled={targets.length === 0}>
          {COPY.skipNote}
        </button>
      </>
    );
  })();

  const hintLine =
    inputHint === 'qwerty' && keys.length > 0 ? (
      <span className="inline-flex items-center gap-1.5">
        press
        {keys.map((k) => (
          <kbd
            key={k}
            className="min-w-7 h-7 px-1.5 inline-flex items-center justify-center rounded-control border border-ink-primary/25 bg-ebony-iron text-ink-primary text-base font-semibold"
          >
            {k}
          </kbd>
        ))}
      </span>
    ) : inputHint === 'piano' ? (
      <span>play it on your piano</span>
    ) : null;

  const beatDots = timed && phase === 'playing' && (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: beatsPerMeasure }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            Math.floor(beat) % beatsPerMeasure === i ? 'bg-brass' : 'bg-ink-muted/40'
          }`}
        />
      ))}
    </div>
  );

  if (phase === 'paused' && !compact && countIn === null) {
    return (
      <section aria-label="What to play" className="flex flex-col gap-3">
        <p className="font-serif text-xl-31 font-semibold text-ink-primary">{COPY.paused}</p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </section>
    );
  }

  if (compact) {
    return (
      <section aria-label="What to play" className="shrink-0 flex items-center gap-3">
        <span className={`font-serif text-lg-25 font-semibold tabular-nums whitespace-nowrap ${noteColour}`} aria-live="polite">
          {phase === 'paused' ? COPY.paused : names || ' '}
        </span>
        {hand && phase !== 'paused' && (
          <span className="hidden min-[900px]:inline text-xs-13 text-ink-secondary whitespace-nowrap">
            {hand}
            {fingers.length === 1 ? ` ${fingers[0]}` : ''}
          </span>
        )}
        <div className="flex gap-2">{actions}</div>
      </section>
    );
  }

  return (
    <section aria-label="What to play" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {timed && phase === 'playing' && targets.length > 0 && (
            <p className={`text-xs-13 ${upcoming ? 'text-ink-muted' : 'text-state-ok font-semibold'}`}>
              {upcoming ? COPY.upNext : COPY.playNow}
            </p>
          )}
          <p
            className={`font-serif font-semibold leading-none tabular-nums ${
              targets.length > 2 ? 'text-xl-31' : 'text-note-44'
            } ${noteColour}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {targets.length > 0
              ? targets.map((t, i) => (
                  <span
                    key={`${t.midi}-${i}`}
                    className={showMeActive ? 'text-state-hint' : t.hand === 'left' ? 'text-hand-left' : 'text-hand-right'}
                  >
                    {i > 0 ? ' ' : ''}
                    {t.noteName}
                  </span>
                ))
              : listening
              ? ''
              : ' '}
            <span className="sr-only">
              {hand ? `, ${hand}` : ''}
              {fingers.length === 1 ? `, finger ${fingers[0]}` : ''}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right text-base text-ink-secondary leading-snug" aria-hidden="true">
          {hand && <div>{hand}</div>}
          {fingers.length > 0 && (
            <div>
              {fingers.length === 1 ? 'finger' : 'fingers'} {fingers.join(' ')}
            </div>
          )}
        </div>
      </div>
      {(hintLine || beatDots) && (
        <div className="flex items-center justify-between gap-3 text-base text-ink-secondary min-h-7">
          <div>{hintLine}</div>
          {beatDots}
        </div>
      )}
      {instruction && <p className="text-base text-ink-primary leading-snug max-w-prose">{instruction}</p>}
      {correction && (
        <p className="text-base text-state-wrong leading-snug" role="status">
          {correction}
        </p>
      )}
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  );
};

export default PromptCard;
