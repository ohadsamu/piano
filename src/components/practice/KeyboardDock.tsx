import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PracticeSessionSnapshot } from '../../types';
import { InteractiveKeyboard } from '../visualizers/InteractiveKeyboard';
import { TOTAL_WHITE_KEYS, keyCenterPx } from '../../utils/keyboardLayout';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import type { TargetNote } from './types';

export interface KeyboardDockProps {
  snapshot?: Pick<
    PracticeSessionSnapshot,
    'hintedMidis' | 'wrongPlayedMidis' | 'liveCorrection' | 'showNoteNames' | 'showFingerNumbers'
  > | null;
  targets: TargetNote[];
  heldMidis: number[];
  showQwertyLabels: boolean;
  /** Bump to force a re-centre on the targets (e.g. "Show me"). */
  focusNonce?: number;
  /** Extra amber-highlighted keys ("Show me"). */
  extraHintMidis?: number[];
  onKeyDown(midi: number, velocity?: number): void;
  onKeyUp(midi: number): void;
  /** Override key height (e.g. a shorter landscape dock when there's content to read). */
  heightClass?: string;
}

const MIN_KEY_PX = 44;
const OCTAVE_WHITE_KEYS = 7;

export const KeyboardDock: React.FC<KeyboardDockProps> = ({
  snapshot,
  targets,
  heldMidis,
  showQwertyLabels,
  focusNonce = 0,
  extraHintMidis,
  onKeyDown,
  onKeyUp,
  heightClass = 'h-[150px] lg:h-[180px] [@media(max-height:480px)]:h-[calc(100dvh-72px)]',
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [keyPx, setKeyPx] = useState(MIN_KEY_PX);
  const [view, setView] = useState({ left: 0, width: 1, total: 1 });
  const reduced = usePrefersReducedMotion();
  const initialisedRef = useRef(false);
  const lastNonceRef = useRef(focusNonce);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setView({ left: el.scrollLeft, width: el.clientWidth, total: el.scrollWidth });
  }, []);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setKeyPx(Math.max(MIN_KEY_PX, Math.floor(el.clientWidth / TOTAL_WHITE_KEYS)));
      measure();
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const targetKey = targets.map((t) => t.midi).join(',');

  // Keep the target keys inside the middle 60% of the visible window.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const midis = targets.length > 0 ? targets.map((t) => t.midi) : initialisedRef.current ? [] : [60];
    if (midis.length === 0) return;
    const w = el.clientWidth;
    const centres = midis.map((m) => keyCenterPx(m, keyPx));
    const lo = Math.min(...centres);
    const hi = Math.max(...centres);
    // A two-hand spread wider than the screen can't fit: show the lowest key first. Once it is
    // played it leaves the target list and the dock re-centres on what remains.
    const mid = hi - lo > w - 2 * keyPx ? lo + w / 2 - 1.5 * keyPx : (lo + hi) / 2;
    const rel = mid - el.scrollLeft;
    const first = !initialisedRef.current;
    initialisedRef.current = true;
    const forced = focusNonce !== lastNonceRef.current;
    lastNonceRef.current = focusNonce;
    if (first || forced || rel < w * 0.2 || rel > w * 0.8) {
      el.scrollTo({ left: Math.max(0, mid - w / 2), behavior: reduced || first ? 'auto' : 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, keyPx, focusNonce, reduced]);

  const scrollByOctave = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: dir * OCTAVE_WHITE_KEYS * keyPx,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  const canScroll = view.total > view.width + 1;
  const atStart = view.left <= 1;
  const atEnd = view.left + view.width >= view.total - 1;
  const thumbLeftPct = (view.left / view.total) * 100;
  const thumbWidthPct = Math.min(100, (view.width / view.total) * 100);

  const hinted = extraHintMidis?.length
    ? Array.from(new Set([...(snapshot?.hintedMidis ?? []), ...extraHintMidis]))
    : snapshot?.hintedMidis ?? [];

  const navBtn =
    'absolute top-1/2 -translate-y-1/2 z-40 w-11 h-11 flex items-center justify-center rounded-control bg-ebony-void/85 text-ink-primary border border-ink-primary/15 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

  return (
    <section
      aria-label="On-screen piano"
      className="sticky bottom-0 z-30 w-full bg-ebony-void"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {canScroll && (
        <div className="relative h-1.5 w-full bg-ebony-iron" aria-hidden="true">
          <div
            className="absolute top-0 h-full rounded-full bg-ink-muted"
            style={{ left: `${thumbLeftPct}%`, width: `${thumbWidthPct}%` }}
          />
        </div>
      )}
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={measure}
          className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ overscrollBehaviorX: 'contain' }}
        >
          <InteractiveKeyboard
            whiteKeyWidthPx={keyPx}
            className="mx-auto"
            heightClass={heightClass}
            currentlyHeldMidis={heldMidis}
            activeTargetNotes={targets}
            hintedMidis={hinted}
            wrongPlayedMidis={snapshot?.wrongPlayedMidis ?? []}
            liveCorrection={snapshot?.liveCorrection ?? null}
            showNoteNames={snapshot?.showNoteNames ?? true}
            showFingerNumbers={snapshot?.showFingerNumbers ?? true}
            showQwertyLabels={showQwertyLabels}
            onNoteOn={onKeyDown}
            onNoteOff={onKeyUp}
          />
        </div>
        {canScroll && (
          <>
            <button
              type="button"
              aria-label="Lower octave"
              disabled={atStart}
              onClick={() => scrollByOctave(-1)}
              className={`${navBtn} left-1`}
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Higher octave"
              disabled={atEnd}
              onClick={() => scrollByOctave(1)}
              className={`${navBtn} right-1`}
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default KeyboardDock;
