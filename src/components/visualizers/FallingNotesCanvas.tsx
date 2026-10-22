import React, { useEffect, useRef } from 'react';
import type {
  Hand,
  NoteEvaluationStatus,
  ScoreData,
} from '../../types';
import { getKeyGeometry, getWhiteKeyboardKeys } from '../../utils/keyboardLayout';

export const LOOKAHEAD_BEATS = 6.0;

export interface FallingNotesCanvasProps {
  score: ScoreData;
  currentBeat: number;
  noteStatuses?: Record<string, NoteEvaluationStatus>;
  currentlyHeldMidis?: number[];
  activeTargetMidis?: number[];
  hintedMidis?: number[];
  wrongPlayedMidis?: number[];
  handFilter?: Hand;
  loopRange?: [number, number] | null;
  showNoteNames?: boolean;
  showFingerNumbers?: boolean;
  className?: string;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const FallingNotesCanvas: React.FC<FallingNotesCanvasProps> = ({
  score,
  currentBeat,
  noteStatuses = {},
  currentlyHeldMidis = [],
  activeTargetMidis = [],
  hintedMidis = [],
  wrongPlayedMidis = [],
  handFilter = 'both',
  loopRange = null,
  showNoteNames = true,
  showFingerNumbers = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 800,
    height: 260,
    dpr: 1,
  });

