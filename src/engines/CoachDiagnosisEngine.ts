import type {
  CoachDiagnosisReport,
  DetectedIssue,
  MeasureHealthSummary,
  MistakeCategory,
  NoteAttemptRecord,
  PracticeMode,
  RemediationPlan,
  RemediationStage,
  ScoreData,
  ScoreNoteEvent,
  Hand,
} from '../types';
import {
  getFingerLabel,
  getHandLabel,
  isBlackKey,
  midiToNoteName,
} from '../utils/midiUtils';

export class CoachDiagnosisEngine {
  /**
   * Analyzes a practice session's note attempt telemetry and generates an actionable
   * CoachDiagnosisReport with per-measure health summaries, root-cause mistake patterns,
   * recommended video lessons, and a 3-stage RemediationPlan.
   */
  public analyzeSession(
    score: ScoreData,
    attempts: NoteAttemptRecord[],
    mode: PracticeMode = 'performance'
  ): CoachDiagnosisReport {
    const effectiveAttempts =
      attempts.length > 0 ? attempts : this.buildFallbackAttemptsFromScore(score);

    const totalAttempts = Math.max(1, effectiveAttempts.length);
    const firstTryCount = effectiveAttempts.filter(
      (a) => a.status === 'correct_first_try'
    ).length;
    const hintedCount = effectiveAttempts.filter(
      (a) => a.status === 'correct_after_hint'
    ).length;

    const firstTryPct = Math.round((firstTryCount / totalAttempts) * 100);
    const overallAccuracyPct = Math.round(
      ((firstTryCount + hintedCount * 0.65) / totalAttempts) * 100
    );

    const timingValues = effectiveAttempts
      .filter((a) => a.status !== 'missed')
      .map((a) => a.timingErrorMs);
    const meanTimingErrorMs =
      timingValues.length > 0
        ? Math.round(
            timingValues.reduce((sum, val) => sum + val, 0) / timingValues.length
          )
        : 0;

    let rhythmTendency: 'on_beat' | 'rushing' | 'dragging' = 'on_beat';
    if (meanTimingErrorMs < -55) {
      rhythmTendency = 'rushing';
    } else if (meanTimingErrorMs > 65) {
      rhythmTendency = 'dragging';
    }

    const measureSummaries = this.computeMeasureSummaries(score, effectiveAttempts);
    const troubleMeasures = measureSummaries
      .filter((m) => m.troubleScore >= 30)
      .map((m) => m.measureIndex);

    const detectedIssues = this.detectMistakePatterns(
      score,
      effectiveAttempts,
      mode,
      meanTimingErrorMs
    );

    // Compute stars earned (0 to 3)
    let starsEarned: 0 | 1 | 2 | 3 = 0;
    if (firstTryPct >= 88 && overallAccuracyPct >= 92) {
      starsEarned = 3;
    } else if (firstTryPct >= 70 || overallAccuracyPct >= 80) {
      starsEarned = 2;
    } else if (overallAccuracyPct >= 50 || firstTryCount + hintedCount > 0) {
      starsEarned = 1;
    }

    const recommendedVideos = this.collectRecommendedVideos(detectedIssues);
    const remediationPlan = this.buildRemediationPlan(
      score,
      effectiveAttempts,
      measureSummaries,
      detectedIssues,
      recommendedVideos
    );

    const { encouragementHeadline, teacherSummary } = this.buildCoachingCopy(
      score,
      firstTryPct,
      overallAccuracyPct,
      starsEarned,
      detectedIssues,
      troubleMeasures
    );

    return {
      overallAccuracyPct,
      firstTryPct,
      starsEarned,
      meanTimingErrorMs,
      rhythmTendency,
      measureSummaries,
      troubleMeasures,
      detectedIssues,
      remediationPlan,
      recommendedVideos,
      encouragementHeadline,
      teacherSummary,
    };
  }

  /**
   * Alias for analyzeSession to support callers using .analyze()
   */
  public analyze(
    score: ScoreData,
    attempts: NoteAttemptRecord[],
    mode: PracticeMode = 'performance'
  ): CoachDiagnosisReport {
    return this.analyzeSession(score, attempts, mode);
  }

