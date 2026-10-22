import type {
  AccompanimentEvent,
  BeatChordGroup,
  Hand,
  KeyDiscoveryPrompt,
  LessonStep,
  LiveCorrectionFeedback,
  NoteAttemptRecord,
  NoteEvaluationStatus,
  NoteInputEvent,
  PracticeMode,
  PracticeSessionSnapshot,
  RemediationPlan,
  ScoreData,
  ScoreNoteEvent,
} from '../types';
import {
  buildDirectionalCorrectionCopy,
  midiToNoteName,
} from '../utils/midiUtils';

export interface AudioEngineAdapter {
  playNote?: (midi: number, velocity?: number, durationSec?: number) => void;
  noteOn?: (midi: number, velocity?: number, maxDurationSec?: number) => void;
  noteOff?: (midi: number) => void;
  playMetronomeClick?: (isDownbeat: boolean, scheduledTime?: number) => void;
  playAccompaniment?: (event: AccompanimentEvent, bpm: number) => void;
  playAccompanimentEvent?: (event: AccompanimentEvent, bpm: number) => void;
  playCoachCue?: (
    type: 'step_complete' | 'hint_target' | 'star_earned',
    targetMidi?: number
  ) => void;
  playSuccessChime?: () => void;
  stopAll?: () => void;
}

export interface PracticeEngineCallbacks {
  onSnapshotChange?: (snapshot: PracticeSessionSnapshot) => void;
  onSessionComplete?: (
    attempts: NoteAttemptRecord[],
    snapshot: PracticeSessionSnapshot
  ) => void;
  onMetronomeBeat?: (beatIndex: number, isDownbeat: boolean) => void;
  onAccompanimentEvent?: (event: AccompanimentEvent, effectiveBpm: number) => void;
  onAutoDemoNote?: (note: ScoreNoteEvent, durationSec: number) => void;
  onLiveCorrection?: (feedback: LiveCorrectionFeedback) => void;
  onRemediationStageAdvance?: (newStageIndex: number) => void;
}

export interface PracticeStartOptions {
  mode?: PracticeMode;
  tempoMultiplier?: number;
  handFilter?: Hand;
  loopRange?: [number, number] | null;
  lessonStep?: LessonStep | null;
  discoveryPrompts?: KeyDiscoveryPrompt[];
  remediationPlan?: RemediationPlan | null;
  metronomeEnabled?: boolean;
  accompanimentEnabled?: boolean;
}

interface InternalNoteAttemptState {
  note: ScoreNoteEvent;
  status: NoteEvaluationStatus;
  wrongMidisPlayed: number[];
  firstSemitoneDelta: number;
  timingErrorMs: number;
  hesitationMs: number;
  chordSpreadMs: number;
  activatedAtMs: number;
  completedAtMs: number | null;
}

export class PracticeEngine {
  private score: ScoreData;
  private audioEngine: AudioEngineAdapter | null = null;
  private callbacks: PracticeEngineCallbacks = {};
  private listeners = new Set<(snapshot: PracticeSessionSnapshot) => void>();

  private mode: PracticeMode = 'wait_mode';
  private isPlaying = false;
  private isPaused = false;
  private isCompleted = false;

  private currentBeat = 0;
  private currentMeasure = 0;
  private tempoMultiplier = 1.0;
  private handFilter: Hand = 'both';
  private loopRange: [number, number] | null = null;

  private metronomeEnabled = true;
  private accompanimentEnabled = true;
  private showNoteNames = true;
  private showFingerNumbers = true;
  private showOverheadHands = true;

  private beatGroups: BeatChordGroup[] = [];
  private activeGroupIndex = 0;
  private activeGroupEnteredAtMs = 0;
  private activeGroupFirstHitAtMs: number | null = null;
  private clockMs = 0;

  private noteStates = new Map<string, InternalNoteAttemptState>();
  private completedAttemptHistory: NoteAttemptRecord[] = [];

  private currentlyHeldMidis = new Set<number>();
  private wrongPlayedMidis = new Set<number>();
  private liveCorrection: LiveCorrectionFeedback | null = null;

  private discoveryPrompts: KeyDiscoveryPrompt[] = [];
  private discoveryIndex = 0;
  private discoveryCompletedCount = 0;

  private streak = 0;
  private maxStreak = 0;

  private remediationPlan: RemediationPlan | null = null;
  private remediationStageIndex = 0;
  private remediationCleanPasses = 0;

  private lastMetronomeBeatInt = -1;
  private triggeredAccompanimentIndices = new Set<number>();
  private triggeredAutoDemoNoteIds = new Set<string>();

  constructor(
    initialScore?: ScoreData,
    audioEngine?: AudioEngineAdapter | null,
    callbacks?: PracticeEngineCallbacks
  ) {
    this.score = initialScore ?? {
      id: 'empty-score',
      title: 'Practice Score',
      subtitle: '',
      bpm: 80,
      timeSignature: [4, 4],
      keySignature: 'C',
      totalMeasures: 1,
      totalBeats: 4,
      notes: [],
      accompaniment: [],
    };
    this.audioEngine = audioEngine ?? null;
    if (callbacks) {
      this.callbacks = callbacks;
    }
    this.rebuildSessionGroups();
  }