  // Setup ResizeObserver for crisp Retina/4K DPI scaling
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      sizeRef.current = { width, height, dpr };
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Render canvas whenever props update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: W, height: H, dpr } = sizeRef.current;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Background Ebony Void gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#090B0F');
    bgGrad.addColorStop(0.85, '#0D0F14');
    bgGrad.addColorStop(1, '#141822');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Vertical Piano Key Lane Guides (aligned with 21 white keys)
    const whiteKeys = getWhiteKeyboardKeys();
    for (const wk of whiteKeys) {
      const leftX = (wk.leftPct / 100) * W;
      const isOctaveC = wk.pitchClass === 0;
      const isMiddleC = wk.midi === 60;

      if (isMiddleC) {
        // Subtle warm brass column highlight for Middle C lane
        const kw = (wk.widthPct / 100) * W;
        ctx.fillStyle = 'rgba(229, 169, 60, 0.035)';
        ctx.fillRect(leftX, 0, kw, H);
      }

      ctx.beginPath();
      ctx.moveTo(leftX, 0);
      ctx.lineTo(leftX, H);
      ctx.strokeStyle = isMiddleC
        ? 'rgba(229, 169, 60, 0.22)'
        : isOctaveC
        ? 'rgba(245, 242, 235, 0.11)'
        : 'rgba(245, 242, 235, 0.035)';
      ctx.lineWidth = isOctaveC ? 1 : 0.75;
      ctx.stroke();
    }

    // 3. Horizontal Beat & Measure Grid Lines
    const beatsPerMeasure = score.timeSignature[0] || 4;
    const minBeat = Math.max(0, Math.floor(currentBeat - 1));
    const maxBeat = Math.min(
      score.totalBeats + beatsPerMeasure,
      Math.ceil(currentBeat + LOOKAHEAD_BEATS + 1)
    );

    for (let b = minBeat; b <= maxBeat; b++) {
      const y = H * (1 - (b - currentBeat) / LOOKAHEAD_BEATS);
      if (y < -20 || y > H + 20) continue;

      const isMeasureStart = b % beatsPerMeasure === 0;
      const measureIdx = Math.floor(b / beatsPerMeasure);

      const isLoopBoundary =
        loopRange !== null &&
        isMeasureStart &&
        (measureIdx === loopRange[0] || measureIdx === loopRange[1] + 1);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);

      if (isLoopBoundary) {
        ctx.strokeStyle = 'rgba(229, 169, 60, 0.75)';
        ctx.lineWidth = 1.75;
        ctx.setLineDash([6, 4]);
      } else if (isMeasureStart) {
        ctx.strokeStyle = 'rgba(245, 242, 235, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(245, 242, 235, 0.045)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Measure label on the left margin
      if (isMeasureStart && measureIdx < score.totalMeasures) {
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = isLoopBoundary
          ? '#E5A93C'
          : 'rgba(184, 178, 166, 0.55)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`BAR ${measureIdx + 1}`, 10, y - 4);
      }
    }

    // 4. Falling Note Bars
    const heldSet = new Set(currentlyHeldMidis);
    const targetSet = new Set(activeTargetMidis);
    const hintSet = new Set(hintedMidis);
    const wrongSet = new Set(wrongPlayedMidis);

    for (const note of score.notes) {
      const noteEndBeat = note.beatStart + note.durationBeats;
      // Skip notes completely out of vertical viewport
      if (
        noteEndBeat < currentBeat - 0.6 ||
        note.beatStart > currentBeat + LOOKAHEAD_BEATS + 0.5
      ) {
        continue;
      }

      const isFilteredOut =
        handFilter !== 'both' && note.hand !== handFilter;

      const geom = getKeyGeometry(note.midi);
      const rawX = (geom.leftPct / 100) * W;
      const rawW = (geom.widthPct / 100) * W;
      const padX = geom.isBlack ? 1.5 : 3;
      const barX = rawX + padX;
      const barW = Math.max(10, rawW - padX * 2);

      const yBottom =
        H * (1 - (note.beatStart - currentBeat) / LOOKAHEAD_BEATS);
      const yTop =
        H *
        (1 -
          (note.beatStart + note.durationBeats - currentBeat) /
            LOOKAHEAD_BEATS);

      // Leave a tiny 3px visual gap at the top of each bar so consecutive repeated notes are clearly distinct
      const clampedBottom = Math.min(H + 14, yBottom);
      const rawBarHeight = Math.max(18, clampedBottom - yTop - 3);
      const barY = clampedBottom - rawBarHeight;

      const status: NoteEvaluationStatus =
        noteStatuses[note.id] ?? 'upcoming';

      const isCurrentTarget =
        status === 'active_target' ||
        (targetSet.has(note.midi) &&
          Math.abs(note.beatStart - currentBeat) < 0.45);
      const isHinted =
        status === 'hint_active' ||
        (isCurrentTarget && hintSet.has(note.midi));

      // Determine bar palette based on evaluation state & hand assignment
      let fillTop = note.hand === 'left' ? '#818CF8' : '#38BDF8';
      let fillBottom = note.hand === 'left' ? '#6366F1' : '#0284C7';
      let borderStroke = note.hand === 'left' ? '#C7D2FE' : '#BAE6FD';
      let glowColor = 'rgba(56, 189, 248, 0.0)';

      if (status === 'correct_first_try') {
        fillTop = '#34D399';
        fillBottom = '#10B981';
        borderStroke = '#A7F3D0';
        glowColor = 'rgba(16, 185, 129, 0.45)';
      } else if (status === 'correct_after_hint' || isHinted) {
        fillTop = '#FBBF24';
        fillBottom = '#F59E0B';
        borderStroke = '#FDE68A';
        glowColor = 'rgba(245, 158, 11, 0.55)';
      } else if (status === 'wrong_pitch' || status === 'missed') {
        fillTop = '#FB7185';
        fillBottom = '#F43F5E';
        borderStroke = '#FECDD3';
        glowColor = 'rgba(244, 63, 94, 0.5)';
      } else if (isCurrentTarget) {
        fillTop = note.hand === 'left' ? '#A5B4FC' : '#7DD3FC';
        fillBottom = note.hand === 'left' ? '#6366F1' : '#0284C7';
        borderStroke = '#E5A93C';
        glowColor =
          note.hand === 'left'
            ? 'rgba(129, 140, 248, 0.5)'
            : 'rgba(56, 189, 248, 0.55)';
      }

      ctx.save();
      if (isFilteredOut) {
        ctx.globalAlpha = 0.22;
      }

      if (glowColor !== 'rgba(56, 189, 248, 0.0)' && !isFilteredOut) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
      }

      const barGrad = ctx.createLinearGradient(0, barY, 0, barY + rawBarHeight);
      barGrad.addColorStop(0, fillTop);
      barGrad.addColorStop(1, fillBottom);

      drawRoundedRect(ctx, barX, barY, barW, rawBarHeight, 7);
      ctx.fillStyle = barGrad;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.lineWidth = isCurrentTarget || isHinted ? 1.8 : 1;
      ctx.strokeStyle = borderStroke;
      ctx.stroke();

      // Chord Symbol badge above bar if present
      if (note.chordSymbol && !isFilteredOut) {
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#E5A93C';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(note.chordSymbol, barX + barW / 2, barY - 4);
      }

      // Render Finger Number Badge + Note Name inside the leading (bottom) edge of the bar
      const centerX = barX + barW / 2;
      const bottomAnchorY = Math.min(H - 6, barY + rawBarHeight - 5);

      if (showFingerNumbers && rawBarHeight >= 22) {
        const badgeRadius = Math.min(8.5, Math.max(6.5, barW * 0.28));
        const badgeY = bottomAnchorY - badgeRadius;

        ctx.beginPath();
        ctx.arc(centerX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(9, 11, 15, 0.78)';
        ctx.fill();

        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#F5F2EB';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(note.finger), centerX, badgeY + 0.5);

        if (showNoteNames && rawBarHeight >= 40) {
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#090B0F';
          ctx.textBaseline = 'bottom';
          ctx.fillText(
            note.noteName,
            centerX,
            badgeY - badgeRadius - 3
          );
        }
      } else if (showNoteNames && rawBarHeight >= 18) {
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#090B0F';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.noteName, centerX, barY + rawBarHeight / 2);
      }

      ctx.restore();
    }

    // 5. Luminous Key-Strike Glow at Bottom Hit Line (y = H)
    const activeGlowMidis = new Set<number>([
      ...currentlyHeldMidis,
      ...activeTargetMidis,
      ...hintedMidis,
      ...wrongPlayedMidis,
    ]);

    for (const midi of activeGlowMidis) {
      const geom = getKeyGeometry(midi);
      const centerX = (geom.centerPct / 100) * W;
      const keyW = (geom.widthPct / 100) * W;

      const isHeld = heldSet.has(midi);
      const isTarget = targetSet.has(midi);
      const isHint = hintSet.has(midi);
      const isWrong = wrongSet.has(midi);

      let colorRgb = '100, 116, 139'; // Ghost slate
      let radius = keyW * 0.9;

      if (isHeld && (isTarget || isHint)) {
        colorRgb = '16, 185, 129'; // Emerald burst
        radius = keyW * 1.45;
      } else if (isWrong) {
        colorRgb = '244, 63, 94'; // Coral burst
        radius = keyW * 1.3;
      } else if (isHint) {
        colorRgb = '245, 158, 11'; // Amber hint glow
        radius = keyW * 1.25;
      } else if (isTarget) {
        colorRgb = '56, 189, 248'; // Sky target glow
        radius = keyW * 1.1;
      }

      const radial = ctx.createRadialGradient(
        centerX,
        H,
        2,
        centerX,
        H,
        Math.max(16, radius)
      );
      radial.addColorStop(0, `rgba(${colorRgb}, 0.85)`);
      radial.addColorStop(0.5, `rgba(${colorRgb}, 0.32)`);
      radial.addColorStop(1, `rgba(${colorRgb}, 0.0)`);

      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(centerX, H, Math.max(16, radius), Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Subtle Brass Hit-Line Rule at y = H - 1
    ctx.beginPath();
    ctx.moveTo(0, H - 1);
    ctx.lineTo(W, H - 1);
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [
    score,
    currentBeat,
    noteStatuses,
    currentlyHeldMidis,
    activeTargetMidis,
    hintedMidis,
    wrongPlayedMidis,
    handFilter,
    loopRange,
    showNoteNames,
    showFingerNumbers,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[140px] bg-[#090B0F] overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        aria-label="Falling Notes Cascade Visualizer"
      />
    </div>
  );
};

export default FallingNotesCanvas;