  /**
   * Creates a realistic synthetic mistake telemetry demo for a given score so users
   * can test "Identify My Play & Fix Me" at any time even before making errors.
   */
  public createSyntheticMistakeDemo(score: ScoreData): {
    attempts: NoteAttemptRecord[];
    report: CoachDiagnosisReport;
  } {
    const sortedNotes = [...score.notes].sort((a, b) => a.beatStart - b.beatStart);
    const targetTroubleMeasure = Math.min(1, Math.max(0, score.totalMeasures - 1));

    const attempts: NoteAttemptRecord[] = sortedNotes.map((note, idx) => {
      const inTroubleMeasure = note.measureIndex === targetTroubleMeasure;

      if (inTroubleMeasure && idx % 2 === 0) {
        // Adjacent key slip (+1 or +2 semitones)
        const slipMidi = note.midi + (isBlackKey(note.midi + 1) ? 2 : 1);
        return {
          noteId: note.id,
          measureIndex: note.measureIndex,
          beatStart: note.beatStart,
          expectedMidi: note.midi,
          expectedNoteName: note.noteName,
          hand: note.hand,
          finger: note.finger,
          status: 'correct_after_hint',
          wrongMidisPlayed: [slipMidi],
          firstSemitoneDelta: slipMidi - note.midi,
          timingErrorMs: 110,
          hesitationMs: 1750,
          chordSpreadMs: 45,
        };
      }

      if (inTroubleMeasure && idx % 2 === 1) {
        // Hesitation or octave / landmark slip
        const wrongMidi = note.midi + 2;
        return {
          noteId: note.id,
          measureIndex: note.measureIndex,
          beatStart: note.beatStart,
          expectedMidi: note.midi,
          expectedNoteName: note.noteName,
          hand: note.hand,
          finger: note.finger,
          status: 'correct_after_hint',
          wrongMidisPlayed: [wrongMidi],
          firstSemitoneDelta: wrongMidi - note.midi,
          timingErrorMs: 135,
          hesitationMs: 1820,
          chordSpreadMs: 60,
        };
      }

      return {
        noteId: note.id,
        measureIndex: note.measureIndex,
        beatStart: note.beatStart,
        expectedMidi: note.midi,
        expectedNoteName: note.noteName,
        hand: note.hand,
        finger: note.finger,
        status: 'correct_first_try',
        wrongMidisPlayed: [],
        firstSemitoneDelta: 0,
        timingErrorMs: -18,
        hesitationMs: 220,
        chordSpreadMs: 15,
      };
    });

    const report = this.analyzeSession(score, attempts, 'performance');
    return { attempts, report };
  }

  private buildFallbackAttemptsFromScore(score: ScoreData): NoteAttemptRecord[] {
    return score.notes.map((n) => ({
      noteId: n.id,
      measureIndex: n.measureIndex,
      beatStart: n.beatStart,
      expectedMidi: n.midi,
      expectedNoteName: n.noteName,
      hand: n.hand,
      finger: n.finger,
      status: 'correct_first_try',
      wrongMidisPlayed: [],
      firstSemitoneDelta: 0,
      timingErrorMs: 0,
      hesitationMs: 250,
      chordSpreadMs: 0,
    }));
  }

