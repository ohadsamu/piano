import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Repeat, Sun, Moon } from 'lucide-react';
import type {
  Clef,
  Hand,
  NoteEvaluationStatus,
  ScoreData,
  ScoreNoteEvent,
} from '../../types';
import {
  inferClefForMidi,
  isBlackKey,
  midiToDiatonicStepFromMiddleC,
} from '../../utils/midiUtils';

export interface GrandStaffViewProps {
  score: ScoreData;
  currentBeat: number;
  noteStatuses?: Record<string, NoteEvaluationStatus>;
  activeTargetMidis?: number[];
  hintedMidis?: number[];
  handFilter?: Hand;
  loopRange?: [number, number] | null;
  troubleMeasures?: number[];
  showNoteNames?: boolean;
  showFingerNumbers?: boolean;
  defaultTheme?: 'stage' | 'parchment';
  onSelectMeasure?: (measureIndex: number) => void;
  onFixMeasure?: (measureIndex: number) => void;
  className?: string;
}

const STEP_HALF_SPACE = 5.5; // 11px between adjacent staff lines
const TREBLE_BOTTOM_LINE_Y = 104; // d = +2 (E4)
const BASS_TOP_LINE_Y = 158; // d = -2 (A3)
const STAFF_LEFT_HEADER_WIDTH = 104;
const MEASURE_WIDTH = 228;
const SVG_HEIGHT = 236;

function getNoteY(dStep: number, clef: Clef): number {
  if (clef === 'treble') {
    return TREBLE_BOTTOM_LINE_Y - (dStep - 2) * STEP_HALF_SPACE;
  }
  return BASS_TOP_LINE_Y - (dStep + 2) * STEP_HALF_SPACE;
}

function getLedgerLineYs(dStep: number, clef: Clef): number[] {
  const ys: number[] = [];
  if (clef === 'treble') {
    if (dStep <= 0) {
      for (let s = 0; s >= dStep; s -= 2) {
        ys.push(getNoteY(s, 'treble'));
      }
    } else if (dStep >= 12) {
      for (let s = 12; s <= dStep; s += 2) {
        ys.push(getNoteY(s, 'treble'));
      }
    }
  } else {
    if (dStep >= 0) {
      for (let s = 0; s <= dStep; s += 2) {
        ys.push(getNoteY(s, 'bass'));
      }
    } else if (dStep <= -12) {
      for (let s = -12; s >= dStep; s -= 2) {
        ys.push(getNoteY(s, 'bass'));
      }
    }
  }
  return ys;
}

