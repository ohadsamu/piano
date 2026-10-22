import { describe, expect, it, vi } from 'vitest';
import { PracticeEngine } from '../PracticeEngine';
import { CoachDiagnosisEngine } from '../CoachDiagnosisEngine';
import type { NoteAttemptRecord, NoteInputEvent, ScoreData } from '../../types';

function createTestScore(): ScoreData {
  return {
    id: 'test-c-major-walk',
    title: 'Middle C Walk',
    subtitle: 'Beginner Five-Finger Pattern',
    bpm: 80,
    timeSignature: [4, 4],
    keySignature: 'C',
    totalMeasures: 2,
    totalBeats: 8,
    notes: [
      {
        id: 'm0-b0-rh-60',
        midi: 60,
        noteName: 'C4',
        measureIndex: 0,
        beatStart: 0,
        durationBeats: 1,
        durationType: 'quarter',
        hand: 'right',
        clef: 'treble',
        finger: 1,
      },
      {
        id: 'm0-b1-rh-62',
        midi: 62,
        noteName: 'D4',
        measureIndex: 0,
        beatStart: 1,
        durationBeats: 1,
        durationType: 'quarter',
        hand: 'right',
        clef: 'treble',
        finger: 2,
      },
      {
        id: 'm0-b2-rh-64',
        midi: 64,
        noteName: 'E4',
        measureIndex: 0,
        beatStart: 2,
        durationBeats: 2,
        durationType: 'half',
        hand: 'right',
        clef: 'treble',
        finger: 3,
      },
      {
        id: 'm1-b4-rh-65',
        midi: 65,
        noteName: 'F4',
        measureIndex: 1,
        beatStart: 4,
        durationBeats: 2,
        durationType: 'half',
        hand: 'right',
        clef: 'treble',
        finger: 4,
      },
      {
        id: 'm1-b6-rh-67',
        midi: 67,
        noteName: 'G4',
        measureIndex: 1,
        beatStart: 6,
        durationBeats: 2,
        durationType: 'half',
        hand: 'right',
        clef: 'treble',
        finger: 5,
      },
    ],
    accompaniment: [
      {
        beatStart: 0,
        durationBeats: 4,
        midiNotes: [48, 55],
        style: 'warm_pad',
        velocity: 0.45,
      },
      {
        beatStart: 4,
        durationBeats: 4,
        midiNotes: [43, 55],
        style: 'warm_pad',
        velocity: 0.45,
      },
    ],
  };
}

function makeNoteOn(midi: number, timestampMs = 100): NoteInputEvent {
  return {
    type: 'note_on',
    midi,
    noteName: 'C4',
    frequencyHz: 261.63,
    velocity: 0.8,
    source: 'midi',
    timestampMs,
  };
}