  private computeMeasureSummaries(
    score: ScoreData,
    attempts: NoteAttemptRecord[]
  ): MeasureHealthSummary[] {
    const totalMeasures = Math.max(
      score.totalMeasures,
      attempts.reduce((max, a) => Math.max(max, a.measureIndex + 1), 1)
    );

    const summaries: MeasureHealthSummary[] = [];

    for (let m = 0; m < totalMeasures; m++) {
      const mAttempts = attempts.filter((a) => a.measureIndex === m);
      if (mAttempts.length === 0) {
        summaries.push({
          measureIndex: m,
          totalNotes: 0,
          firstTryCount: 0,
          hintedCount: 0,
          missedCount: 0,
          avgTimingErrorMs: 0,
          maxHesitationMs: 0,
          troubleScore: 0,
        });
        continue;
      }

      const nCount = mAttempts.length;
      const firstTryCount = mAttempts.filter(
        (a) => a.status === 'correct_first_try'
      ).length;
      const hintedCount = mAttempts.filter(
        (a) => a.status === 'correct_after_hint'
      ).length;
      const missedCount = mAttempts.filter((a) => a.status === 'missed').length;

      const avgTimingErrorMs = Math.round(
        mAttempts.reduce((sum, a) => sum + a.timingErrorMs, 0) / nCount
      );
      const maxHesitationMs = Math.round(
        mAttempts.reduce((max, a) => Math.max(max, a.hesitationMs), 0)
      );

      let penaltySum = 0;
      for (const a of mAttempts) {
        const isMissed = a.status === 'missed' ? 1 : 0;
        const isWrongAttempt =
          a.wrongMidisPlayed.length > 0 || a.status === 'correct_after_hint'
            ? 1
            : 0;
        const isHighHesitation = a.hesitationMs > 1400 ? 1 : 0;
        const isHighTimingError = Math.abs(a.timingErrorMs) > 120 ? 1 : 0;

        penaltySum +=
          1.0 * isMissed +
          0.65 * isWrongAttempt +
          0.4 * isHighHesitation +
          0.35 * isHighTimingError;
      }

      const troubleScore = Math.min(
        100,
        Math.round((100 / nCount) * penaltySum)
      );

      summaries.push({
        measureIndex: m,
        totalNotes: nCount,
        firstTryCount,
        hintedCount,
        missedCount,
        avgTimingErrorMs,
        maxHesitationMs,
        troubleScore,
      });
    }

    return summaries;
  }

