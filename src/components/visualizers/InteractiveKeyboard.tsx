import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crown, ArrowLeft, ArrowRight } from 'lucide-react';
import type {
  FingerNumber,
  LiveCorrectionFeedback,
  SingleHand,
} from '../../types';
import {
  getAllKeyboardKeys,
  getBlackKeyboardKeys,
  getKeyGeometry,
  getWhiteKeyboardKeys,
  type KeyGeometry,
} from '../../utils/keyboardLayout';
import { midiToNoteName } from '../../utils/midiUtils';

export interface TargetKeyAnnotation {
  midi: number;
  hand?: SingleHand;
  finger?: FingerNumber;
  noteName?: string;
}

export interface InteractiveKeyboardProps {
  /** Currently held/detected MIDI numbers */
  currentlyHeldMidis?: number[];
  /** Alias for currentlyHeldMidis */
  activeMidis?: number[];
  /** Expected target MIDI numbers */
  activeTargetMidis?: number[];
  /** Alias for activeTargetMidis */
  targetMidis?: number[];
  /** Rich target note objects (e.g. ScoreNoteEvent[] or TargetKeyAnnotation[]) providing hand & finger */
  targetNotes?: TargetKeyAnnotation[];
  /** Alias for targetNotes */
  activeTargetNotes?: TargetKeyAnnotation[];
  /** MIDI numbers in hint_active state (pulsing Amber) */
  hintedMidis?: number[];
  /** MIDI numbers struck erroneously (Error Coral with "Played" badge) */
  wrongPlayedMidis?: number[];
  /** Active directional correction feedback when a wrong key was struck */
  liveCorrection?: LiveCorrectionFeedback | null;
  /** Show scientific pitch name (C4, D4) on keys */
  showNoteNames?: boolean;
  /** Show Solfège syllables (Do, Re, Mi) on keys */
  showSolfege?: boolean;
  /** Show finger number badges (1-5) on target keys */
  showFingerNumbers?: boolean;
  /** Show computer keyboard shortcut badges ([Q], [W], etc.) */
  showQwertyLabels?: boolean;
  /** Compact height variant for mini keybed preview or video drawer */
  compact?: boolean;
  /** Triggered when a user presses a key via mouse or touch */
  onNoteOn?: (midi: number, velocity?: number) => void;
  /** Triggered when a user releases a key via mouse or touch */
  onNoteOff?: (midi: number) => void;
  className?: string;
}

