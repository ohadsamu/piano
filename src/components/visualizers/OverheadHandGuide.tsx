import React, { useMemo } from 'react';
import type {
  FingerNumber,
  Hand,
  ScoreData,
  ScoreNoteEvent,
  SingleHand,
} from '../../types';
import { getKeyGeometry, TOTAL_WHITE_KEYS } from '../../utils/keyboardLayout';
import { getFingerLabel, midiToNoteName } from '../../utils/midiUtils';

export interface ActiveHandFingerTarget {
  midi: number;
  hand: SingleHand;
  finger: FingerNumber;
  noteName?: string;
}

export interface OverheadHandGuideProps {
  score?: ScoreData;
  currentBeat?: number;
  activeNotes?: ActiveHandFingerTarget[];
  hintedMidis?: number[];
  handFilter?: Hand;
  visible?: boolean;
  className?: string;
}

interface HandRenderState {
  hand: SingleHand;
  /** Horizontal center percentage [0 - 100] of Finger 3 (middle finger axis) */
  palmCenterPct: number;
  activeFingers: Map<FingerNumber, { midi: number; noteName: string; isHinted: boolean }>;
  isUpcomingPreview: boolean;
}

const WHITE_KEY_WIDTH_PCT = 100 / TOTAL_WHITE_KEYS; // ~4.7619%

/**
 * For a 5-finger hand arch over 5 adjacent white keys:
 * Right Hand (left-to-right): 1 (Thumb), 2 (Index), 3 (Middle), 4 (Ring), 5 (Pinky)
 * Left Hand (left-to-right):  5 (Pinky), 4 (Ring),  3 (Middle), 2 (Index), 1 (Thumb)
 */
function getFingerHorizontalOffsetStep(hand: SingleHand, finger: FingerNumber): number {
  if (hand === 'right') {
    return finger - 3; // 1 -> -2, 2 -> -1, 3 -> 0, 4 -> +1, 5 -> +2
  }
  return 3 - finger; // 5 -> -2, 4 -> -1, 3 -> 0, 2 -> +1, 1 -> +2
}