  private detectMistakePatterns(
    score: ScoreData,
    attempts: NoteAttemptRecord[],
    mode: PracticeMode,
    meanTimingErrorMs: number
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const noteMap = new Map<string, ScoreNoteEvent>();
    for (const n of score.notes) {
      noteMap.set(n.id, n);
    }

    // Helper for delta extraction
    const getFirstDelta = (a: NoteAttemptRecord): number => {
      if (a.firstSemitoneDelta !== 0) return a.firstSemitoneDelta;
      if (a.wrongMidisPlayed.length > 0) {
        return a.wrongMidisPlayed[0] - a.expectedMidi;
      }
      return 0;
    };

    // 1. CHROMATIC_ACCIDENTAL_MISS: target is black key (or played is black key when natural expected) with |delta| === 1
    const chromaticHits = attempts.filter((a) => {
      if (a.wrongMidisPlayed.length === 0 && a.firstSemitoneDelta === 0) return false;
      const delta = getFirstDelta(a);
      const playedMidi = a.expectedMidi + delta;
      return (
        Math.abs(delta) === 1 &&
        (isBlackKey(a.expectedMidi) || isBlackKey(playedMidi))
      );
    });

    if (chromaticHits.length >= 1) {
      const ex = chromaticHits[0];
      const playedMidi = ex.expectedMidi + getFirstDelta(ex);
      const playedName = midiToNoteName(playedMidi);
      const affected = Array.from(
        new Set(chromaticHits.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'CHROMATIC_ACCIDENTAL_MISS',
        severity: chromaticHits.length >= 2 ? 'high' : 'medium',
        title: 'Sharp / Flat Black-Key Slip',
        diagnosisExplanation: `You played the natural white key ${playedName} instead of reaching slightly forward onto the raised key ${ex.expectedNoteName}.`,
        actionableFixTip:
          'Slide your hand 1 inch closer to the fallboard so your longer fingers naturally reach the raised black keys without twisting your wrist.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1}, you played ${playedName} instead of ${ex.expectedNoteName} (${getHandLabel(ex.hand)} ${getFingerLabel(ex.finger)}).`,
        recommendedVideoIds: ['vid-07-black-keys-and-accidentals', 'vid-01-posture-arch'],
      });
    }

    // 2. ADJACENT_KEY_SLIP: |delta| in {1, 2} on diatonic neighbor keys
    const adjacentSlips = attempts.filter((a) => {
      if (a.wrongMidisPlayed.length === 0 && a.firstSemitoneDelta === 0) return false;
      const absDelta = Math.abs(getFirstDelta(a));
      return absDelta === 1 || absDelta === 2;
    });

    if (adjacentSlips.length >= 2 || (adjacentSlips.length === 1 && chromaticHits.length === 0)) {
      const ex = adjacentSlips[0];
      const delta = getFirstDelta(ex);
      const playedMidi = ex.expectedMidi + delta;
      const playedName = midiToNoteName(playedMidi);
      const dirWord = delta > 0 ? 'higher' : 'lower';
      const affected = Array.from(
        new Set(adjacentSlips.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'ADJACENT_KEY_SLIP',
        severity: adjacentSlips.length >= 2 ? 'high' : 'medium',
        title: 'Adjacent Neighbor Key Slip',
        diagnosisExplanation: `Your finger brushed the neighbor key (${playedName}, ${Math.abs(delta)} semitone${Math.abs(delta) === 1 ? '' : 's'} ${dirWord}) instead of landing cleanly on ${ex.expectedNoteName}.`,
        actionableFixTip:
          'Keep a rounded "C-cup" hand arch and play on the fleshy pad of each fingertip so adjacent fingers stay relaxed and independent.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1}, you played ${playedName} instead of ${ex.expectedNoteName} (${getHandLabel(ex.hand)} ${getFingerLabel(ex.finger)}).`,
        recommendedVideoIds: ['vid-01-posture-arch', 'vid-03-steps-vs-skips'],
      });
    }

    // 3. OCTAVE_SHIFT: |delta| === 12
    const octaveShifts = attempts.filter((a) => {
      const absDelta = Math.abs(getFirstDelta(a));
      return absDelta === 12;
    });

    if (octaveShifts.length >= 1) {
      const ex = octaveShifts[0];
      const delta = getFirstDelta(ex);
      const playedName = midiToNoteName(ex.expectedMidi + delta);
      const highLow = delta > 0 ? '1 octave too high' : '1 octave too low';
      const affected = Array.from(
        new Set(octaveShifts.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'OCTAVE_SHIFT',
        severity: 'high',
        title: 'Octave Register Shift',
        diagnosisExplanation: `You found the right note letter (${ex.expectedNoteName.replace(/[0-9]/g, '')}), but played ${playedName} (${highLow}).`,
        actionableFixTip:
          'Locate the group of 2 black keys in the center of your keyboard first—Middle C (C4) sits immediately to the left of those two black keys.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1}, you played ${playedName} instead of ${ex.expectedNoteName} (${delta > 0 ? '+12' : '-12'} semitones).`,
        recommendedVideoIds: ['vid-02-middle-c-landmark'],
      });
    }

    // 4. LANDMARK_DISPLACEMENT: |delta| >= 5 and |delta| !== 12
    const landmarkShifts = attempts.filter((a) => {
      const absDelta = Math.abs(getFirstDelta(a));
      return absDelta >= 5 && absDelta !== 12;
    });

    if (landmarkShifts.length >= 1) {
      const ex = landmarkShifts[0];
      const delta = getFirstDelta(ex);
      const playedName = midiToNoteName(ex.expectedMidi + delta);
      const affected = Array.from(
        new Set(landmarkShifts.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'LANDMARK_DISPLACEMENT',
        severity: 'high',
        title: 'Hand Landmark Drift',
        diagnosisExplanation: `Your hand drifted out of its 5-finger home position (${delta > 0 ? `+${delta}` : delta} semitones off), striking ${playedName} instead of ${ex.expectedNoteName}.`,
        actionableFixTip:
          'Before starting the measure, anchor your Thumb (1) or Pinky (5) on the landmark key (C4 or G4 for Right Hand, C3 or F3 for Left Hand) without looking down.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1}, you played ${playedName} when aiming for ${ex.expectedNoteName} (${getHandLabel(ex.hand)} ${getFingerLabel(ex.finger)}).`,
        recommendedVideoIds: ['vid-02-middle-c-landmark', 'vid-01-posture-arch'],
      });
    }

    // 5. INTERVAL_MISJUDGE: |delta| in {3, 4}
    const intervalMisses = attempts.filter((a) => {
      const absDelta = Math.abs(getFirstDelta(a));
      return absDelta === 3 || absDelta === 4;
    });

    if (intervalMisses.length >= 1) {
      const ex = intervalMisses[0];
      const delta = getFirstDelta(ex);
      const playedName = midiToNoteName(ex.expectedMidi + delta);
      const affected = Array.from(
        new Set(intervalMisses.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'INTERVAL_MISJUDGE',
        severity: 'medium',
        title: 'Skip / Interval Distance Misjudged',
        diagnosisExplanation: `When skipping across keys toward ${ex.expectedNoteName}, your finger landed on ${playedName} (a 3rd away).`,
        actionableFixTip:
          'Remember: Line-to-Line or Space-to-Space on the staff is a Skip (skip 1 white key and 1 finger).',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1}, you played ${playedName} instead of ${ex.expectedNoteName} on a melodic skip.`,
        recommendedVideoIds: ['vid-03-steps-vs-skips'],
      });
    }

    // 6. RUSHING_BEAT: >= 35% of notes have timingErrorMs < -80 and meanTimingErrorMs < -55
    const timedAttempts = attempts.filter((a) => a.status !== 'missed');
    const rushingNotes = timedAttempts.filter((a) => a.timingErrorMs < -80);
    if (
      mode !== 'wait_mode' &&
      mode !== 'key_discovery' &&
      timedAttempts.length >= 2 &&
      rushingNotes.length / timedAttempts.length >= 0.35 &&
      meanTimingErrorMs < -55
    ) {
      const affected = Array.from(
        new Set(rushingNotes.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);
      const avgEarly = Math.abs(meanTimingErrorMs);

      issues.push({
        category: 'RUSHING_BEAT',
        severity: avgEarly > 100 ? 'high' : 'medium',
        title: 'Rushing Ahead of the Pulse',
        diagnosisExplanation: `You are playing ahead of the beat (averaging ${avgEarly} ms early). Excitement makes fingers jump before the metronome clicks.`,
        actionableFixTip:
          'Exhale slowly, listen to the woodblock click, and count "1 - and - 2 - and" aloud so every quarter note settles into the pocket.',
        affectedMeasures: affected,
        exampleDetail: `Across Measure ${affected[0] + 1}, notes arrived an average of ${avgEarly} ms ahead of the beat.`,
        recommendedVideoIds: ['vid-04-rhythm-pulse-breathing'],
      });
    }

    // 7. DRAGGING_HESITATION: mean timing > +75ms OR >= 2 notes have hesitationMs > 1500ms
    const hesitantNotes = attempts.filter(
      (a) => a.hesitationMs > 1500 || a.timingErrorMs > 110
    );
    if (meanTimingErrorMs > 75 || hesitantNotes.length >= 2) {
      const worst = [...attempts].sort(
        (a, b) =>
          Math.max(b.hesitationMs, b.timingErrorMs) -
          Math.max(a.hesitationMs, a.timingErrorMs)
      )[0];
      const affected = Array.from(
        new Set(
          (hesitantNotes.length > 0 ? hesitantNotes : [worst]).map(
            (a) => a.measureIndex
          )
        )
      ).sort((a, b) => a - b);
      const effectiveDelayMs = Math.max(worst.hesitationMs, worst.timingErrorMs, 180);
      const pauseLabel =
        effectiveDelayMs >= 600
          ? `${(effectiveDelayMs / 1000).toFixed(1)}s`
          : `${Math.round(effectiveDelayMs)}ms`;

      issues.push({
        category: 'DRAGGING_HESITATION',
        severity: effectiveDelayMs > 2000 ? 'high' : 'medium',
        title: 'Note Transition Hesitation',
        diagnosisExplanation: `You paused or lagged by ${pauseLabel} searching for ${worst.expectedNoteName} in Measure ${worst.measureIndex + 1}.`,
        actionableFixTip:
          'Keep your eyes 1 beat ahead on the sheet music while your finger holds the current note—let your next finger pre-touch its key before the beat arrives.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${worst.measureIndex + 1}, transitioning to ${worst.expectedNoteName} (${getHandLabel(worst.hand)} ${getFingerLabel(worst.finger)}) lagged by ${pauseLabel}.`,
        recommendedVideoIds: ['vid-04-rhythm-pulse-breathing', 'vid-03-steps-vs-skips'],
      });
    }