  public setAudioEngine(audioEngine: AudioEngineAdapter | null): void {
    this.audioEngine = audioEngine;
  }

  public setCallbacks(callbacks: PracticeEngineCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public subscribe(
    listener: (snapshot: PracticeSessionSnapshot) => void
  ): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getScore(): ScoreData {
    return this.score;
  }

  public getBeatChordGroups(): BeatChordGroup[] {
    return this.beatGroups;
  }

  public getActiveDiscoveryPrompt(): KeyDiscoveryPrompt | null {
    if (this.mode !== 'key_discovery') return null;
    return this.discoveryPrompts[this.discoveryIndex] ?? null;
  }

  public getRemediationPlan(): RemediationPlan | null {
    return this.remediationPlan;
  }

  public loadScore(score: ScoreData, options?: PracticeStartOptions): void {
    this.score = score;
    this.startPractice(options?.mode ?? this.mode, {
      ...options,
      AutoStart: false,
    });
  }

  public startPractice(
    mode: PracticeMode = this.mode,
    options?: PracticeStartOptions & { AutoStart?: boolean }
  ): PracticeSessionSnapshot {
    const prevMode = this.mode;
    this.mode = mode;

    if (prevMode === 'remediation_drill' && mode !== 'remediation_drill') {
      this.remediationPlan = null;
      if (options?.loopRange === undefined && options?.lessonStep?.measureRange === undefined) {
        this.loopRange = null;
      }
    }

    if (options?.lessonStep) {
      const step = options.lessonStep;
      this.discoveryPrompts = step.discoveryPrompts ? [...step.discoveryPrompts] : [];
      this.tempoMultiplier =
        step.tempoMultiplier ?? (mode === 'slow_practice' ? 0.65 : 1.0);
      this.handFilter = step.handFilter ?? 'both';
      this.loopRange = step.measureRange ?? null;
    } else {
      if (options?.discoveryPrompts) {
        this.discoveryPrompts = [...options.discoveryPrompts];
      }
      if (options?.tempoMultiplier !== undefined) {
        this.tempoMultiplier = options.tempoMultiplier;
      } else if (mode === 'slow_practice') {
        this.tempoMultiplier = 0.65;
      } else if (mode === 'performance' || mode === 'wait_mode' || mode === 'auto_demo') {
        this.tempoMultiplier = 1.0;
      }

      if (options?.handFilter !== undefined) {
        this.handFilter = options.handFilter;
      }
      if (options?.loopRange !== undefined) {
        this.loopRange = options.loopRange;
      }
    }

    if (options?.metronomeEnabled !== undefined) {
      this.metronomeEnabled = options.metronomeEnabled;
    }
    if (options?.accompanimentEnabled !== undefined) {
      this.accompanimentEnabled = options.accompanimentEnabled;
    }

    if (options?.remediationPlan !== undefined) {
      this.remediationPlan = options.remediationPlan;
    }

    if (this.mode === 'remediation_drill' && this.remediationPlan) {
      this.remediationStageIndex = 0;
      this.remediationCleanPasses = 0;
      this.applyRemediationStage(0);
    }

    this.discoveryIndex = 0;
    this.discoveryCompletedCount = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.completedAttemptHistory = [];
    this.liveCorrection = null;
    this.wrongPlayedMidis.clear();
    this.currentlyHeldMidis.clear();

    const shouldPlay = options?.AutoStart ?? true;
    this.isPlaying = shouldPlay;
    this.isPaused = false;
    this.isCompleted = false;

    this.rebuildSessionGroups();
    this.emitSnapshot();
    return this.getSnapshot();
  }

  public startRemediationPlan(plan: RemediationPlan): PracticeSessionSnapshot {
    this.remediationPlan = plan;
    return this.startPractice('remediation_drill', {
      remediationPlan: plan,
    });
  }

  private applyRemediationStage(stageIndex: number): void {
    if (!this.remediationPlan) return;
    const stage =
      this.remediationPlan.stages[stageIndex] ??
      this.remediationPlan.stages[this.remediationPlan.stages.length - 1];
    if (!stage) return;

    this.remediationStageIndex = stageIndex;
    this.tempoMultiplier = stage.tempoMultiplier;
    this.handFilter = stage.handFilter;
    this.loopRange = stage.measureRange;
  }

  private getEffectiveExecutionMode(): PracticeMode {
    if (this.mode === 'remediation_drill' && this.remediationPlan) {
      const stage = this.remediationPlan.stages[this.remediationStageIndex];
      return stage ? stage.mode : 'wait_mode';
    }
    return this.mode;
  }

  private rebuildSessionGroups(): void {
    const [loopStartMeasure, loopEndMeasure] = this.getActiveMeasureBounds();
    const beatsPerMeasure = this.score.timeSignature[0] || 4;
    const startBeat = loopStartMeasure * beatsPerMeasure;

    const filteredNotes = this.score.notes
      .filter((n) => {
        if (this.handFilter !== 'both' && n.hand !== this.handFilter) {
          return false;
        }
        if (
          n.measureIndex < loopStartMeasure ||
          n.measureIndex > loopEndMeasure
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.beatStart - b.beatStart || a.midi - b.midi);

    this.noteStates.clear();
    for (const note of filteredNotes) {
      this.noteStates.set(note.id, {
        note,
        status: 'upcoming',
        wrongMidisPlayed: [],
        firstSemitoneDelta: 0,
        timingErrorMs: 0,
        hesitationMs: 0,
        chordSpreadMs: 0,
        activatedAtMs: this.clockMs,
        completedAtMs: null,
      });
    }

    // Group into BeatChordGroup buckets where |n1.beatStart - n2.beatStart| < 0.04
    const groups: BeatChordGroup[] = [];
    for (const note of filteredNotes) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && Math.abs(note.beatStart - lastGroup.beatStart) < 0.04) {
        lastGroup.notes.push(note);
      } else {
        groups.push({
          groupIndex: groups.length,
          beatStart: note.beatStart,
          measureIndex: note.measureIndex,
          notes: [note],
          satisfiedNoteIds: new Set<string>(),
        });
      }
    }

    this.beatGroups = groups;
    this.activeGroupIndex = 0;
    this.activeGroupEnteredAtMs = this.clockMs;
    this.activeGroupFirstHitAtMs = null;

    this.lastMetronomeBeatInt = -1;
    this.triggeredAccompanimentIndices.clear();
    this.triggeredAutoDemoNoteIds.clear();

    const execMode = this.getEffectiveExecutionMode();
    if (execMode === 'wait_mode' && groups.length > 0) {
      this.currentBeat = groups[0].beatStart;
      this.currentMeasure = groups[0].measureIndex;
      this.activateBeatGroup(0);
    } else {
      this.currentBeat = startBeat;
      this.currentMeasure = loopStartMeasure;
      if (groups.length > 0 && Math.abs(groups[0].beatStart - startBeat) < 0.25) {
        this.activateBeatGroup(0);
      }
    }
  }

  private getActiveMeasureBounds(): [number, number] {
    if (this.loopRange) {
      const start = Math.max(0, Math.min(this.loopRange[0], this.loopRange[1]));
      const end = Math.min(
        Math.max(0, this.score.totalMeasures - 1),
        Math.max(this.loopRange[0], this.loopRange[1])
      );
      return [start, end];
    }
    return [0, Math.max(0, this.score.totalMeasures - 1)];
  }

  private activateBeatGroup(groupIndex: number): void {
    const group = this.beatGroups[groupIndex];
    if (!group) return;
    this.activeGroupIndex = groupIndex;
    this.activeGroupEnteredAtMs = this.clockMs;
    this.activeGroupFirstHitAtMs = null;

    for (const note of group.notes) {
      const st = this.noteStates.get(note.id);
      if (
        st &&
        st.status === 'upcoming' &&
        !group.satisfiedNoteIds.has(note.id)
      ) {
        st.status = 'active_target';
        st.activatedAtMs = this.clockMs;
      }
    }
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPaused = true;
    this.audioEngine?.stopAll?.();
    this.emitSnapshot();
  }

  public resume(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
    }
    this.isPaused = false;
    this.emitSnapshot();
  }