describe('PracticeEngine', () => {
  it('in wait_mode: marks first-try right note as correct_first_try and advances playhead', () => {
    const score = createTestScore();
    const engine = new PracticeEngine(score);
    const snap0 = engine.startPractice('wait_mode');

    expect(snap0.currentBeat).toBe(0);
    expect(snap0.noteStatuses['m0-b0-rh-60']).toBe('active_target');

    // Play C4 (60) on first try
    const snap1 = engine.handleNoteInput(makeNoteOn(60, 150));
    expect(snap1.noteStatuses['m0-b0-rh-60']).toBe('correct_first_try');
    expect(snap1.currentBeat).toBe(1);
    expect(snap1.noteStatuses['m0-b1-rh-62']).toBe('active_target');
    expect(snap1.streak).toBe(1);
  });

  it('in wait_mode: wrong note produces LiveCorrectionFeedback with directional arrow, sets target to hint_active, and subsequent right note marks correct_after_hint', () => {
    const score = createTestScore();
    const engine = new PracticeEngine(score);
    engine.startPractice('wait_mode');

    // Advance past beat 0 (C4) cleanly
    engine.handleNoteInput(makeNoteOn(60, 100));

    // At beat 1, target is D4 (62). Play E4 (64) instead -> 2 semitones too high
    const wrongSnap = engine.handleNoteInput(makeNoteOn(64, 250));
    expect(wrongSnap.noteStatuses['m0-b1-rh-62']).toBe('hint_active');
    expect(wrongSnap.wrongPlayedMidis).toContain(64);
    expect(wrongSnap.liveCorrection).not.toBeNull();
    expect(wrongSnap.liveCorrection?.expectedNote.midi).toBe(62);
    expect(wrongSnap.liveCorrection?.playedMidi).toBe(64);
    expect(wrongSnap.liveCorrection?.direction).toBe('left');
    expect(wrongSnap.liveCorrection?.actionInstruction).toContain('LEFT to D4');
    expect(wrongSnap.currentBeat).toBe(1); // Playhead waits!

    // Now play the correct note D4 (62)
    const fixedSnap = engine.handleNoteInput(makeNoteOn(62, 500));
    expect(fixedSnap.noteStatuses['m0-b1-rh-62']).toBe('correct_after_hint');
    expect(fixedSnap.currentBeat).toBe(2); // Playhead advances to beat 2 (E4)
    expect(fixedSnap.noteStatuses['m0-b2-rh-64']).toBe('active_target');

    const attempts = engine.getAttemptRecords();
    const d4Record = attempts.find((a) => a.noteId === 'm0-b1-rh-62');
    expect(d4Record?.status).toBe('correct_after_hint');
    expect(d4Record?.wrongMidisPlayed).toEqual([64]);
    expect(d4Record?.firstSemitoneDelta).toBe(2);
  });

  it('in wait_mode: triggers hint_active when user hesitates > 2200ms', () => {
    const score = createTestScore();
    const engine = new PracticeEngine(score);
    engine.startPractice('wait_mode');

    const snapBefore = engine.tick(1800);
    expect(snapBefore.noteStatuses['m0-b0-rh-60']).toBe('active_target');

    const snapAfter = engine.tick(600); // Total 2400ms > 2200ms
    expect(snapAfter.noteStatuses['m0-b0-rh-60']).toBe('hint_active');
    expect(snapAfter.hintedMidis).toContain(60);
  });

  it('in auto_demo: automatically plays notes via AudioEngine and marks them correct_first_try', () => {
    const score = createTestScore();
    const playNoteSpy = vi.fn();
    const playMetronomeSpy = vi.fn();
    const engine = new PracticeEngine(score, {
      playNote: playNoteSpy,
      playMetronomeClick: playMetronomeSpy,
    });

    engine.startPractice('auto_demo', { tempoMultiplier: 1.0 });

    // At 80 BPM, 1 beat = 750ms. Tick 800ms to cross beat 0 and beat 1
    const snap = engine.tick(800);
    expect(playNoteSpy).toHaveBeenCalled();
    expect(playMetronomeSpy).toHaveBeenCalled();
    expect(snap.noteStatuses['m0-b0-rh-60']).toBe('correct_first_try');
  });

  it('in remediation_drill: progresses across all 3 stages when clean passes are completed', () => {
    const score = createTestScore();
    const coach = new CoachDiagnosisEngine();
    const { report } = coach.createSyntheticMistakeDemo(score);
    expect(report.remediationPlan).not.toBeNull();

    const plan = report.remediationPlan!;
    // Restrict plan to measure 0 only for quick test traversal
    plan.measureRange = [0, 0];
    plan.stages.forEach((s) => {
      s.measureRange = [0, 0];
    });

    const engine = new PracticeEngine(score);
    let snap = engine.startRemediationPlan(plan);
    expect(snap.mode).toBe('remediation_drill');
    expect(snap.remediationStageIndex).toBe(0);

    // Stage 1 is Wait Mode (1 clean rep on Measure 0: C4, D4, E4)
    engine.handleNoteInput(makeNoteOn(60));
    engine.handleNoteInput(makeNoteOn(62));
    snap = engine.handleNoteInput(makeNoteOn(64));

    // Should have automatically advanced to Stage 2 (index 1, slow_practice @ 0.6x)
    expect(snap.remediationStageIndex).toBe(1);
    expect(snap.tempoMultiplier).toBe(0.6);
  });
});