    // 8. CHORD_TRANSITION_STALL & 9. TWO_HAND_DESYNC
    // Group attempts by beatStart
    const beatGroups = new Map<string, NoteAttemptRecord[]>();
    for (const a of attempts) {
      const bucketKey = a.beatStart.toFixed(2);
      const list = beatGroups.get(bucketKey) ?? [];
      list.push(a);
      beatGroups.set(bucketKey, list);
    }

    const chordStallAttempts: NoteAttemptRecord[] = [];
    const twoHandDesyncAttempts: NoteAttemptRecord[] = [];

    for (const group of beatGroups.values()) {
      if (group.length >= 2) {
        const handsInGroup = new Set(group.map((g) => g.hand));
        const maxSpread = Math.max(...group.map((g) => g.chordSpreadMs));
        const maxHesitation = Math.max(...group.map((g) => g.hesitationMs));
        const anyMissOrWrong = group.some(
          (g) => g.status !== 'correct_first_try' || g.wrongMidisPlayed.length > 0
        );

        // Two-hand desync check
        if (handsInGroup.size === 2 && (maxSpread > 130 || anyMissOrWrong)) {
          twoHandDesyncAttempts.push(...group);
        }

        // Same-hand chord triad or dyad stall check
        if (
          (group.length >= 3 || (group.length >= 2 && handsInGroup.size === 1)) &&
          (maxHesitation > 1400 || anyMissOrWrong || maxSpread > 140)
        ) {
          chordStallAttempts.push(...group);
        }
      }
    }