export const InteractiveKeyboard: React.FC<InteractiveKeyboardProps> = ({
  currentlyHeldMidis,
  activeMidis,
  activeTargetMidis,
  targetMidis,
  targetNotes = [],
  activeTargetNotes = [],
  hintedMidis = [],
  wrongPlayedMidis = [],
  liveCorrection = null,
  showNoteNames = true,
  showSolfege = false,
  showFingerNumbers = true,
  showQwertyLabels = true,
  compact = false,
  onNoteOn,
  onNoteOff,
  className = '',
}) => {
  const isPointerDownRef = useRef(false);
  const activePointerMidiRef = useRef<number | null>(null);
  const [localPressedMidi, setLocalPressedMidi] = useState<number | null>(null);

  const whiteKeys = useMemo(() => getWhiteKeyboardKeys(), []);
  const blackKeys = useMemo(() => getBlackKeyboardKeys(), []);
  const allKeys = useMemo(() => getAllKeyboardKeys(), []);

  const heldSet = useMemo(() => {
    const list = currentlyHeldMidis ?? activeMidis ?? [];
    const set = new Set<number>(list);
    if (localPressedMidi !== null) {
      set.add(localPressedMidi);
    }
    return set;
  }, [currentlyHeldMidis, activeMidis, localPressedMidi]);

  const targetMap = useMemo(() => {
    const map = new Map<number, TargetKeyAnnotation>();
    const rawTargetMidis = activeTargetMidis ?? targetMidis ?? [];
    for (const midi of rawTargetMidis) {
      map.set(midi, { midi });
    }
    const combinedTargetNotes =
      targetNotes.length > 0 ? targetNotes : activeTargetNotes;
    for (const note of combinedTargetNotes) {
      map.set(note.midi, {
        midi: note.midi,
        hand: note.hand,
        finger: note.finger,
        noteName: note.noteName,
      });
    }
    if (liveCorrection?.expectedNote) {
      const exp = liveCorrection.expectedNote;
      map.set(exp.midi, {
        midi: exp.midi,
        hand: exp.hand,
        finger: exp.finger,
        noteName: exp.noteName,
      });
    }
    return map;
  }, [activeTargetMidis, targetMidis, targetNotes, activeTargetNotes, liveCorrection]);

  const hintSet = useMemo(() => {
    const set = new Set<number>(hintedMidis);
    if (liveCorrection?.expectedNote) {
      set.add(liveCorrection.expectedNote.midi);
    }
    return set;
  }, [hintedMidis, liveCorrection]);

  const wrongSet = useMemo(() => {
    const set = new Set<number>(wrongPlayedMidis);
    if (liveCorrection) {
      set.add(liveCorrection.playedMidi);
    }
    return set;
  }, [wrongPlayedMidis, liveCorrection]);

  // Determine directional correction pair (Wrong Played -> Target Hinted)
  const directionalGuide = useMemo(() => {
    if (liveCorrection) {
      const fromGeom = getKeyGeometry(liveCorrection.playedMidi);
      const toGeom = getKeyGeometry(liveCorrection.expectedNote.midi);
      return {
        playedMidi: liveCorrection.playedMidi,
        targetMidi: liveCorrection.expectedNote.midi,
        targetNoteName: liveCorrection.expectedNote.noteName,
        direction: liveCorrection.direction,
        fromCenterPct: fromGeom.centerPct,
        toCenterPct: toGeom.centerPct,
        finger: liveCorrection.expectedNote.finger,
        hand: liveCorrection.expectedNote.hand,
      };
    }

    if (wrongPlayedMidis.length > 0 && (hintedMidis.length > 0 || targetMap.size > 0)) {
      const playedMidi = wrongPlayedMidis[0];
      const targetMidi =
        hintedMidis[0] ?? Array.from(targetMap.keys())[0];
      if (playedMidi !== undefined && targetMidi !== undefined && playedMidi !== targetMidi) {
        const fromGeom = getKeyGeometry(playedMidi);
        const toGeom = getKeyGeometry(targetMidi);
        const targetInfo = targetMap.get(targetMidi);
        return {
          playedMidi,
          targetMidi,
          targetNoteName: midiToNoteName(targetMidi),
          direction: (targetMidi < playedMidi ? 'left' : 'right') as 'left' | 'right',
          fromCenterPct: fromGeom.centerPct,
          toCenterPct: toGeom.centerPct,
          finger: targetInfo?.finger,
          hand: targetInfo?.hand,
        };
      }
    }

    return null;
  }, [liveCorrection, wrongPlayedMidis, hintedMidis, targetMap]);

  const triggerNoteOn = useCallback(
    (midi: number) => {
      if (activePointerMidiRef.current === midi) return;
      if (activePointerMidiRef.current !== null) {
        onNoteOff?.(activePointerMidiRef.current);
      }
      activePointerMidiRef.current = midi;
      setLocalPressedMidi(midi);
      onNoteOn?.(midi, 0.82);
    },
    [onNoteOn, onNoteOff]
  );

  const releaseActivePointerNote = useCallback(() => {
    isPointerDownRef.current = false;
    if (activePointerMidiRef.current !== null) {
      const prev = activePointerMidiRef.current;
      activePointerMidiRef.current = null;
      setLocalPressedMidi(null);
      onNoteOff?.(prev);
    }
  }, [onNoteOff]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isPointerDownRef.current || activePointerMidiRef.current !== null) {
        releaseActivePointerNote();
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [releaseActivePointerNote]);

  const handleKeyPointerDown = (e: React.PointerEvent, midi: number) => {
    e.preventDefault();
    e.stopPropagation();
    isPointerDownRef.current = true;
    triggerNoteOn(midi);
  };

  const handleKeyPointerEnter = (e: React.PointerEvent, midi: number) => {
    if (!isPointerDownRef.current && e.buttons !== 1) return;
    triggerNoteOn(midi);
  };

  const handleKeyPointerLeave = (_e: React.PointerEvent, midi: number) => {
    if (isPointerDownRef.current && activePointerMidiRef.current === midi) {
      onNoteOff?.(midi);
      activePointerMidiRef.current = null;
      setLocalPressedMidi(null);
    }
  };

  const renderKeyState = (key: KeyGeometry) => {
    const isTarget = targetMap.has(key.midi);
    const targetInfo = targetMap.get(key.midi);
    const isHinted = hintSet.has(key.midi);
    const isWrong = wrongSet.has(key.midi);
    const isHeld = heldSet.has(key.midi);
    const isMatchedHit = isHeld && (isTarget || isHinted);
    const isGhostHeld = isHeld && !isTarget && !isHinted && !isWrong;
    const isMiddleC = key.midi === 60;
    const hand: SingleHand = targetInfo?.hand ?? (key.midi < 60 ? 'left' : 'right');
    const finger = targetInfo?.finger;

    return {
      isTarget,
      targetInfo,
      isHinted,
      isWrong,
      isHeld,
      isMatchedHit,
      isGhostHeld,
      isMiddleC,
      hand,
      finger,
    };
  };

  const heightClass = compact ? 'h-24 sm:h-28' : 'h-36 sm:h-40 md:h-44';

  return (
    <div
      className={`relative w-full select-none bg-[#090B0F] flex flex-col ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`Concert Grand Piano Keyboard (${allKeys.length} keys, C3 to B5)`}
    >
      {/* Signature 3px Scarlet Keybed Felt Strip (#9F1239) */}
      <div
        className="w-full h-[4px] shrink-0 relative z-20"
        style={{
          background:
            'linear-gradient(90deg, #881337 0%, #9F1239 50%, #881337 100%)',
          boxShadow: '0 2px 8px rgba(159, 18, 57, 0.65)',
        }}
      />

      {/* Directional Correction Overlay Bridge (when user struck a wrong note) */}
      {directionalGuide && !compact && (
        <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 z-30 overflow-visible">
          <div
            className="absolute top-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide shadow-lg border transition-all duration-150"
            style={{
              left: `${Math.min(
                88,
                Math.max(12, (directionalGuide.fromCenterPct + directionalGuide.toCenterPct) / 2)
              )}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(22, 25, 34, 0.95)',
              borderColor: '#F59E0B',
              color: '#F5F2EB',
            }}
          >
            {directionalGuide.direction === 'left' ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
                <span className="text-[#F59E0B] font-tabular">
                  ← Target {directionalGuide.targetNoteName}
                </span>
              </>
            ) : (
              <>
                <span className="text-[#F59E0B] font-tabular">
                  Target {directionalGuide.targetNoteName} →
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
              </>
            )}
            {directionalGuide.finger && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-tabular text-[10px]">
                Finger {directionalGuide.finger}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Keybed Container */}
      <div className={`relative w-full ${heightClass} bg-[#090B0F] overflow-hidden`}>
        {/* White Keys Layer */}
        {whiteKeys.map((key) => {
          const state = renderKeyState(key);

          // Base Ivory styling vs Active Pedagogical Colors
          let bgStyle =
            'linear-gradient(180deg, #FBF9F5 0%, #F4EFE6 88%, #E6E0D4 100%)';
          let borderColor = 'rgba(24, 26, 32, 0.22)';
          let boxShadow =
            'inset 0 -6px 0 #E6E0D4, 0 2px 4px rgba(0, 0, 0, 0.45)';
          let textColor = '#18181B';

          if (state.isMatchedHit) {
            // Live Detected & Matched Target -> Emerald (#10B981)
            bgStyle =
              'linear-gradient(180deg, #D1FAE5 0%, #34D399 45%, #10B981 100%)';
            borderColor = '#059669';
            boxShadow =
              'inset 0 -3px 0 #047857, 0 0 18px rgba(16, 185, 129, 0.65)';
            textColor = '#064E3B';
          } else if (state.isWrong) {
            // Wrong Key Played -> Error Coral (#F43F5E)
            bgStyle =
              'linear-gradient(180deg, #FFE4E6 0%, #FB7185 45%, #F43F5E 100%)';
            borderColor = '#E11D48';
            boxShadow =
              'inset 0 -3px 0 #BE123C, 0 0 16px rgba(244, 63, 94, 0.65)';
            textColor = '#881337';
          } else if (state.isHinted) {
            // Hinted Target Note -> Pulsing Amber (#F59E0B)
            bgStyle =
              'linear-gradient(180deg, #FEF3C7 0%, #FBBF24 45%, #F59E0B 100%)';
            borderColor = '#D97706';
            boxShadow =
              'inset 0 -5px 0 #B45309, 0 0 20px rgba(245, 158, 11, 0.7)';
            textColor = '#78350F';
          } else if (state.isTarget) {
            // Active Target Note -> Sky Blue (#38BDF8) for RH or Indigo (#818CF8) for LH
            if (state.hand === 'left') {
              bgStyle =
                'linear-gradient(180deg, #E0E7FF 0%, #A5B4FC 45%, #818CF8 100%)';
              borderColor = '#6366F1';
              boxShadow =
                'inset 0 -5px 0 #4F46E5, 0 0 16px rgba(129, 140, 248, 0.6)';
              textColor = '#1E1B4B';
            } else {
              bgStyle =
                'linear-gradient(180deg, #E0F2FE 0%, #7DD3FC 45%, #38BDF8 100%)';
              borderColor = '#0284C7';
              boxShadow =
                'inset 0 -5px 0 #0369A1, 0 0 16px rgba(56, 189, 248, 0.6)';
              textColor = '#0C4A6E';
            }
          } else if (state.isGhostHeld) {
            // Free-play / Ghost Detected Input -> Slate (#64748B)
            bgStyle =
              'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 55%, #64748B 100%)';
            borderColor = '#475569';
            boxShadow = 'inset 0 -2px 0 #334155';
            textColor = '#0F172A';
          }

          const isDepressed = state.isHeld || state.isWrong;

          return (
            <button
              key={key.midi}
              type="button"
              data-midi={key.midi}
              data-note={key.noteName}
              onPointerDown={(e) => handleKeyPointerDown(e, key.midi)}
              onPointerEnter={(e) => handleKeyPointerEnter(e, key.midi)}
              onPointerLeave={(e) => handleKeyPointerLeave(e, key.midi)}
              style={{
                left: `${key.leftPct}%`,
                width: `${key.widthPct}%`,
                background: bgStyle,
                borderColor,
                boxShadow,
                color: textColor,
                transform: isDepressed ? 'translateY(2px)' : 'translateY(0)',
              }}
              className={`absolute top-0 bottom-0 z-10 rounded-b-[5px] border-r border-b flex flex-col items-center justify-end pb-1.5 pt-2 transition-transform duration-75 focus:outline-none ${
                state.isHinted ? 'animate-pulse' : ''
              }`}
            >
              {/* Middle C Landmark Crown Badge */}
              {state.isMiddleC && !compact && (
                <div
                  className="mb-auto mt-1 flex flex-col items-center"
                  title="Middle C Landmark (C4)"
                >
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#E5A93C]/20 border border-[#E5A93C]/60 text-[#92400E] text-[9px] font-bold tracking-tight">
                    <Crown className="w-2.5 h-2.5 text-[#D97706] shrink-0" />
                    <span className="hidden md:inline">C4</span>
                  </span>
                </div>
              )}

              {/* Wrong Key "Played" Tag */}
              {state.isWrong && (
                <span className="mb-1 px-1 py-0.5 rounded bg-[#881337] text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
                  Played
                </span>
              )}

              {/* Directional Hint Tag on Target Key */}
              {state.isHinted && directionalGuide?.targetMidi === key.midi && !compact && (
                <span className="mb-1 px-1 py-0.5 rounded bg-[#78350F] text-[#FEF3C7] text-[9px] font-bold tracking-tight whitespace-nowrap shadow-sm">
                  {directionalGuide.direction === 'left'
                    ? `← ${key.noteName}`
                    : `${key.noteName} →`}
                </span>
              )}

              {/* Finger Number Badge (1-5) */}
              {showFingerNumbers && state.finger && (state.isTarget || state.isHinted) && (
                <span
                  className="mb-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-tabular text-[11px] sm:text-xs font-bold shadow-md border"
                  style={{
                    backgroundColor: state.isHinted
                      ? '#B45309'
                      : state.hand === 'left'
                      ? '#4338CA'
                      : '#0369A1',
                    borderColor: 'rgba(255,255,255,0.45)',
                    color: '#FFFFFF',
                  }}
                >
                  {state.finger}
                </span>
              )}

              {/* Solfège Syllable (Do, Re, Mi) */}
              {showSolfege && !compact && (
                <span className="text-[9px] font-semibold opacity-75 leading-none mb-0.5">
                  {key.solfege}
                </span>
              )}

              {/* Scientific Pitch Name (C4, D4, etc.) */}
              {showNoteNames && (
                <span
                  className={`font-tabular text-[10px] sm:text-[11px] font-bold leading-none ${
                    state.isMiddleC ? 'underline decoration-[#D97706] decoration-2' : ''
                  }`}
                >
                  {key.noteName}
                </span>
              )}

              {/* QWERTY Computer Keyboard Shortcut Badge */}
              {showQwertyLabels && key.qwertyLabel && !compact && (
                <span className="mt-1 px-1 py-[1px] rounded bg-black/10 text-[9px] font-tabular font-medium opacity-65 leading-none">
                  [{key.qwertyLabel}]
                </span>
              )}
            </button>
          );
        })}

        {/* Black Keys Layer */}
        {blackKeys.map((key) => {
          const state = renderKeyState(key);

          let bgStyle =
            'linear-gradient(180deg, #2C303C 0%, #181A20 75%, #0F1115 100%)';
          let borderColor = '#090B0F';
          let boxShadow =
            'inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -5px 0 #090B0F, 0 4px 6px rgba(0,0,0,0.65)';
          let textColor = '#F5F2EB';

          if (state.isMatchedHit) {
            bgStyle =
              'linear-gradient(180deg, #34D399 0%, #10B981 65%, #047857 100%)';
            borderColor = '#6EE7B7';
            boxShadow =
              'inset 0 -3px 0 #064E3B, 0 0 16px rgba(16, 185, 129, 0.75)';
          } else if (state.isWrong) {
            bgStyle =
              'linear-gradient(180deg, #FB7185 0%, #F43F5E 65%, #BE123C 100%)';
            borderColor = '#FDA4AF';
            boxShadow =
              'inset 0 -3px 0 #881337, 0 0 16px rgba(244, 63, 94, 0.75)';
          } else if (state.isHinted) {
            bgStyle =
              'linear-gradient(180deg, #FBBF24 0%, #F59E0B 65%, #B45309 100%)';
            borderColor = '#FDE68A';
            boxShadow =
              'inset 0 -4px 0 #78350F, 0 0 18px rgba(245, 158, 11, 0.8)';
            textColor = '#18181B';
          } else if (state.isTarget) {
            if (state.hand === 'left') {
              bgStyle =
                'linear-gradient(180deg, #A5B4FC 0%, #818CF8 65%, #4F46E5 100%)';
              borderColor = '#C7D2FE';
              boxShadow =
                'inset 0 -4px 0 #312E81, 0 0 16px rgba(129, 140, 248, 0.75)';
            } else {
              bgStyle =
                'linear-gradient(180deg, #7DD3FC 0%, #38BDF8 65%, #0284C7 100%)';
              borderColor = '#BAE6FD';
              boxShadow =
                'inset 0 -4px 0 #0C4A6E, 0 0 16px rgba(56, 189, 248, 0.75)';
              textColor = '#082F49';
            }
          } else if (state.isGhostHeld) {
            bgStyle =
              'linear-gradient(180deg, #94A3B8 0%, #64748B 70%, #334155 100%)';
            borderColor = '#CBD5E1';
            boxShadow = 'inset 0 -2px 0 #1E293B';
          }

          const isDepressed = state.isHeld || state.isWrong;

          return (
            <button
              key={key.midi}
              type="button"
              data-midi={key.midi}
              data-note={key.noteName}
              onPointerDown={(e) => handleKeyPointerDown(e, key.midi)}
              onPointerEnter={(e) => handleKeyPointerEnter(e, key.midi)}
              onPointerLeave={(e) => handleKeyPointerLeave(e, key.midi)}
              style={{
                left: `${key.leftPct}%`,
                width: `${key.widthPct}%`,
                height: '63%',
                background: bgStyle,
                borderColor,
                boxShadow,
                color: textColor,
                transform: isDepressed ? 'translateY(2px)' : 'translateY(0)',
              }}
              className={`absolute top-0 z-20 rounded-b-[4px] border flex flex-col items-center justify-end pb-1.5 transition-transform duration-75 focus:outline-none ${
                state.isHinted ? 'animate-pulse' : ''
              }`}
            >
              {/* Wrong Key "Played" Tag */}
              {state.isWrong && (
                <span className="mb-0.5 px-1 py-[1px] rounded bg-black/75 text-[#FECDD3] text-[8px] font-bold uppercase">
                  Played
                </span>
              )}

              {/* Finger Number Badge */}
              {showFingerNumbers && state.finger && (state.isTarget || state.isHinted) && (
                <span
                  className="mb-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-tabular text-[10px] font-bold shadow"
                  style={{
                    backgroundColor: '#090B0F',
                    color: '#F5F2EB',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  {state.finger}
                </span>
              )}

              {/* Note Name on Black Key */}
              {showNoteNames && !compact && (
                <span className="font-tabular text-[9px] font-semibold leading-none opacity-90">
                  {key.noteName}
                </span>
              )}

              {/* QWERTY Label on Black Key */}
              {showQwertyLabels && key.qwertyLabel && !compact && (
                <span className="mt-0.5 text-[8px] font-tabular opacity-60 leading-none">
                  [{key.qwertyLabel}]
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveKeyboard;