describe('CoachDiagnosisEngine', () => {
  it('accurately flags ADJACENT_KEY_SLIP, OCTAVE_SHIFT, and RUSHING_BEAT, identifies trouble measures, generates a 3-stage RemediationPlan, and recommends matching VideoLesson IDs', () => {
    const score = createTestScore();
    const coach = new CoachDiagnosisEngine();

    const attempts: NoteAttemptRecord[] = [
      // Measure 0, Beat 0: C4 played cleanly but rushing (-95ms)
      {
        noteId: 'm0-b0-rh-60',
        measureIndex: 0,
        beatStart: 0,
        expectedMidi: 60,
        expectedNoteName: 'C4',
        hand: 'right',
        finger: 1,
        status: 'correct_first_try',
        wrongMidisPlayed: [],
        firstSemitoneDelta: 0,
        timingErrorMs: -95,
        hesitationMs: 120,
        chordSpreadMs: 0,
      },
      // Measure 0, Beat 1: D4 had an OCTAVE_SHIFT (+12 semitones -> D5 / 74) and rushing (-90ms)
      {
        noteId: 'm0-b1-rh-62',
        measureIndex: 0,
        beatStart: 1,
        expectedMidi: 62,
        expectedNoteName: 'D4',
        hand: 'right',
        finger: 2,
        status: 'correct_after_hint',
        wrongMidisPlayed: [74],
        firstSemitoneDelta: 12,
        timingErrorMs: -90,
        hesitationMs: 800,
        chordSpreadMs: 0,
      },
      // Measure 0, Beat 2: E4 played cleanly
      {
        noteId: 'm0-b2-rh-64',
        measureIndex: 0,
        beatStart: 2,
        expectedMidi: 64,
        expectedNoteName: 'E4',
        hand: 'right',
        finger: 3,
        status: 'correct_first_try',
        wrongMidisPlayed: [],
        firstSemitoneDelta: 0,
        timingErrorMs: -40,
        hesitationMs: 150,
        chordSpreadMs: 0,
      },
      // Measure 1, Beat 4: F4 had ADJACENT_KEY_SLIP (+2 semitones -> G4 / 67)
      {
        noteId: 'm1-b4-rh-65',
        measureIndex: 1,
        beatStart: 4,
        expectedMidi: 65,
        expectedNoteName: 'F4',
        hand: 'right',
        finger: 4,
        status: 'correct_after_hint',
        wrongMidisPlayed: [67],
        firstSemitoneDelta: 2,
        timingErrorMs: -85,
        hesitationMs: 1600,
        chordSpreadMs: 0,
      },
      // Measure 1, Beat 6: G4 had ADJACENT_KEY_SLIP (-2 semitones -> F4 / 65)
      {
        noteId: 'm1-b6-rh-67',
        measureIndex: 1,
        beatStart: 6,
        expectedMidi: 67,
        expectedNoteName: 'G4',
        hand: 'right',
        finger: 5,
        status: 'correct_after_hint',
        wrongMidisPlayed: [65],
        firstSemitoneDelta: -2,
        timingErrorMs: -60,
        hesitationMs: 1550,
        chordSpreadMs: 0,
      },
    ];

    const report = coach.analyzeSession(score, attempts, 'performance');

    const categories = report.detectedIssues.map((i) => i.category);
    expect(categories).toContain('ADJACENT_KEY_SLIP');
    expect(categories).toContain('OCTAVE_SHIFT');
    expect(categories).toContain('RUSHING_BEAT');

    // Verify trouble measures identified
    expect(report.troubleMeasures).toContain(1);
    expect(report.measureSummaries[1].troubleScore).toBeGreaterThanOrEqual(30);

    // Verify 3-stage RemediationPlan
    expect(report.remediationPlan).not.toBeNull();
    expect(report.remediationPlan?.stages).toHaveLength(3);
    expect(report.remediationPlan?.stages[0].title).toContain(
      'Stage 1: Wait Mode Isolation'
    );
    expect(report.remediationPlan?.stages[1].title).toContain(
      'Stage 2: Slow Groove Loop @ 60%'
    );
    expect(report.remediationPlan?.stages[2].title).toContain(
      'Stage 3: Tempo Bridge @ 90%'
    );

    // Verify recommended canonical video IDs
    expect(report.recommendedVideos).toContain('vid-01-posture-arch');
    expect(report.recommendedVideos).toContain('vid-02-middle-c-landmark');
    expect(report.recommendedVideos).toContain('vid-04-rhythm-pulse-breathing');
  });
});