    if (chordStallAttempts.length > 0) {
      const ex = chordStallAttempts[0];
      const affected = Array.from(
        new Set(chordStallAttempts.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'CHORD_TRANSITION_STALL',
        severity: 'medium',
        title: 'Chord Shape Transition Delay',
        diagnosisExplanation: `Switching into the chord at Measure ${ex.measureIndex + 1} caused a pause or uneven finger strike.`,
        actionableFixTip:
          'Lock your Fingers 1–3–5 into a gentle "Triad Claw" in the air so all three fingers travel and land on the chord keys as one unified shape.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1} (Beat ${(ex.beatStart % (score.timeSignature[0] || 4)) + 1}), chord notes needed extra settling time.`,
        recommendedVideoIds: [
          'vid-05-triad-claw-and-inversions',
          'vid-06-left-hand-anchor-and-groove',
        ],
      });
    }

    // Also check if one hand's miss rate is >= 2x the other in a two-hand score
    const rhAttempts = attempts.filter((a) => a.hand === 'right');
    const lhAttempts = attempts.filter((a) => a.hand === 'left');
    let handImbalanceDesync = false;
    if (rhAttempts.length >= 2 && lhAttempts.length >= 2) {
      const rhFaults =
        rhAttempts.filter((a) => a.status !== 'correct_first_try').length /
        rhAttempts.length;
      const lhFaults =
        lhAttempts.filter((a) => a.status !== 'correct_first_try').length /
        lhAttempts.length;
      if (
        (lhFaults >= 0.4 && lhFaults >= rhFaults * 2) ||
        (rhFaults >= 0.4 && rhFaults >= lhFaults * 2)
      ) {
        handImbalanceDesync = true;
      }
    }

