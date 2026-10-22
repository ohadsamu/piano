import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Ear,
  Flame,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  Zap,
} from 'lucide-react';
import type { NoteInputEvent, ScoreData, WorkoutCard, WorkoutDefinition } from '../../types';
import { buildDirectionalCorrectionCopy, getFingerLabel, midiToNoteName } from '../../utils/midiUtils';
import { InteractiveKeyboard } from '../visualizers/InteractiveKeyboard';
import { GrandStaffView } from '../visualizers/GrandStaffView';

interface WorkoutsViewProps {
  workouts: WorkoutDefinition[];
  initialWorkoutId?: string;
  onPlayNote: (midi: number, velocity?: number, durationSec?: number) => void;
  onPlayChord: (midis: number[], velocity?: number, durationSec?: number) => void;
  onVirtualNoteOn?: (midi: number, velocity?: number) => void;
  onVirtualNoteOff?: (midi: number) => void;
  lastNoteInput: NoteInputEvent | null;
  currentlyHeldMidis: number[];
  onWorkoutCompleted: (workoutId: string, scoreXp: number) => void;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  workouts,
  initialWorkoutId,
  onPlayNote,
  onPlayChord,
  onVirtualNoteOn,
  onVirtualNoteOff,
  lastNoteInput,
  currentlyHeldMidis,
  onWorkoutCompleted,
}) => {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(
    initialWorkoutId ?? workouts[0]?.id ?? 'workout-flashcard-sprint'
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [satisfiedMidis, setSatisfiedMidis] = useState<number[]>([]);
  const [wrongMidis, setWrongMidis] = useState<number[]>([]);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    status: 'idle' | 'correct' | 'wrong';
    headline: string;
    detail: string;
  }>({
    status: 'idle',
    headline: 'Strike the target note or chord on your piano or keyboard below',
    detail: 'First-try hits award +50 XP bonus!',
  });
  const [streak, setStreak] = useState(0);
  const [scoreXp, setScoreXp] = useState(0);
  const [completed, setCompleted] = useState(false);

  const activeWorkout =
    workouts.find((w) => w.id === selectedWorkoutId) ?? workouts[0];
  const currentCard: WorkoutCard | undefined =
    activeWorkout?.cards[cardIndex];

  // Reset when workout changes
  const startWorkout = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setCardIndex(0);
    setSatisfiedMidis([]);
    setWrongMidis([]);
    setHintRevealed(false);
    setStreak(0);
    setScoreXp(0);
    setCompleted(false);
    const w = workouts.find((item) => item.id === workoutId) ?? workouts[0];
    const first = w?.cards[0];
    setFeedbackBanner({
      status: 'idle',
      headline: first ? first.promptLabel : 'Ready to start!',
      detail: first ? first.mnemonicHint : '',
    });
    if (w?.type === 'ear_pitch_match' && first) {
      setTimeout(() => {
        if (first.anchorMidi) {
          onPlayNote(first.anchorMidi, 0.75, 0.55);
        }
        setTimeout(() => {
          onPlayChord(first.targetMidis, 0.82, 0.85);
        }, 600);
      }, 150);
    }
  };

  // Evaluate incoming note input against current workout card
  useEffect(() => {
    if (!lastNoteInput || lastNoteInput.type !== 'note_on' || !currentCard || completed) {
      return;
    }

    const playedMidi = lastNoteInput.midi;
    const isTarget = currentCard.targetMidis.includes(playedMidi);

    if (isTarget) {
      const nextSatisfied = Array.from(new Set([...satisfiedMidis, playedMidi]));
      setSatisfiedMidis(nextSatisfied);
      setWrongMidis([]);

      if (nextSatisfied.length >= currentCard.targetMidis.length) {
        const earned = hintRevealed ? 25 : 50;
        const nextXp = scoreXp + earned;
        setScoreXp(nextXp);
        setStreak((s) => s + 1);
        setFeedbackBanner({
          status: 'correct',
          headline: `Spot on! ${currentCard.targetNoteNames.join(' + ')} (${
            hintRevealed ? '+25 XP after hint' : '+50 XP First-Try Hit!'
          })`,
          detail: currentCard.mnemonicHint,
        });

        setTimeout(() => {
          if (cardIndex + 1 < activeWorkout.cards.length) {
            const nextIdx = cardIndex + 1;
            const nextCard = activeWorkout.cards[nextIdx];
            setCardIndex(nextIdx);
            setSatisfiedMidis([]);
            setWrongMidis([]);
            setHintRevealed(false);
            setFeedbackBanner({
              status: 'idle',
              headline: nextCard.promptLabel,
              detail: nextCard.mnemonicHint,
            });
            if (activeWorkout.type === 'ear_pitch_match') {
              if (nextCard.anchorMidi) {
                onPlayNote(nextCard.anchorMidi, 0.75, 0.5);
              }
              setTimeout(() => {
                onPlayChord(nextCard.targetMidis, 0.85, 0.85);
              }, 550);
            }
          } else {
            setCompleted(true);
            onWorkoutCompleted(activeWorkout.id, nextXp);
          }
        }, 650);
      }
    } else {
      // Wrong key pressed — trigger Simply Piano directional fix hint!
      setWrongMidis([playedMidi]);
      setHintRevealed(true);
      setStreak(0);
      const primaryExpected =
        currentCard.targetMidis.find((m) => !satisfiedMidis.includes(m)) ??
        currentCard.targetMidis[0];
      const primaryFinger = currentCard.fingers[0] ?? 1;
      const dir = buildDirectionalCorrectionCopy(
        primaryExpected,
        playedMidi,
        currentCard.hand,
        primaryFinger
      );
      setFeedbackBanner({
        status: 'wrong',
        headline: dir.headline,
        detail: `${dir.actionInstruction} • ${currentCard.mnemonicHint}`,
      });
    }
  }, [lastNoteInput]);

  if (!activeWorkout) return null;

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Workout Selector Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#161922] border border-[#F5F2EB]/10 rounded-2xl p-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#EC4899] mb-1">
            <Zap className="w-4 h-4" />
            <span>Simply Piano Style 5-Minute Daily Workouts</span>
          </div>
          <h1 className="font-editorial text-2xl font-semibold text-[#F5F2EB]">
            Rapid Reflex &amp; Ear Conditioning Drills
          </h1>
          <p className="text-xs sm:text-sm text-[#B8B2A6] mt-0.5">
            Build instant sight-reading landmarks, ear interval recognition, and zero-pause chord transitions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {workouts.map((w) => {
            const isSelected = w.id === activeWorkout.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => startWorkout(w.id)}
                className={`px-4 py-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-[#1E2230] border-[#E5A93C] text-[#F5F2EB] shadow-md'
                    : 'bg-[#0D0F14] border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#F5F2EB]'
                }`}
              >
                <div className="text-xs font-semibold text-[#F5F2EB]">{w.title}</div>
                <div className="text-[11px] text-[#7D8494] mt-0.5">{w.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Workout Stage */}
      {completed ? (
        <div className="bg-[#161922] border border-[#10B981]/40 rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7 text-[#E5A93C]" />
          </div>
          <h2 className="font-editorial text-2xl font-semibold text-[#F5F2EB]">
            Workout Complete! +{scoreXp} XP Earned
          </h2>
          <p className="text-sm text-[#B8B2A6] max-w-md mx-auto">
            You completed all {activeWorkout.cards.length} challenge cards in{' '}
            <strong className="text-[#F5F2EB]">{activeWorkout.title}</strong>.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startWorkout(activeWorkout.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5A93C] text-[#0D0F14] font-semibold text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      ) : (
        currentCard && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Challenge Card & Staff/Ear Prompt */}
            <div className="lg:col-span-2 bg-[#161922] border border-[#F5F2EB]/10 rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between border-b border-[#F5F2EB]/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#1E2230] font-tabular text-xs font-bold text-[#E5A93C]">
                    CARD {cardIndex + 1} / {activeWorkout.cards.length}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
                    {currentCard.clef === 'treble' ? 'Treble Clef' : 'Bass Clef'} •{' '}
                    {currentCard.hand === 'right' ? 'Right Hand' : 'Left Hand'}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-tabular text-xs">
                  <span className="flex items-center gap-1 text-[#F59E0B] font-bold">
                    <Flame className="w-4 h-4" /> Streak: {streak}
                  </span>
                  <span className="text-[#10B981] font-bold">+{scoreXp} XP</span>
                </div>
              </div>

              {/* Prompt Display */}
              <div className="py-4 text-center space-y-4">
                <p className="text-xs font-semibold text-[#B8B2A6]">
                  {activeWorkout.pedagogicalGoal}
                </p>
                <h2 className="font-editorial text-3xl font-semibold text-[#F5F2EB]">
                  {currentCard.promptLabel}
                </h2>
                {activeWorkout.type === 'flashcard_sprint' && (
                  <div className="max-w-xl mx-auto rounded-xl overflow-hidden border border-[#F5F2EB]/10">
                    <GrandStaffView
                      score={{
                        id: `fc-${currentCard.id}`,
                        title: 'Sight-Reading Flashcard',
                        subtitle: '',
                        bpm: 72,
                        timeSignature: [4, 4],
                        keySignature: 'C',
                        totalMeasures: 1,
                        totalBeats: 4,
                        notes: currentCard.targetMidis.map((midi, i) => ({
                          id: `fc-note-${midi}`,
                          midi,
                          noteName: midiToNoteName(midi),
                          measureIndex: 0,
                          beatStart: 1,
                          durationBeats: 2,
                          durationType: 'half' as const,
                          hand: currentCard.hand,
                          clef: currentCard.clef,
                          finger: currentCard.fingers[i] ?? 1,
                        })),
                        accompaniment: [],
                      }}
                      currentBeat={1}
                      activeTargetMidis={currentCard.targetMidis}
                      hintedMidis={hintRevealed ? currentCard.targetMidis : []}
                      showNoteNames={hintRevealed}
                      showFingerNumbers={true}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {currentCard.targetMidis.map((midi, i) => {
                    const isHit = satisfiedMidis.includes(midi);
                    const finger = currentCard.fingers[i] ?? 1;
                    const hidePitchLabel =
                      (activeWorkout.type === 'ear_pitch_match' ||
                        activeWorkout.type === 'flashcard_sprint') &&
                      !hintRevealed &&
                      !isHit;
                    return (
                      <div
                        key={midi}
                        className={`px-5 py-3 rounded-2xl border font-tabular transition-all ${
                          isHit
                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                            : hintRevealed
                            ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]'
                            : 'bg-[#0D0F14] border-[#38BDF8]/40 text-[#F5F2EB]'
                        }`}
                      >
                        <div className="text-2xl font-bold">
                          {hidePitchLabel
                            ? activeWorkout.type === 'ear_pitch_match'
                              ? '? Mystery Note'
                              : '? Read Staff Above'
                            : midiToNoteName(midi)}
                        </div>
                        <div className="text-xs text-[#B8B2A6] mt-1">
                          {getFingerLabel(finger)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {activeWorkout.type === 'ear_pitch_match' && (
                  <div className="pt-2 flex items-center justify-center gap-3">
                    {currentCard.anchorMidi && (
                      <button
                        type="button"
                        onClick={() => onPlayNote(currentCard.anchorMidi!, 0.8, 0.7)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E2230] hover:bg-[#282D3E] text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/30"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Play Anchor ({currentCard.anchorNoteName})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onPlayChord(currentCard.targetMidis, 0.85, 0.9)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E5A93C] hover:bg-[#F3C66F] text-xs font-semibold text-[#0D0F14]"
                    >
                      <Ear className="w-4 h-4" />
                      <span>Replay Mystery Sound</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Live Corrective Coach Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  feedbackBanner.status === 'wrong'
                    ? 'bg-[#F43F5E]/15 border-[#F43F5E]/50 text-[#F5F2EB]'
                    : feedbackBanner.status === 'correct'
                    ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#F5F2EB]'
                    : 'bg-[#0D0F14] border-[#F5F2EB]/10 text-[#B8B2A6]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-[#F5F2EB]">
                    {feedbackBanner.headline}
                  </div>
                  <div className="text-xs text-[#B8B2A6]">{feedbackBanner.detail}</div>
                </div>
                {!hintRevealed && (
                  <button
                    type="button"
                    onClick={() => {
                      setHintRevealed(true);
                      onPlayChord(currentCard.targetMidis, 0.8, 0.7);
                    }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 text-xs font-semibold"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Show Key Hint</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Mnemonic & Coach Tips */}
            <div className="bg-[#161922] border border-[#F5F2EB]/10 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E5A93C]">
                  <Sparkles className="w-4 h-4" />
                  <span>Conservatory Landmark Guide</span>
                </div>
                <h3 className="font-editorial text-lg font-semibold text-[#F5F2EB]">
                  How to Find This Without Guessing
                </h3>
                <p className="text-xs sm:text-sm text-[#B8B2A6] leading-relaxed">
                  {currentCard.mnemonicHint}
                </p>
              </div>

              <div className="bg-[#0D0F14] p-4 rounded-xl border border-[#F5F2EB]/10 space-y-2 text-xs">
                <div className="font-semibold text-[#F5F2EB]">Color Feedback Legend:</div>
                <div className="flex items-center gap-2 text-[#38BDF8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                  <span>Sky Blue / Emerald: Correct on 1st try</span>
                </div>
                <div className="flex items-center gap-2 text-[#F59E0B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Amber Key: Target Hint after wrong note</span>
                </div>
                <div className="flex items-center gap-2 text-[#F43F5E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
                  <span>Coral Key: The wrong note you struck</span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Interactive Piano Keybed Below Workout */}
      {currentCard && (
        <div className="bg-[#161922] border border-[#F5F2EB]/10 rounded-2xl overflow-hidden shadow-xl">
          <InteractiveKeyboard
            activeTargetNotes={
              (activeWorkout.type === 'ear_pitch_match' ||
                activeWorkout.type === 'flashcard_sprint') &&
              !hintRevealed
                ? []
                : currentCard.targetMidis.map((midi, i) => ({
                    id: `wk-${midi}`,
                    midi,
                    noteName: midiToNoteName(midi),
                    measureIndex: 0,
                    beatStart: 0,
                    durationBeats: 1,
                    durationType: 'quarter',
                    hand: currentCard.hand,
                    clef: currentCard.clef,
                    finger: currentCard.fingers[i] ?? 1,
                  }))
            }
            hintedMidis={hintRevealed ? currentCard.targetMidis : []}
            wrongPlayedMidis={wrongMidis}
            currentlyHeldMidis={currentlyHeldMidis}
            showNoteNames={
              activeWorkout.type !== 'flashcard_sprint' || hintRevealed
            }
            showFingerNumbers={true}
            onNoteOn={(midi) => {
              if (onVirtualNoteOn) {
                onVirtualNoteOn(midi, 0.85);
              } else {
                onPlayNote(midi, 0.85);
              }
            }}
            onNoteOff={(midi) => {
              onVirtualNoteOff?.(midi);
            }}
          />
        </div>
      )}
    </div>
  );
};