  public togglePause(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentlyHeldMidis.clear();
    this.wrongPlayedMidis.clear();
    this.audioEngine?.stopAll?.();
    this.rebuildSessionGroups();
    this.emitSnapshot();
  }

  public setMode(mode: PracticeMode): void {
    this.startPractice(mode, { AutoStart: this.isPlaying });
  }

  public setTempoMultiplier(multiplier: number): void {
    this.tempoMultiplier = Math.max(0.25, Math.min(1.5, multiplier));
    this.emitSnapshot();
  }

  public setHandFilter(hand: Hand): void {
    this.handFilter = hand;
    this.rebuildSessionGroups();
    this.emitSnapshot();
  }

  public setLoopRange(range: [number, number] | null): void {
    this.loopRange = range;
    this.rebuildSessionGroups();
    this.emitSnapshot();
  }

  public setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled;
    this.emitSnapshot();
  }

  public setAccompanimentEnabled(enabled: boolean): void {
    this.accompanimentEnabled = enabled;
    this.emitSnapshot();
  }

  public setShowNoteNames(show: boolean): void {
    this.showNoteNames = show;
    this.emitSnapshot();
  }

  public setShowFingerNumbers(show: boolean): void {
    this.showFingerNumbers = show;
    this.emitSnapshot();
  }

  public setShowOverheadHands(show: boolean): void {
    this.showOverheadHands = show;
    this.emitSnapshot();
  }

  public getEffectiveBpm(): number {
    return Math.round(this.score.bpm * this.tempoMultiplier);
  }

  /**
   * Advances the real-time practice clock by deltaMs milliseconds.
   */
  public tick(deltaMs: number): PracticeSessionSnapshot {
    const safeDelta = Math.max(0, deltaMs);
    this.clockMs += safeDelta;

    if (!this.isPlaying || this.isPaused || this.isCompleted) {
      return this.getSnapshot();
    }

    const execMode = this.getEffectiveExecutionMode();

    if (execMode === 'key_discovery') {
      return this.getSnapshot();
    }

    if (execMode === 'wait_mode') {
      // Check hesitation timeout (> 2200ms) on current BeatChordGroup
      const currentGroup = this.beatGroups[this.activeGroupIndex];
      if (currentGroup) {
        const elapsedOnGroup = this.clockMs - this.activeGroupEnteredAtMs;
        if (elapsedOnGroup > 2200) {
          let changedToHint = false;
          for (const note of currentGroup.notes) {
            if (!currentGroup.satisfiedNoteIds.has(note.id)) {
              const st = this.noteStates.get(note.id);
              if (st && st.status === 'active_target') {
                st.status = 'hint_active';
                st.hesitationMs = Math.max(st.hesitationMs, elapsedOnGroup);
                changedToHint = true;
              }
            }
          }
          if (changedToHint) {
            const firstUnsatisfied = currentGroup.notes.find(
              (n) => !currentGroup.satisfiedNoteIds.has(n.id)
            );
            if (firstUnsatisfied) {
              this.audioEngine?.playCoachCue?.(
                'hint_target',
                firstUnsatisfied.midi
              );
            }
            this.emitSnapshot();
          }
        }
      }
      return this.getSnapshot();
    }

    // Moving modes: slow_practice, performance, remediation_drill (stages 2-3), auto_demo
    const effectiveBpm = this.getEffectiveBpm();
    const beatsPerMeasure = this.score.timeSignature[0] || 4;
    const [loopStartMeasure, loopEndMeasure] = this.getActiveMeasureBounds();
    const startBeat = loopStartMeasure * beatsPerMeasure;
    const endBeat = (loopEndMeasure + 1) * beatsPerMeasure;

    const deltaBeats = (safeDelta * effectiveBpm) / 60000;
    const previousBeat = this.currentBeat;
    this.currentBeat += deltaBeats;
    this.currentMeasure = Math.min(
      loopEndMeasure,
      Math.floor(this.currentBeat / beatsPerMeasure)
    );

    // 1. Trigger metronome on integer beats
    const currentBeatInt = Math.floor(this.currentBeat);
    if (
      this.metronomeEnabled &&
      currentBeatInt > this.lastMetronomeBeatInt &&
      this.currentBeat < endBeat
    ) {
      this.lastMetronomeBeatInt = currentBeatInt;
      const isDownbeat = currentBeatInt % beatsPerMeasure === 0;
      this.audioEngine?.playMetronomeClick?.(isDownbeat);
      this.callbacks.onMetronomeBeat?.(currentBeatInt, isDownbeat);
    }

    // 2. Trigger backing accompaniment events crossed in [previousBeat, currentBeat]
    if (this.accompanimentEnabled && this.score.accompaniment.length > 0) {
      this.score.accompaniment.forEach((acc, idx) => {
        if (
          !this.triggeredAccompanimentIndices.has(idx) &&
          acc.beatStart >= startBeat &&
          acc.beatStart < endBeat &&
          acc.beatStart >= previousBeat - 0.05 &&
          acc.beatStart <= this.currentBeat
        ) {
          this.triggeredAccompanimentIndices.add(idx);
          if (this.audioEngine?.playAccompaniment) {
            this.audioEngine.playAccompaniment(acc, effectiveBpm);
          } else {
            this.audioEngine?.playAccompanimentEvent?.(acc, effectiveBpm);
          }
          this.callbacks.onAccompanimentEvent?.(acc, effectiveBpm);
        }
      });
    }

    // 3. Handle auto_demo note playback & visual marking
    if (execMode === 'auto_demo') {
      for (const group of this.beatGroups) {
        if (
          group.beatStart >= previousBeat - 0.05 &&
          group.beatStart <= this.currentBeat
        ) {
          for (const note of group.notes) {
            if (!this.triggeredAutoDemoNoteIds.has(note.id)) {
              this.triggeredAutoDemoNoteIds.add(note.id);
              group.satisfiedNoteIds.add(note.id);
              const durationSec = (note.durationBeats * 60) / effectiveBpm;
              this.audioEngine?.playNote?.(note.midi, 0.8, durationSec);
              this.callbacks.onAutoDemoNote?.(note, durationSec);

              const st = this.noteStates.get(note.id);
              if (st) {
                st.status = 'correct_first_try';
                st.completedAtMs = this.clockMs;
              }
              this.streak += 1;
              this.maxStreak = Math.max(this.maxStreak, this.streak);
            }
          }
        }
      }
    } else {
      // 4. For user-played moving modes: activate upcoming notes near playhead & expire missed notes
      const toleranceMs = this.getTimingWindowMs(execMode);
      const toleranceBeats = (toleranceMs * effectiveBpm) / 60000;

      for (let gIdx = 0; gIdx < this.beatGroups.length; gIdx++) {
        const group = this.beatGroups[gIdx];
        const beatDiff = this.currentBeat - group.beatStart;

        // Activate target when approaching within tolerance window
        if (Math.abs(beatDiff) <= Math.max(0.25, toleranceBeats)) {
          this.activeGroupIndex = gIdx;
          for (const note of group.notes) {
            const st = this.noteStates.get(note.id);
            if (
              st &&
              st.status === 'upcoming' &&
              !group.satisfiedNoteIds.has(note.id)
            ) {
              st.status = 'active_target';
              st.activatedAtMs = this.clockMs;
            }
          }
        }

        // Expire notes whose timing window has passed without a match
        if (beatDiff > toleranceBeats) {
          for (const note of group.notes) {
            const st = this.noteStates.get(note.id);
            if (
              st &&
              !group.satisfiedNoteIds.has(note.id) &&
              st.status !== 'missed' &&
              st.status !== 'correct_first_try' &&
              st.status !== 'correct_after_hint'
            ) {
              st.status = 'missed';
              st.completedAtMs = this.clockMs;
              this.streak = 0;
            }
          }
        }
      }
    }

    // 5. Check if playhead reached the end of the score or loop range
    if (this.currentBeat >= endBeat) {
      this.handlePassReachedEnd();
    } else {
      this.emitSnapshot();
    }

    return this.getSnapshot();
  }

  public update(deltaMs: number): PracticeSessionSnapshot {
    return this.tick(deltaMs);
  }

  /**
   * Processes a live NoteInputEvent (from Microphone, Web MIDI, or Virtual/QWERTY Keyboard).
   */
  public handleNoteInput(event: NoteInputEvent): PracticeSessionSnapshot {
    if (event.type === 'note_off') {
      this.currentlyHeldMidis.delete(event.midi);
      this.wrongPlayedMidis.delete(event.midi);
      this.emitSnapshot();
      return this.getSnapshot();
    }

    // note_on
    this.currentlyHeldMidis.add(event.midi);

    if (!this.isPlaying || this.isPaused || this.isCompleted) {
      this.emitSnapshot();
      return this.getSnapshot();
    }

    const execMode = this.getEffectiveExecutionMode();

    if (execMode === 'auto_demo') {
      this.emitSnapshot();
      return this.getSnapshot();
    }

    if (execMode === 'key_discovery') {
      this.evaluateKeyDiscoveryInput(event);
      this.emitSnapshot();
      return this.getSnapshot();
    }

    if (execMode === 'wait_mode') {
      this.evaluateWaitModeInput(event);
      this.emitSnapshot();
      return this.getSnapshot();
    }

    // Moving clock evaluation (slow_practice, performance, remediation stages 2-3)
    this.evaluateMovingModeInput(event, execMode);
    this.emitSnapshot();
    return this.getSnapshot();
  }

  public onNoteInput(event: NoteInputEvent): PracticeSessionSnapshot {
    return this.handleNoteInput(event);
  }

  private evaluateKeyDiscoveryInput(event: NoteInputEvent): void {
    const prompt = this.discoveryPrompts[this.discoveryIndex];
    if (!prompt) {
      this.completeSession();
      return;
    }

    const syntheticTargetNote: ScoreNoteEvent = {
      id: prompt.id,
      midi: prompt.targetMidi,
      noteName: prompt.targetNoteName,
      measureIndex: 0,
      beatStart: this.discoveryIndex,
      durationBeats: 1,
      durationType: 'quarter',
      hand: prompt.hand,
      clef: prompt.hand === 'left' ? 'bass' : 'treble',
      finger: prompt.finger,
      techniqueTip: prompt.landmarkHint,
    };

    if (event.midi === prompt.targetMidi) {
      this.wrongPlayedMidis.clear();
      const copy = buildDirectionalCorrectionCopy(
        prompt.targetMidi,
        event.midi,
        prompt.hand,
        prompt.finger
      );
      this.liveCorrection = {
        timestampMs: event.timestampMs || this.clockMs,
        expectedNote: syntheticTargetNote,
        playedMidi: event.midi,
        playedNoteName: midiToNoteName(event.midi),
        semitoneDelta: copy.semitoneDelta,
        whiteKeyDelta: copy.whiteKeyDelta,
        direction: copy.direction,
        headline: copy.headline,
        actionInstruction: copy.actionInstruction,
      };
      this.discoveryCompletedCount += 1;
      this.streak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      this.audioEngine?.playCoachCue?.('step_complete', prompt.targetMidi);

      if (this.discoveryIndex + 1 < this.discoveryPrompts.length) {
        this.discoveryIndex += 1;
      } else {
        this.completeSession();
      }
    } else {
      this.wrongPlayedMidis.add(event.midi);
      this.streak = 0;
      const copy = buildDirectionalCorrectionCopy(
        prompt.targetMidi,
        event.midi,
        prompt.hand,
        prompt.finger
      );
      const feedback: LiveCorrectionFeedback = {
        timestampMs: event.timestampMs || this.clockMs,
        expectedNote: syntheticTargetNote,
        playedMidi: event.midi,
        playedNoteName: midiToNoteName(event.midi),
        semitoneDelta: copy.semitoneDelta,
        whiteKeyDelta: copy.whiteKeyDelta,
        direction: copy.direction,
        headline: copy.headline,
        actionInstruction: copy.actionInstruction,
      };
      this.liveCorrection = feedback;
      this.callbacks.onLiveCorrection?.(feedback);
    }
  }

  private evaluateWaitModeInput(event: NoteInputEvent): void {
    const group = this.beatGroups[this.activeGroupIndex];
    if (!group) {
      this.handlePassReachedEnd();
      return;
    }

    const matchingNote = group.notes.find(
      (n) => !group.satisfiedNoteIds.has(n.id) && n.midi === event.midi
    );

    if (matchingNote) {
      group.satisfiedNoteIds.add(matchingNote.id);
      this.wrongPlayedMidis.clear();

      if (this.activeGroupFirstHitAtMs === null) {
        this.activeGroupFirstHitAtMs = this.clockMs;
      }

      const st = this.noteStates.get(matchingNote.id);
      const hesitationMs = Math.max(
        0,
        this.clockMs - this.activeGroupEnteredAtMs
      );
      const chordSpreadMs = Math.max(
        0,
        this.clockMs - (this.activeGroupFirstHitAtMs ?? this.clockMs)
      );

      if (st) {
        const hadPriorFault =
          st.status === 'hint_active' ||
          st.status === 'wrong_pitch' ||
          st.wrongMidisPlayed.length > 0 ||
          hesitationMs > 2200;

        st.status = hadPriorFault ? 'correct_after_hint' : 'correct_first_try';
        st.hesitationMs = Math.max(st.hesitationMs, hesitationMs);
        st.chordSpreadMs = chordSpreadMs;
        st.timingErrorMs = 0;
        st.completedAtMs = this.clockMs;

        if (hadPriorFault) {
          this.streak = 1;
        } else {
          this.streak += 1;
          this.maxStreak = Math.max(this.maxStreak, this.streak);
        }
      }

      this.liveCorrection = null;

      // Advance playhead as soon as all notes in the current BeatChordGroup are satisfied
      if (group.satisfiedNoteIds.size >= group.notes.length) {
        if (this.activeGroupIndex + 1 < this.beatGroups.length) {
          const nextIdx = this.activeGroupIndex + 1;
          const nextGroup = this.beatGroups[nextIdx];
          this.currentBeat = nextGroup.beatStart;
          this.currentMeasure = nextGroup.measureIndex;
          this.activateBeatGroup(nextIdx);
        } else {
          const beatsPerMeasure = this.score.timeSignature[0] || 4;
          const [, loopEndMeasure] = this.getActiveMeasureBounds();
          this.currentBeat = (loopEndMeasure + 1) * beatsPerMeasure;
          this.handlePassReachedEnd();
        }
      }
      return;
    }

    // Wrong note pressed in wait_mode
    const unsatisfiedNotes = group.notes.filter(
      (n) => !group.satisfiedNoteIds.has(n.id)
    );
    const closestExpected =
      unsatisfiedNotes.sort(
        (a, b) => Math.abs(a.midi - event.midi) - Math.abs(b.midi - event.midi)
      )[0] ?? group.notes[0];

    if (!closestExpected) return;

    this.wrongPlayedMidis.add(event.midi);
    this.streak = 0;

    // Mark unsatisfied notes in the active group as hint_active and record wrong MIDI
    for (const note of unsatisfiedNotes) {
      const st = this.noteStates.get(note.id);
      if (st) {
        st.status = 'hint_active';
        if (st.wrongMidisPlayed.length === 0) {
          st.firstSemitoneDelta = event.midi - note.midi;
        }
        st.wrongMidisPlayed.push(event.midi);
      }
    }

    const copy = buildDirectionalCorrectionCopy(
      closestExpected.midi,
      event.midi,
      closestExpected.hand,
      closestExpected.finger
    );

    const feedback: LiveCorrectionFeedback = {
      timestampMs: event.timestampMs || this.clockMs,
      expectedNote: closestExpected,
      playedMidi: event.midi,
      playedNoteName: midiToNoteName(event.midi),
      semitoneDelta: copy.semitoneDelta,
      whiteKeyDelta: copy.whiteKeyDelta,
      direction: copy.direction,
      headline: copy.headline,
      actionInstruction: copy.actionInstruction,
    };

    this.liveCorrection = feedback;
    this.callbacks.onLiveCorrection?.(feedback);
  }

  private getTimingWindowMs(execMode: PracticeMode): number {
    if (this.mode === 'remediation_drill' && this.remediationPlan) {
      const stage = this.remediationPlan.stages[this.remediationStageIndex];
      if (stage?.stageNumber === 3) return 170;
      return 220;
    }
    if (execMode === 'performance') {
      return 160;
    }
    return 220; // slow_practice default
  }

  private evaluateMovingModeInput(
    event: NoteInputEvent,
    execMode: PracticeMode
  ): void {
    const effectiveBpm = this.getEffectiveBpm();
    const toleranceMs = this.getTimingWindowMs(execMode);
    const toleranceBeats = (toleranceMs * effectiveBpm) / 60000;

    // Search for an unmatched note within +-toleranceBeats of currentBeat
    let matchedGroup: BeatChordGroup | null = null;
    let matchedNote: ScoreNoteEvent | null = null;
    let bestBeatDistance = Infinity;

    for (const group of this.beatGroups) {
      const beatDiff = Math.abs(this.currentBeat - group.beatStart);
      if (beatDiff <= toleranceBeats) {
        for (const note of group.notes) {
          if (
            !group.satisfiedNoteIds.has(note.id) &&
            note.midi === event.midi &&
            beatDiff < bestBeatDistance
          ) {
            bestBeatDistance = beatDiff;
            matchedGroup = group;
            matchedNote = note;
          }
        }
      }
    }

    if (matchedGroup && matchedNote) {
      matchedGroup.satisfiedNoteIds.add(matchedNote.id);
      this.wrongPlayedMidis.clear();

      const timingErrorMs = Math.round(
        ((this.currentBeat - matchedNote.beatStart) * 60000) / effectiveBpm
      );
      const st = this.noteStates.get(matchedNote.id);
      if (st) {
        const hadWrongBefore =
          st.wrongMidisPlayed.length > 0 || st.status === 'hint_active';
        st.status = hadWrongBefore ? 'correct_after_hint' : 'correct_first_try';
        st.timingErrorMs = timingErrorMs;
        st.hesitationMs = Math.max(0, timingErrorMs);
        st.completedAtMs = this.clockMs;

        // Calculate chord spread if multiple notes in matchedGroup are completed
        const completedTimes = matchedGroup.notes
          .map((n) => this.noteStates.get(n.id)?.completedAtMs)
          .filter((t): t is number => t !== null && t !== undefined);
        if (completedTimes.length > 1) {
          const spread =
            Math.max(...completedTimes) - Math.min(...completedTimes);
          for (const n of matchedGroup.notes) {
            const nSt = this.noteStates.get(n.id);
            if (nSt) nSt.chordSpreadMs = Math.round(spread);
          }
        }
      }

      this.streak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      this.liveCorrection = null;
      return;
    }

    // No exact pitch match within tolerance window -> find closest active target note around currentBeat
    let closestGroup: BeatChordGroup | null = null;
    let minGroupBeatDiff = Infinity;
    for (const group of this.beatGroups) {
      const hasUnsatisfied = group.notes.some(
        (n) => !group.satisfiedNoteIds.has(n.id)
      );
      if (!hasUnsatisfied) continue;
      const diff = Math.abs(group.beatStart - this.currentBeat);
      if (diff < minGroupBeatDiff) {
        minGroupBeatDiff = diff;
        closestGroup = group;
      }
    }

    if (!closestGroup) return;

    const unsatisfied = closestGroup.notes.filter(
      (n) => !closestGroup!.satisfiedNoteIds.has(n.id)
    );
    const targetNote =
      unsatisfied.sort(
        (a, b) => Math.abs(a.midi - event.midi) - Math.abs(b.midi - event.midi)
      )[0] ?? closestGroup.notes[0];

    if (!targetNote) return;

    this.wrongPlayedMidis.add(event.midi);
    this.streak = 0;

    const st = this.noteStates.get(targetNote.id);
    if (st) {
      st.status = 'hint_active';
      if (st.wrongMidisPlayed.length === 0) {
        st.firstSemitoneDelta = event.midi - targetNote.midi;
      }
      st.wrongMidisPlayed.push(event.midi);
    }

    const copy = buildDirectionalCorrectionCopy(
      targetNote.midi,
      event.midi,
      targetNote.hand,
      targetNote.finger
    );

    const feedback: LiveCorrectionFeedback = {
      timestampMs: event.timestampMs || this.clockMs,
      expectedNote: targetNote,
      playedMidi: event.midi,
      playedNoteName: midiToNoteName(event.midi),
      semitoneDelta: copy.semitoneDelta,
      whiteKeyDelta: copy.whiteKeyDelta,
      direction: copy.direction,
      headline: copy.headline,
      actionInstruction: copy.actionInstruction,
    };

    this.liveCorrection = feedback;
    this.callbacks.onLiveCorrection?.(feedback);
  }

  private handlePassReachedEnd(): void {
    // Finalize any still-unmatched notes in this pass as missed
    for (const st of this.noteStates.values()) {
      if (
        st.status === 'upcoming' ||
        st.status === 'active_target' ||
        st.status === 'hint_active' ||
        st.status === 'wrong_pitch'
      ) {
        st.status = 'missed';
      }
    }

    const currentPassRecords = this.buildCurrentPassAttemptRecords();

    // Handle 3-stage Remediation Drill progression automatically
    if (this.mode === 'remediation_drill' && this.remediationPlan) {
      const stages = this.remediationPlan.stages;
      const currentStage = stages[this.remediationStageIndex];
      const total = Math.max(1, currentPassRecords.length);
      const cleanCount = currentPassRecords.filter(
        (r) =>
          r.status === 'correct_first_try' || r.status === 'correct_after_hint'
      ).length;
      const firstTryCount = currentPassRecords.filter(
        (r) => r.status === 'correct_first_try'
      ).length;

      const passAccuracy = cleanCount / total;
      const firstTryRatio = firstTryCount / total;
      const isCleanPass = passAccuracy >= 0.85 && firstTryRatio >= 0.65;

      if (isCleanPass) {
        this.remediationCleanPasses += 1;
      } else {
        this.remediationCleanPasses = 0;
      }

      const targetReps = currentStage?.targetCleanReps ?? 1;
      if (this.remediationCleanPasses >= targetReps) {
        if (this.remediationStageIndex + 1 < stages.length) {
          this.completedAttemptHistory.push(...currentPassRecords);
          const nextStageIndex = this.remediationStageIndex + 1;
          this.remediationCleanPasses = 0;
          this.applyRemediationStage(nextStageIndex);
          this.audioEngine?.playCoachCue?.('step_complete');
          this.callbacks.onRemediationStageAdvance?.(nextStageIndex);
          this.rebuildSessionGroups();
          this.emitSnapshot();
          return;
        } else {
          // Completed all 3 remediation stages!
          this.completedAttemptHistory.push(...currentPassRecords);
          this.audioEngine?.playCoachCue?.('star_earned');
          this.completeSession();
          return;
        }
      } else {
        // Repeat current remediation stage loop
        this.completedAttemptHistory.push(...currentPassRecords);
        this.rebuildSessionGroups();
        this.emitSnapshot();
        return;
      }
    }

    // If A-B loop range is set in slow_practice, wrap around or complete if full score
    if (this.loopRange && this.mode === 'slow_practice') {
      this.completedAttemptHistory.push(...currentPassRecords);
      this.rebuildSessionGroups();
      this.emitSnapshot();
      return;
    }

    this.completedAttemptHistory = currentPassRecords;
    this.completeSession();
  }

  private completeSession(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.isCompleted = true;
    this.audioEngine?.playCoachCue?.('step_complete');
    const snapshot = this.getSnapshot();
    const attempts = this.getAttemptRecords();
    this.emitSnapshot();
    this.callbacks.onSessionComplete?.(attempts, snapshot);
  }

  private buildCurrentPassAttemptRecords(): NoteAttemptRecord[] {
    const records: NoteAttemptRecord[] = [];
    for (const st of this.noteStates.values()) {
      const finalStatus: NoteAttemptRecord['status'] =
        st.status === 'correct_first_try'
          ? 'correct_first_try'
          : st.status === 'correct_after_hint'
          ? 'correct_after_hint'
          : 'missed';

      records.push({
        noteId: st.note.id,
        measureIndex: st.note.measureIndex,
        beatStart: st.note.beatStart,
        expectedMidi: st.note.midi,
        expectedNoteName: st.note.noteName,
        hand: st.note.hand,
        finger: st.note.finger,
        status: finalStatus,
        wrongMidisPlayed: [...st.wrongMidisPlayed],
        firstSemitoneDelta: st.firstSemitoneDelta,
        timingErrorMs: st.timingErrorMs,
        hesitationMs: Math.round(st.hesitationMs),
        chordSpreadMs: Math.round(st.chordSpreadMs),
      });
    }
    return records;
  }

  public getAttemptRecords(): NoteAttemptRecord[] {
    const currentRecords = this.buildCurrentPassAttemptRecords();
    const hasProgressInCurrentPass = currentRecords.some(
      (r) => r.status !== 'missed' || r.wrongMidisPlayed.length > 0
    );
    if (hasProgressInCurrentPass || this.completedAttemptHistory.length === 0) {
      return currentRecords;
    }
    return this.completedAttemptHistory;
  }

  public getSnapshot(): PracticeSessionSnapshot {
    const noteStatuses: Record<string, NoteEvaluationStatus> = {};
    const activeTargetMidis = new Set<number>();
    const hintedMidis = new Set<number>();

    const execMode = this.getEffectiveExecutionMode();
    if (execMode === 'key_discovery') {
      const prompt = this.discoveryPrompts[this.discoveryIndex];
      if (prompt) {
        activeTargetMidis.add(prompt.targetMidi);
        if (this.wrongPlayedMidis.size > 0) {
          hintedMidis.add(prompt.targetMidi);
        }
      }
    } else {
      for (const [noteId, st] of this.noteStates.entries()) {
        noteStatuses[noteId] = st.status;
        if (st.status === 'active_target') {
          activeTargetMidis.add(st.note.midi);
        } else if (st.status === 'hint_active') {
          activeTargetMidis.add(st.note.midi);
          hintedMidis.add(st.note.midi);
        }
      }
    }

    return {
      mode: this.mode,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isCompleted: this.isCompleted,
      currentBeat: this.currentBeat,
      currentMeasure: this.currentMeasure,
      effectiveBpm: this.getEffectiveBpm(),
      tempoMultiplier: this.tempoMultiplier,
      handFilter: this.handFilter,
      loopRange: this.loopRange,
      metronomeEnabled: this.metronomeEnabled,
      accompanimentEnabled: this.accompanimentEnabled,
      showNoteNames: this.showNoteNames,
      showFingerNumbers: this.showFingerNumbers,
      showOverheadHands: this.showOverheadHands,
      noteStatuses,
      activeTargetMidis: Array.from(activeTargetMidis),
      hintedMidis: Array.from(hintedMidis),
      wrongPlayedMidis: Array.from(this.wrongPlayedMidis),
      currentlyHeldMidis: Array.from(this.currentlyHeldMidis),
      liveCorrection: this.liveCorrection,
      discoveryIndex: this.discoveryIndex,
      discoveryCompletedCount: this.discoveryCompletedCount,
      streak: this.streak,
      maxStreak: this.maxStreak,
      remediationStageIndex: this.remediationStageIndex,
      remediationCleanPasses: this.remediationCleanPasses,
    };
  }

  private emitSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.callbacks.onSnapshotChange?.(snapshot);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