    if (twoHandDesyncAttempts.length > 0 || handImbalanceDesync) {
      const sample =
        twoHandDesyncAttempts[0] ??
        lhAttempts.find((a) => a.status !== 'correct_first_try') ??
        attempts[0];
      const spreadVal = Math.max(145, sample?.chordSpreadMs ?? 150);
      const affected = Array.from(
        new Set(
          (twoHandDesyncAttempts.length > 0
            ? twoHandDesyncAttempts
            : attempts.filter((a) => a.status !== 'correct_first_try')
          ).map((a) => a.measureIndex)
        )
      ).sort((a, b) => a - b);

      issues.push({
        category: 'TWO_HAND_DESYNC',
        severity: 'high',
        title: 'Left & Right Hand Coordination Lag',
        diagnosisExplanation: `When playing both hands together in Measure ${(sample?.measureIndex ?? 0) + 1}, your Left and Right hands landed ${spreadVal} ms apart.`,
        actionableFixTip:
          'Put your Left Hand bass anchor on autopilot first (2x solo reps), then cue both thumbs/fingers to breathe together on Beat 1.',
        affectedMeasures: affected.length > 0 ? affected : [0],
        exampleDetail: `In Measure ${(sample?.measureIndex ?? 0) + 1}, Left and Right hand attacks were separated by ${spreadVal} ms.`,
        recommendedVideoIds: [
          'vid-08-two-hand-independence',
          'vid-06-left-hand-anchor-and-groove',
        ],
      });
    }

    // 10. SHORT_NOTE_CLIPPING: check if long notes (half/whole) had missed/early release or rushed next beat
    const longNoteMisses = attempts.filter((a) => {
      const scoreNote = noteMap.get(a.noteId);
      return (
        scoreNote &&
        scoreNote.durationBeats >= 2 &&
        (a.status === 'missed' || a.timingErrorMs < -95)
      );
    });

    if (longNoteMisses.length >= 1) {
      const ex = longNoteMisses[0];
      const affected = Array.from(
        new Set(longNoteMisses.map((a) => a.measureIndex))
      ).sort((a, b) => a - b);

      issues.push({
        category: 'SHORT_NOTE_CLIPPING',
        severity: 'low',
        title: 'Sustained Note Clipped Early',
        diagnosisExplanation: `Longer half/whole notes like ${ex.expectedNoteName} in Measure ${ex.measureIndex + 1} were released or rushed before their full beat count finished.`,
        actionableFixTip:
          'Count the full duration aloud ("1 - 2" for half notes, "1 - 2 - 3 - 4" for whole notes) while keeping your finger weight resting in the keybed.',
        affectedMeasures: affected,
        exampleDetail: `In Measure ${ex.measureIndex + 1}, sustained note ${ex.expectedNoteName} was clipped short.`,
        recommendedVideoIds: ['vid-04-rhythm-pulse-breathing'],
      });
    }