export const GrandStaffView: React.FC<GrandStaffViewProps> = ({
  score,
  currentBeat,
  noteStatuses = {},
  activeTargetMidis = [],
  hintedMidis = [],
  handFilter = 'both',
  loopRange = null,
  troubleMeasures = [],
  showNoteNames = true,
  showFingerNumbers = true,
  defaultTheme = 'stage',
  onSelectMeasure,
  onFixMeasure,
  className = '',
}) => {
  const [theme, setTheme] = useState<'stage' | 'parchment'>(defaultTheme);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const beatsPerMeasure = score.timeSignature[0] || 4;
  const totalMeasures = Math.max(
    score.totalMeasures,
    Math.ceil(score.totalBeats / beatsPerMeasure)
  );
  const totalWidth =
    STAFF_LEFT_HEADER_WIDTH + totalMeasures * MEASURE_WIDTH + 48;

  const playheadX = useMemo(() => {
    const clampedBeat = Math.max(0, Math.min(score.totalBeats, currentBeat));
    const measureFloat = clampedBeat / beatsPerMeasure;
    // Leave 24px padding at start of each measure so beat 0 isn't flush on barline
    const measureIdx = Math.floor(measureFloat);
    const beatFraction = measureFloat - measureIdx;
    const innerWidth = MEASURE_WIDTH - 32;
    return (
      STAFF_LEFT_HEADER_WIDTH +
      measureIdx * MEASURE_WIDTH +
      20 +
      beatFraction * innerWidth
    );
  }, [currentBeat, beatsPerMeasure, score.totalBeats]);

  // Smoothly auto-scroll horizontal container to keep playhead in view
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const viewWidth = container.clientWidth;
    if (viewWidth <= 0) return;

    const targetScrollLeft = Math.max(0, playheadX - viewWidth * 0.38);
    const diff = Math.abs(container.scrollLeft - targetScrollLeft);
    if (diff > viewWidth * 0.22 || playheadX < container.scrollLeft + 60) {
      container.scrollTo({
        left: targetScrollLeft,
        behavior: diff > viewWidth ? 'auto' : 'smooth',
      });
    }
  }, [playheadX]);

  const isParchment = theme === 'parchment';
  const bgSurface = isParchment ? '#FAF6EE' : '#12151E';
  const staffLineColor = isParchment
    ? 'rgba(24, 24, 27, 0.34)'
    : 'rgba(234, 227, 210, 0.28)';
  const defaultInk = isParchment ? '#18181B' : '#F5F0E6';
  const mutedText = isParchment ? '#52525B' : '#7D8494';

  const trebleLineSteps = [2, 4, 6, 8, 10]; // E4, G4, B4, D5, F5
  const bassLineSteps = [-2, -4, -6, -8, -10]; // A3, F3, D3, B2, G2

  const troubleSet = useMemo(() => new Set(troubleMeasures), [troubleMeasures]);
  const targetSet = useMemo(
    () => new Set(activeTargetMidis),
    [activeTargetMidis]
  );
  const hintSet = useMemo(() => new Set(hintedMidis), [hintedMidis]);

  // Compute X coordinate for a beat position inside its measure
  const getBeatX = (beatStart: number): number => {
    const measureIdx = Math.floor(beatStart / beatsPerMeasure);
    const beatInMeasure = beatStart - measureIdx * beatsPerMeasure;
    const innerWidth = MEASURE_WIDTH - 32;
    return (
      STAFF_LEFT_HEADER_WIDTH +
      measureIdx * MEASURE_WIDTH +
      20 +
      (beatInMeasure / beatsPerMeasure) * innerWidth
    );
  };

  return (
    <div
      className={`relative w-full flex flex-col border-b border-white/10 select-none overflow-hidden transition-colors duration-200 ${className}`}
      style={{ backgroundColor: bgSurface }}
    >
      {/* Top Engraving Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-b text-xs"
        style={{
          borderColor: isParchment
            ? 'rgba(24, 24, 27, 0.1)'
            : 'rgba(245, 242, 235, 0.08)',
          backgroundColor: isParchment
            ? 'rgba(230, 224, 212, 0.45)'
            : 'rgba(13, 15, 20, 0.65)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-editorial font-semibold tracking-tight text-sm"
            style={{ color: defaultInk }}
          >
            {score.title}
          </span>
          <span
            className="font-tabular text-[11px] px-2 py-0.5 rounded border"
            style={{
              color: isParchment ? '#78350F' : '#E5A93C',
              borderColor: 'rgba(229, 169, 60, 0.35)',
              backgroundColor: 'rgba(229, 169, 60, 0.1)',
            }}
          >
            {score.timeSignature[0]}/{score.timeSignature[1]} · Key of{' '}
            {score.keySignature} · {score.bpm} BPM
          </span>
          {loopRange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E5A93C]/20 text-[#E5A93C] font-tabular text-[11px] font-semibold">
              <Repeat className="w-3 h-3" />
              Looping Bars {loopRange[0] + 1}–{loopRange[1] + 1}
            </span>
          )}
          {troubleMeasures.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const firstTrouble = troubleMeasures[0];
                if (onFixMeasure) {
                  onFixMeasure(firstTrouble);
                } else {
                  onSelectMeasure?.(firstTrouble);
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F43F5E]/20 hover:bg-[#F43F5E]/30 border border-[#F43F5E]/50 text-[#F43F5E] font-tabular text-[11px] font-semibold transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>
                Fix Bar{troubleMeasures.length > 1 ? 's' : ''}{' '}
                {troubleMeasures.map((m) => m + 1).join(', ')}
              </span>
            </button>
          )}
        </div>

        {/* Legend & Urtext/Stage Theme Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 text-[11px]">
            <span className="inline-flex items-center gap-1" style={{ color: mutedText }}>
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> First-Try
            </span>
            <span className="inline-flex items-center gap-1" style={{ color: mutedText }}>
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Hinted
            </span>
            <span className="inline-flex items-center gap-1" style={{ color: mutedText }}>
              <span className="w-2 h-2 rounded-full bg-[#F43F5E]" /> Slip
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === 'stage' ? 'parchment' : 'stage'))
            }
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors"
            style={{
              color: defaultInk,
              borderColor: isParchment
                ? 'rgba(24,24,27,0.2)'
                : 'rgba(245,242,235,0.16)',
              backgroundColor: isParchment
                ? 'rgba(24,24,27,0.05)'
                : 'rgba(255,255,255,0.05)',
            }}
            title="Switch between Conservatory Dark Stage and Henle Urtext Parchment"
          >
            {isParchment ? (
              <>
                <Moon className="w-3 h-3 text-[#78350F]" />
                <span>Stage Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3 h-3 text-[#E5A93C]" />
                <span>Urtext Ivory</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Grand Staff SVG */}
      <div
        ref={scrollContainerRef}
        className="relative w-full overflow-x-auto overflow-y-hidden"
      >
        <svg
          width={totalWidth}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${totalWidth} ${SVG_HEIGHT}`}
          className="block"
          role="img"
          aria-label={`Grand Staff musical notation for ${score.title}`}
        >
          <defs>
            <linearGradient id="playheadGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(229, 169, 60, 0.0)" />
              <stop offset="50%" stopColor="rgba(229, 169, 60, 0.26)" />
              <stop offset="100%" stopColor="rgba(229, 169, 60, 0.0)" />
            </linearGradient>
          </defs>

          {/* 1. Measure Backgrounds, Loop Highlight, and Trouble Measure Badges */}
          {Array.from({ length: totalMeasures }).map((_, mIdx) => {
            const mX = STAFF_LEFT_HEADER_WIDTH + mIdx * MEASURE_WIDTH;
            const currentMeasureIdx = Math.floor(currentBeat / beatsPerMeasure);
            const isCurrentMeasure = mIdx === currentMeasureIdx;
            const isInLoop =
              loopRange !== null &&
              mIdx >= loopRange[0] &&
              mIdx <= loopRange[1];
            const isTrouble = troubleSet.has(mIdx);

            return (
              <g key={`measure-bg-${mIdx}`}>
                {/* Active or Loop Measure Tint */}
                {(isCurrentMeasure || isInLoop || isTrouble) && (
                  <rect
                    x={mX}
                    y={32}
                    width={MEASURE_WIDTH}
                    height={182}
                    rx={4}
                    fill={
                      isTrouble
                        ? 'rgba(244, 63, 94, 0.07)'
                        : isInLoop
                        ? 'rgba(229, 169, 60, 0.09)'
                        : isParchment
                        ? 'rgba(229, 169, 60, 0.08)'
                        : 'rgba(56, 189, 248, 0.04)'
                    }
                    className="cursor-pointer"
                    onClick={() => onSelectMeasure?.(mIdx)}
                  />
                )}

                {/* Measure Number Header */}
                <text
                  x={mX + 8}
                  y={46}
                  fill={isCurrentMeasure ? '#E5A93C' : mutedText}
                  fontSize={10}
                  fontWeight={700}
                  fontFamily='"JetBrains Mono", monospace'
                  className="cursor-pointer"
                  onClick={() => onSelectMeasure?.(mIdx)}
                >
                  BAR {mIdx + 1}
                </text>

                {/* Trouble Measure Action Pill ("! Fix Bar N") */}
                {isTrouble && (
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onFixMeasure) {
                        onFixMeasure(mIdx);
                      } else {
                        onSelectMeasure?.(mIdx);
                      }
                    }}
                  >
                    <rect
                      x={mX + MEASURE_WIDTH - 84}
                      y={33}
                      width={76}
                      height={18}
                      rx={9}
                      fill="#F43F5E"
                    />
                    <text
                      x={mX + MEASURE_WIDTH - 46}
                      y={45}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={9.5}
                      fontWeight={700}
                      fontFamily='"Plus Jakarta Sans", sans-serif'
                    >
                      ! Fix Bar {mIdx + 1}
                    </text>
                  </g>
                )}

                {/* Measure Barline (Right Edge) */}
                <line
                  x1={mX + MEASURE_WIDTH}
                  y1={getNoteY(10, 'treble')}
                  x2={mX + MEASURE_WIDTH}
                  y2={getNoteY(-10, 'bass')}
                  stroke={
                    isInLoop
                      ? '#E5A93C'
                      : isParchment
                      ? 'rgba(24, 24, 27, 0.35)'
                      : 'rgba(234, 227, 210, 0.28)'
                  }
                  strokeWidth={mIdx === totalMeasures - 1 ? 2.5 : 1.2}
                />
                {/* Final Double Barline */}
                {mIdx === totalMeasures - 1 && (
                  <line
                    x1={mX + MEASURE_WIDTH - 5}
                    y1={getNoteY(10, 'treble')}
                    x2={mX + MEASURE_WIDTH - 5}
                    y2={getNoteY(-10, 'bass')}
                    stroke={defaultInk}
                    strokeWidth={1.2}
                  />
                )}
              </g>
            );
          })}

          {/* 2. Five Treble Staff Lines & Five Bass Staff Lines */}
          {trebleLineSteps.map((step) => {
            const y = getNoteY(step, 'treble');
            return (
              <line
                key={`treble-line-${step}`}
                x1={20}
                y1={y}
                x2={totalWidth - 24}
                y2={y}
                stroke={staffLineColor}
                strokeWidth={1.15}
              />
            );
          })}

          {bassLineSteps.map((step) => {
            const y = getNoteY(step, 'bass');
            return (
              <line
                key={`bass-line-${step}`}
                x1={20}
                y1={y}
                x2={totalWidth - 24}
                y2={y}
                stroke={staffLineColor}
                strokeWidth={1.15}
              />
            );
          })}

          {/* 3. Grand Staff Left System Barline, Curly Brace, Clefs & Time Signature */}
          <line
            x1={20}
            y1={getNoteY(10, 'treble')}
            x2={20}
            y2={getNoteY(-10, 'bass')}
            stroke={defaultInk}
            strokeWidth={2}
          />
          {/* Grand Staff Brace Path */}
          <path
            d={`M 18 ${getNoteY(10, 'treble')} C 8 ${
              getNoteY(10, 'treble') + 18
            }, 16 122, 8 131 C 16 140, 8 ${
              getNoteY(-10, 'bass') - 18
            }, 18 ${getNoteY(-10, 'bass')}`}
            fill="none"
            stroke={defaultInk}
            strokeWidth={2.2}
          />

          {/* Treble Clef Symbol (𝄞) & RH Label */}
          <text
            x={30}
            y={98}
            fill={defaultInk}
            fontSize={44}
            fontFamily="serif"
          >
            𝄞
          </text>
          <text
            x={32}
            y={53}
            fill="#38BDF8"
            fontSize={9}
            fontWeight={700}
            fontFamily='"JetBrains Mono", monospace'
          >
            RH · TREBLE
          </text>

          {/* Bass Clef Symbol (𝄢) & LH Label */}
          <text
            x={30}
            y={192}
            fill={defaultInk}
            fontSize={36}
            fontFamily="serif"
          >
            𝄢
          </text>
          <text
            x={32}
            y={218}
            fill="#818CF8"
            fontSize={9}
            fontWeight={700}
            fontFamily='"JetBrains Mono", monospace'
          >
            LH · BASS
          </text>

          {/* Time Signature on Both Staves */}
          <g
            fontFamily='"Fraunces", Georgia, serif'
            fontWeight={700}
            fontSize={20}
            fill={defaultInk}
            textAnchor="middle"
          >
            {/* Treble Time Sig */}
            <text x={82} y={79}>
              {score.timeSignature[0]}
            </text>
            <text x={82} y={101}>
              {score.timeSignature[1]}
            </text>
            {/* Bass Time Sig */}
            <text x={82} y={175}>
              {score.timeSignature[0]}
            </text>
            <text x={82} y={197}>
              {score.timeSignature[1]}
            </text>
          </g>

          {/* Header Separator Barline */}
          <line
            x1={STAFF_LEFT_HEADER_WIDTH}
            y1={getNoteY(10, 'treble')}
            x2={STAFF_LEFT_HEADER_WIDTH}
            y2={getNoteY(-10, 'bass')}
            stroke={staffLineColor}
            strokeWidth={1.2}
          />

          {/* 4. Render All Score Note Events */}
          {score.notes.map((note: ScoreNoteEvent) => {
            const clef: Clef = note.clef || inferClefForMidi(note.midi, note.hand);
            const dStep = midiToDiatonicStepFromMiddleC(note.midi);
            const cx = getBeatX(note.beatStart);
            const cy = getNoteY(dStep, clef);
            const ledgerYs = getLedgerLineYs(dStep, clef);
            const sharp = isBlackKey(note.midi);

            // Determine chord sibling index on same beat & clef so note-name pills and finger numbers never collide
            const chordSiblings = score.notes
              .filter(
                (other) =>
                  Math.abs(other.beatStart - note.beatStart) < 0.04 &&
                  (other.clef || inferClefForMidi(other.midi, other.hand)) === clef
              )
              .sort((a, b) => a.midi - b.midi);
            const chordIdx = Math.max(0, chordSiblings.findIndex((s) => s.id === note.id));
            const isTopOfChord = chordIdx === chordSiblings.length - 1;
            const isBottomOfChord = chordIdx === 0;
            const isDotted =
              Math.abs(note.durationBeats - 1.5) < 0.05 ||
              Math.abs(note.durationBeats - 3.0) < 0.05;
            const isFilteredOut =
              handFilter !== 'both' && note.hand !== handFilter;

            const status: NoteEvaluationStatus =
              noteStatuses[note.id] ?? 'upcoming';
            const isTarget =
              status === 'active_target' ||
              (targetSet.has(note.midi) &&
                Math.abs(note.beatStart - currentBeat) < 0.45);
            const isHint =
              status === 'hint_active' ||
              (isTarget && hintSet.has(note.midi));

            let noteColor = defaultInk;
            if (status === 'correct_first_try') {
              noteColor = '#10B981'; // Emerald
            } else if (status === 'correct_after_hint' || isHint) {
              noteColor = '#F59E0B'; // Amber
            } else if (status === 'wrong_pitch' || status === 'missed') {
              noteColor = '#F43F5E'; // Coral
            } else if (isTarget) {
              noteColor = '#E5A93C'; // Brass active pulse
            } else if (note.hand === 'left') {
              noteColor = isParchment ? '#3730A3' : '#A5B4FC';
            } else {
              noteColor = isParchment ? '#18181B' : '#F5F0E6';
            }

            const isHollow =
              note.durationType === 'whole' || note.durationType === 'half';
            const hasStem = note.durationType !== 'whole';
            const hasFlag = note.durationType === 'eighth';

            // Stem direction rule
            const stemDown =
              clef === 'treble' ? dStep >= 6 : dStep >= -6;
            const stemX = stemDown ? cx - 6 : cx + 6;
            const stemY2 = stemDown ? cy + 30 : cy - 30;

            return (
              <g
                key={note.id}
                opacity={isFilteredOut ? 0.25 : 1}
              >
                {/* Chord Symbol Above Staff */}
                {note.chordSymbol && (
                  <text
                    x={cx}
                    y={26}
                    textAnchor="middle"
                    fill="#E5A93C"
                    fontSize={12}
                    fontWeight={700}
                    fontFamily='"Plus Jakarta Sans", sans-serif'
                  >
                    {note.chordSymbol}
                  </text>
                )}

                {/* Active Target Halo */}
                {(isTarget || isHint) && !isFilteredOut && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={13}
                    fill={
                      isHint
                        ? 'rgba(245, 158, 11, 0.24)'
                        : 'rgba(229, 169, 60, 0.22)'
                    }
                    stroke={isHint ? '#F59E0B' : '#E5A93C'}
                    strokeWidth={1.2}
                  />
                )}

                {/* Ledger Lines (Middle C4, A5, Low Bass, etc.) */}
                {ledgerYs.map((ly, idx) => (
                  <line
                    key={`${note.id}-ledger-${idx}`}
                    x1={cx - 12}
                    y1={ly}
                    x2={cx + 12}
                    y2={ly}
                    stroke={
                      isTarget || isHint
                        ? noteColor
                        : isParchment
                        ? '#18181B'
                        : '#EAE3D2'
                    }
                    strokeWidth={1.6}
                  />
                ))}

                {/* Sharp (#) Accidental if Black Key */}
                {sharp && (
                  <text
                    x={cx - 14}
                    y={cy + 4.5}
                    fill={noteColor}
                    fontSize={14}
                    fontWeight={700}
                    fontFamily="serif"
                  >
                    ♯
                  </text>
                )}

                {/* Note Stem */}
                {hasStem && (
                  <line
                    x1={stemX}
                    y1={cy}
                    x2={stemX}
                    y2={stemY2}
                    stroke={noteColor}
                    strokeWidth={1.8}
                  />
                )}

                {/* Eighth Note Flag */}
                {hasFlag && (
                  <path
                    d={
                      stemDown
                        ? `M ${stemX} ${stemY2} Q ${stemX + 9} ${
                            stemY2 + 6
                          }, ${stemX + 7} ${stemY2 + 15}`
                        : `M ${stemX} ${stemY2} Q ${stemX + 9} ${
                            stemY2 + 6
                          }, ${stemX + 7} ${stemY2 + 15}`
                    }
                    fill="none"
                    stroke={noteColor}
                    strokeWidth={2}
                  />
                )}

                {/* Engraved Elliptical Notehead */}
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={6.8}
                  ry={4.8}
                  transform={`rotate(-18 ${cx} ${cy})`}
                  fill={isHollow ? bgSurface : noteColor}
                  stroke={noteColor}
                  strokeWidth={isHollow ? 2.2 : 1.2}
                />
                {/* Augmentation Dot for Dotted Quarter / Dotted Half Notes */}
                {isDotted && (
                  <circle
                    cx={cx + 10.5}
                    cy={cy - 2}
                    r={2.1}
                    fill={noteColor}
                  />
                )}

                {/* Finger Number Badge (1–5) */}
                {showFingerNumbers && (
                  <text
                    x={
                      chordSiblings.length > 1
                        ? cx - 14
                        : cx
                    }
                    y={
                      chordSiblings.length > 1
                        ? cy + 3.5
                        : clef === 'treble'
                        ? cy - 12
                        : cy + 19
                    }
                    textAnchor="middle"
                    fill={
                      isTarget || isHint
                        ? '#E5A93C'
                        : note.hand === 'left'
                        ? '#818CF8'
                        : '#38BDF8'
                    }
                    fontSize={10}
                    fontWeight={700}
                    fontFamily='"JetBrains Mono", monospace'
                  >
                    {note.finger}
                  </text>
                )}

                {/* Beginner Note Name Pill below/beside note (stacked cleanly for chords) */}
                {showNoteNames && (
                  <g>
                    <rect
                      x={cx - 11 + (chordSiblings.length > 1 ? (chordIdx - (chordSiblings.length - 1) / 2) * 23 : 0)}
                      y={clef === 'treble' ? 124 : 210}
                      width={21}
                      height={13}
                      rx={3}
                      fill={
                        isTarget || isHint
                          ? '#E5A93C'
                          : isParchment
                          ? 'rgba(24,24,27,0.08)'
                          : 'rgba(30,34,48,0.92)'
                      }
                    />
                    <text
                      x={cx + (chordSiblings.length > 1 ? (chordIdx - (chordSiblings.length - 1) / 2) * 23 : 0)}
                      y={clef === 'treble' ? 133.5 : 219.5}
                      textAnchor="middle"
                      fill={
                        isTarget || isHint
                          ? '#090B0F'
                          : isParchment
                          ? '#18181B'
                          : '#F5F2EB'
                      }
                      fontSize={8.5}
                      fontWeight={700}
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {note.noteName}
                    </text>
                  </g>
                )}

                {/* Lyric / Solfege / Pedagogical Label if present */}
                {note.lyric && (clef === 'treble' ? isBottomOfChord : isTopOfChord) && (
                  <text
                    x={cx}
                    y={clef === 'treble' ? 147 : 231}
                    textAnchor="middle"
                    fill={mutedText}
                    fontSize={9}
                    fontStyle="italic"
                    fontFamily='"Plus Jakarta Sans", sans-serif'
                  >
                    {note.lyric}
                  </text>
                )}
              </g>
            );
          })}

          {/* 5. Smooth Moving Playhead Cursor */}
          <g transform={`translate(${playheadX}, 0)`}>
            <rect
              x={-14}
              y={32}
              width={28}
              height={182}
              fill="url(#playheadGlow)"
            />
            <line
              x1={0}
              y1={32}
              x2={0}
              y2={214}
              stroke="#E5A93C"
              strokeWidth={2}
            />
            <polygon points="-5,32 5,32 0,39" fill="#E5A93C" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default GrandStaffView;