export const OverheadHandGuide: React.FC<OverheadHandGuideProps> = ({
  score,
  currentBeat = 0,
  activeNotes,
  hintedMidis = [],
  handFilter = 'both',
  visible = true,
  className = '',
}) => {
  const hintSet = useMemo(() => new Set(hintedMidis), [hintedMidis]);

  // Resolve active or upcoming notes for Left Hand and Right Hand
  const { leftHandState, rightHandState } = useMemo(() => {
    const computeHandState = (
      hand: SingleHand,
      notes: ActiveHandFingerTarget[],
      isUpcomingPreview: boolean
    ): HandRenderState | null => {
      if (notes.length === 0) return null;

      const activeFingers = new Map<
        FingerNumber,
        { midi: number; noteName: string; isHinted: boolean }
      >();
      let sumInferredPalmCenter = 0;

      for (const n of notes) {
        const geom = getKeyGeometry(n.midi);
        const stepOffset = getFingerHorizontalOffsetStep(hand, n.finger);
        // Infer where Finger 3 (center of the 5-finger hand arch) sits
        const inferredPalm = geom.centerPct - stepOffset * WHITE_KEY_WIDTH_PCT;
        sumInferredPalmCenter += inferredPalm;

        activeFingers.set(n.finger, {
          midi: n.midi,
          noteName: n.noteName ?? midiToNoteName(n.midi),
          isHinted: hintSet.has(n.midi),
        });
      }

      const palmCenterPct = Math.max(
        10,
        Math.min(90, sumInferredPalmCenter / notes.length)
      );

      return {
        hand,
        palmCenterPct,
        activeFingers,
        isUpcomingPreview,
      };
    };

    // Priority 1: Explicit activeNotes prop (used in Key Discovery, Video Player, or Wait Mode)
    if (activeNotes && activeNotes.length > 0) {
      const lhNotes = activeNotes.filter((n) => n.hand === 'left');
      const rhNotes = activeNotes.filter((n) => n.hand === 'right');

      return {
        leftHandState:
          handFilter === 'right' ? null : computeHandState('left', lhNotes, false),
        rightHandState:
          handFilter === 'left' ? null : computeHandState('right', rhNotes, false),
      };
    }

    // Priority 2: Derive from ScoreData & currentBeat (active notes at currentBeat, or lookahead 1.5 beats)
    if (!score) {
      // Default resting posture over C3–G3 (LH) and C4–G4 (RH)
      return {
        leftHandState: null,
        rightHandState: null,
      };
    }

    const findHandNotesAtBeat = (
      hand: SingleHand
    ): { notes: ActiveHandFingerTarget[]; isPreview: boolean } => {
      // Check currently sounding / active notes at currentBeat
      const currentMatches = score.notes.filter(
        (n: ScoreNoteEvent) =>
          n.hand === hand &&
          currentBeat >= n.beatStart - 0.15 &&
          currentBeat <= n.beatStart + n.durationBeats + 0.05
      );
      if (currentMatches.length > 0) {
        // Group by the earliest beatStart among matches
        const targetBeat = currentMatches[0].beatStart;
        const chordGroup = currentMatches.filter(
          (n) => Math.abs(n.beatStart - targetBeat) < 0.08
        );
        return {
          notes: chordGroup.map((n) => ({
            midi: n.midi,
            hand: n.hand,
            finger: n.finger,
            noteName: n.noteName,
          })),
          isPreview: false,
        };
      }

      // Otherwise look ahead up to 2.0 beats so the hand glides into position before the note arrives
      const upcoming = score.notes.filter(
        (n: ScoreNoteEvent) =>
          n.hand === hand &&
          n.beatStart > currentBeat &&
          n.beatStart <= currentBeat + 2.0
      );
      if (upcoming.length > 0) {
        const nextBeat = upcoming[0].beatStart;
        const nextGroup = upcoming.filter(
          (n) => Math.abs(n.beatStart - nextBeat) < 0.08
        );
        return {
          notes: nextGroup.map((n) => ({
            midi: n.midi,
            hand: n.hand,
            finger: n.finger,
            noteName: n.noteName,
          })),
          isPreview: true,
        };
      }

      return { notes: [], isPreview: true };
    };

    const lh =
      handFilter === 'right'
        ? { notes: [], isPreview: false }
        : findHandNotesAtBeat('left');
    const rh =
      handFilter === 'left'
        ? { notes: [], isPreview: false }
        : findHandNotesAtBeat('right');

    return {
      leftHandState: computeHandState('left', lh.notes, lh.isPreview),
      rightHandState: computeHandState('right', rh.notes, rh.isPreview),
    };
  }, [score, currentBeat, activeNotes, handFilter, hintSet]);

  if (!visible) return null;

  const renderHandArchSvg = (state: HandRenderState) => {
    const isRight = state.hand === 'right';
    const primaryColor = isRight ? '#38BDF8' : '#818CF8';
    const orderedFingers: FingerNumber[] = isRight
      ? [1, 2, 3, 4, 5]
      : [5, 4, 3, 2, 1];

    // Relative vertical reach of each finger in top-down perspective (Middle 3 tallest, Thumb 1 lowest)
    const fingerTipY: Record<FingerNumber, number> = {
      1: 42,
      2: 22,
      3: 15,
      4: 24,
      5: 36,
    };

    const activeSummary = Array.from(state.activeFingers.entries())
      .map(
        ([finger, info]) =>
          `${info.noteName} · ${getFingerLabel(finger)}`
      )
      .join(' + ');

    return (
      <div
        key={state.hand}
        className="pointer-events-none absolute bottom-0 transition-all duration-200 ease-out flex flex-col items-center"
        style={{
          left: `${state.palmCenterPct}%`,
          width: `${WHITE_KEY_WIDTH_PCT * 5.2}%`,
          minWidth: '148px',
          transform: 'translateX(-50%)',
          opacity: state.isUpcomingPreview ? 0.62 : 0.96,
        }}
      >
        {/* Floating Hand & Finger Callout Pill */}
        {activeSummary && (
          <div
            className="mb-1 px-2 py-0.5 rounded-full text-[10px] font-tabular font-bold tracking-tight whitespace-nowrap shadow-md border"
            style={{
              backgroundColor: 'rgba(13, 15, 20, 0.92)',
              borderColor: primaryColor,
              color: '#F5F2EB',
            }}
          >
            <span style={{ color: primaryColor }}>
              {isRight ? 'RH' : 'LH'}:
            </span>{' '}
            {activeSummary}
          </div>
        )}

        {/* Translucent Top-Down Articulated Hand Arch SVG */}
        <svg
          viewBox="0 0 200 92"
          className="w-full h-16 sm:h-20 overflow-visible drop-shadow-md"
          aria-label={`${isRight ? 'Right' : 'Left'} Hand Finger Guide`}
        >
          {/* Soft Translucent Palm Arch */}
          <path
            d="M 22 88 C 20 62, 48 50, 100 50 C 152 50, 180 62, 178 88 Z"
            fill={
              isRight
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(129, 140, 248, 0.12)'
            }
            stroke={primaryColor}
            strokeWidth={1.2}
            strokeDasharray={state.isUpcomingPreview ? '4 3' : undefined}
          />

          {/* 5 Articulated Fingers */}
          {orderedFingers.map((fingerNum, idx) => {
            // Evenly spaced across the 5-white-key span (x = 24, 62, 100, 138, 176)
            const fx = 24 + idx * 38;
            const fy = fingerTipY[fingerNum];
            const activeInfo = state.activeFingers.get(fingerNum);
            const isFingerActive = Boolean(activeInfo);
            const isFingerHinted = Boolean(activeInfo?.isHinted);

            const strokeColor = isFingerHinted
              ? '#F59E0B'
              : isFingerActive
              ? primaryColor
              : 'rgba(245, 242, 235, 0.25)';

            const badgeFill = isFingerHinted
              ? '#F59E0B'
              : isFingerActive
              ? primaryColor
              : '#161922';

            const badgeText =
              isFingerHinted || isFingerActive ? '#090B0F' : '#B8B2A6';

            return (
              <g key={`finger-${state.hand}-${fingerNum}`}>
                {/* Finger Shaft from Palm to Fingertip */}
                <line
                  x1={fx}
                  y1={68}
                  x2={fx}
                  y2={fy}
                  stroke={strokeColor}
                  strokeWidth={isFingerActive ? 11 : 8}
                  strokeLinecap="round"
                  opacity={isFingerActive ? 0.85 : 0.35}
                />

                {/* Pulsing Outer Halo on Active Finger */}
                {isFingerActive && (
                  <circle
                    cx={fx}
                    cy={fy}
                    r={14}
                    fill={
                      isFingerHinted
                        ? 'rgba(245, 158, 11, 0.28)'
                        : isRight
                        ? 'rgba(56, 189, 248, 0.28)'
                        : 'rgba(129, 140, 248, 0.28)'
                    }
                    stroke={strokeColor}
                    strokeWidth={1.5}
                  />
                )}

                {/* Finger Number Badge at Fingertip */}
                <circle
                  cx={fx}
                  cy={fy}
                  r={isFingerActive ? 9.5 : 7.5}
                  fill={badgeFill}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
                <text
                  x={fx}
                  y={fy + 3.5}
                  textAnchor="middle"
                  fill={badgeText}
                  fontSize={isFingerActive ? 10.5 : 9}
                  fontWeight={700}
                  fontFamily='"JetBrains Mono", monospace'
                >
                  {fingerNum}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (!leftHandState && !rightHandState) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none relative w-full h-20 sm:h-24 overflow-visible z-30 select-none ${className}`}
      aria-label="Overhead Hand and Finger Position Guide"
    >
      {leftHandState && renderHandArchSvg(leftHandState)}
      {rightHandState && renderHandArchSvg(rightHandState)}
    </div>
  );
};

export default OverheadHandGuide;