    return issues;
  }

  private collectRecommendedVideos(issues: DetectedIssue[]): string[] {
    const seen = new Set<string>();
    for (const issue of issues) {
      for (const vid of issue.recommendedVideoIds) {
        seen.add(vid);
      }
    }
    if (seen.size === 0) {
      seen.add('vid-01-posture-arch');
      seen.add('vid-04-rhythm-pulse-breathing');
    }
    return Array.from(seen);
  }

  private buildRemediationPlan(
    score: ScoreData,
    attempts: NoteAttemptRecord[],
    measureSummaries: MeasureHealthSummary[],
    detectedIssues: DetectedIssue[],
    recommendedVideos: string[]
  ): RemediationPlan | null {
    if (measureSummaries.length === 0) return null;

    // Find the single highest-trouble measure or 2-measure pair
    let bestStart = 0;
    let bestEnd = Math.min(score.totalMeasures - 1, 1);
    let highestPairScore = -1;

    for (let i = 0; i < measureSummaries.length; i++) {
      const singleScore = measureSummaries[i].troubleScore;
      const pairScore =
        i + 1 < measureSummaries.length
          ? (singleScore + measureSummaries[i + 1].troubleScore) / 2
          : singleScore;

      if (pairScore > highestPairScore) {
        highestPairScore = pairScore;
        bestStart = i;
        bestEnd =
          i + 1 < measureSummaries.length &&
          measureSummaries[i + 1].troubleScore >= 20
            ? i + 1
            : i;
      }
    }

    const measureRange: [number, number] = [bestStart, bestEnd];

    // Determine focus hand in trouble range
    const rangeAttempts = attempts.filter(
      (a) => a.measureIndex >= bestStart && a.measureIndex <= bestEnd
    );
    const handsUsed = new Set(rangeAttempts.map((a) => a.hand));
    let focusHand: Hand = 'both';
    if (handsUsed.size === 1) {
      focusHand = rangeAttempts[0]?.hand ?? 'right';
    }

    const measureLabel =
      bestStart === bestEnd
        ? `Measure ${bestStart + 1}`
        : `Measures ${bestStart + 1}–${bestEnd + 1}`;

    const primaryIssueTitle =
      detectedIssues[0]?.title ?? 'Precision & Flow Polish';

    const stages: RemediationStage[] = [
      {
        stageNumber: 1,
        title: 'Stage 1: Wait Mode Isolation',
        subtitle: `Walk through ${measureLabel} note-by-note with zero clock pressure and finger guides.`,
        mode: 'wait_mode',
        tempoMultiplier: 0.5,
        handFilter: focusHand,
        measureRange,
        targetCleanReps: 1,
      },
      {
        stageNumber: 2,
        title: 'Stage 2: Slow Groove Loop @ 60%',
        subtitle: `Loop ${measureLabel} at 60% tempo with the metronome until 2 clean passes feel effortless.`,
        mode: 'slow_practice',
        tempoMultiplier: 0.6,
        handFilter: focusHand,
        measureRange,
        targetCleanReps: 2,
      },
      {
        stageNumber: 3,
        title: 'Stage 3: Tempo Bridge @ 90%',
        subtitle: `Bridge ${measureLabel} up to 90% concert speed to lock in muscle memory.`,
        mode: 'slow_practice',
        tempoMultiplier: 0.9,
        handFilter: 'both',
        measureRange,
        targetCleanReps: 1,
      },
    ];

    return {
      id: `remediation-${score.id}-m${bestStart + 1}-m${bestEnd + 1}`,
      title: `3-Stage Micro-Drill: ${measureLabel} (${primaryIssueTitle})`,
      summary: `We isolated ${measureLabel} where most hesitations occurred. Complete these 3 progressive reps to turn this tricky spot into your strongest measure.`,
      measureRange,
      focusHand,
      stages,
      linkedVideoIds: recommendedVideos.slice(0, 2),
    };
  }

  private buildCoachingCopy(
    score: ScoreData,
    firstTryPct: number,
    overallAccuracyPct: number,
    starsEarned: 0 | 1 | 2 | 3,
    detectedIssues: DetectedIssue[],
    troubleMeasures: number[]
  ): { encouragementHeadline: string; teacherSummary: string } {
    if (starsEarned === 3 && detectedIssues.length === 0) {
      return {
        encouragementHeadline: 'Concert-Hall Brilliance! Clean First-Try Mastery',
        teacherSummary: `You played "${score.title}" with ${firstTryPct}% first-try accuracy and poised rhythmic control. Your hand arch and landmark placement are rock-solid!`,
      };
    }

    if (detectedIssues.length > 0) {
      const topIssue = detectedIssues[0];
      const barList =
        troubleMeasures.length > 0
          ? troubleMeasures.map((m) => `Measure ${m + 1}`).join(' & ')
          : `Measure ${(topIssue.affectedMeasures[0] ?? 0) + 1}`;

      return {
        encouragementHeadline: `Great Musical Effort! Let's Smooth Out ${barList}`,
        teacherSummary: `You reached ${overallAccuracyPct}% overall accuracy on "${score.title}". I noticed a ${topIssue.title.toLowerCase()} in ${barList}—launch the 3-Stage Fix Drill below to master those exact notes in under 90 seconds.`,
      };
    }

    return {
      encouragementHeadline: 'Solid Foundation! Ready to Polish Your Timing',
      teacherSummary: `You completed "${score.title}" with ${overallAccuracyPct}% accuracy. Try one more pass focusing on relaxed shoulders and steady counting.`,
    };
  }
}
