import { describe, expect, it, vi } from 'vitest';
import { PracticeEngine } from '../PracticeEngine';
import { CoachDiagnosisEngine } from '../CoachDiagnosisEngine';
import { InputManager } from '../InputManager';
import { CURRICULUM_LESSONS } from '../../data';
import type {
  NoteInputEvent,
  RemediationPlan,
  ScoreData,
  ScoreNoteEvent,
} from '../../types';

function note(
  id: string,
  midi: number,
  beatStart: number,
  hand: 'left' | 'right' = 'right'
): ScoreNoteEvent {
  return {
    id,
    midi,
    noteName: String(midi),
    measureIndex: Math.floor(beatStart / 4),
    beatStart,
    durationBeats: 1,
    durationType: 'quarter',
    hand,
    clef: hand === 'left' ? 'bass' : 'treble',
    finger: 1,
  };
}

function score(notes: ScoreNoteEvent[], totalMeasures = 2): ScoreData {
  return {
    id: 'stall-test',
    title: 'Stall Test',
    subtitle: '',
    bpm: 60,
    timeSignature: [4, 4],
    keySignature: 'C',
    totalMeasures,
    totalBeats: totalMeasures * 4,
    notes,
    accompaniment: [],
  };
}

const on = (midi: number, source: NoteInputEvent['source'] = 'qwerty', ts = 0): NoteInputEvent => ({
  type: 'note_on',
  midi,
  noteName: String(midi),
  frequencyHz: 440,
  velocity: 0.8,
  source,
  timestampMs: ts,
});
const off = (midi: number, source: NoteInputEvent['source'] = 'qwerty', ts = 0): NoteInputEvent => ({
  ...on(midi, source, ts),
  type: 'note_off',
});

function press(engine: PracticeEngine, midi: number) {
  engine.handleNoteInput(on(midi));
  return engine.handleNoteInput(off(midi));
}

const threeNotes = () =>
  score([note('a', 60, 0), note('b', 62, 1), note('c', 64, 2)], 1);

describe('PracticeEngine: progress stalls', () => {
  it('resume() after a completed pass restarts the pass instead of a dead "playing" state', () => {
    const engine = new PracticeEngine(threeNotes());
    engine.startPractice('wait_mode');
    press(engine, 60);
    press(engine, 62);
    const done = press(engine, 64);
    expect(done.isCompleted).toBe(true);

    engine.resume();
    const snap = engine.tick(16);
    expect(snap.isCompleted).toBe(false);
    expect(snap.isPlaying).toBe(true);
    expect(snap.activeTargetMidis).toEqual([60]);
    const after = press(engine, 60);
    expect(after.noteStatuses['a']).toBe('correct_first_try');
    expect(after.activeTargetMidis).toEqual([62]);
  });

  it('setLoopRange / setHandFilter after completion re-arm the session so input is accepted', () => {
    const s = score([note('a', 60, 0), note('b', 48, 0, 'left'), note('c', 62, 4)], 2);
    const engine = new PracticeEngine(s);
    engine.startPractice('wait_mode');
    press(engine, 60);
    press(engine, 48);
    expect(press(engine, 62).isCompleted).toBe(true);

    engine.setLoopRange([1, 1]);
    let snap = engine.getSnapshot();
    expect(snap.isCompleted).toBe(false);
    expect(snap.isPlaying).toBe(true);
    expect(press(engine, 62).isCompleted).toBe(true);

    engine.setHandFilter('right');
    engine.setLoopRange(null);
    snap = engine.getSnapshot();
    expect(snap.isCompleted).toBe(false);
    snap = press(engine, 60);
    expect(snap.noteStatuses['a']).toBe('correct_first_try');
  });

  it('setMode after completion starts the new mode (not a stopped/completed limbo)', () => {
    const engine = new PracticeEngine(threeNotes());
    engine.startPractice('wait_mode');
    press(engine, 60);
    press(engine, 62);
    press(engine, 64);
    engine.setMode('performance');
    const snap = engine.tick(16);
    expect(snap.isCompleted).toBe(false);
    expect(snap.isPlaying).toBe(true);
    expect(snap.currentBeat).toBeGreaterThan(0);
  });

  it('stop() then resume() is playable again', () => {
    const engine = new PracticeEngine(threeNotes());
    engine.startPractice('wait_mode');
    press(engine, 60);
    press(engine, 62);
    press(engine, 64);
    engine.stop();
    engine.resume();
    expect(press(engine, 60).noteStatuses['a']).toBe('correct_first_try');
  });

  it('tick() clamps huge deltas (backgrounded tab / rAF resume) so a moving pass is not fast-forwarded to all-missed', () => {
    const engine = new PracticeEngine(threeNotes());
    const onComplete = vi.fn();
    engine.setCallbacks({ onSessionComplete: onComplete });
    engine.startPractice('performance', { tempoMultiplier: 1 });
    const snap = engine.tick(60_000);
    expect(snap.isCompleted).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
    expect(snap.currentBeat).toBeLessThan(0.5);
  });

  it('performance mode reaches the end and fires onSessionComplete exactly once', () => {
    const engine = new PracticeEngine(threeNotes());
    const onComplete = vi.fn();
    engine.setCallbacks({ onSessionComplete: onComplete });
    engine.startPractice('performance', { tempoMultiplier: 1 });
    for (let i = 0; i < 400; i++) engine.tick(16); // 6.4s @60bpm > 4 beats
    expect(engine.getSnapshot().isCompleted).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('wait mode: a slow beginner with no wrong notes still scores first-try (hesitation alone is not a fault)', () => {
    const lesson = CURRICULUM_LESSONS[0];
    const engine = new PracticeEngine(lesson.score);
    let attempts: Parameters<NonNullable<Parameters<PracticeEngine['setCallbacks']>[0]['onSessionComplete']>>[0] = [];
    engine.setCallbacks({ onSessionComplete: (a) => (attempts = a) });
    engine.startPractice('wait_mode', { lessonStep: lesson.steps[2] });
    const ordered = [...lesson.score.notes].sort((a, b) => a.beatStart - b.beatStart);
    for (const n of ordered) {
      for (let t = 0; t < 2500; t += 100) engine.tick(100); // hint fires at 2200ms
      press(engine, n.midi);
    }
    expect(engine.getSnapshot().isCompleted).toBe(true);
    const report = new CoachDiagnosisEngine().analyzeSession(lesson.score, attempts, 'wait_mode');
    expect(report.firstTryPct).toBe(100);
    expect(attempts.every((a) => a.hesitationMs >= 2200)).toBe(true);
  });

  it('wait mode: a wrong note before the right one is still correct_after_hint', () => {
    const engine = new PracticeEngine(threeNotes());
    engine.startPractice('wait_mode');
    engine.handleNoteInput(on(61));
    expect(press(engine, 60).noteStatuses['a']).toBe('correct_after_hint');
  });

  it('snapshot exposes pass-scoped progress (hand filter + loop aware)', () => {
    const s = score(
      [note('a', 60, 0), note('b', 48, 0, 'left'), note('c', 62, 1), note('d', 64, 4)],
      2
    );
    const engine = new PracticeEngine(s);
    engine.startPractice('wait_mode', { handFilter: 'right', loopRange: null });
    let snap = engine.getSnapshot();
    expect(snap.totalNoteCount).toBe(3);
    expect(snap.completedNoteCount).toBe(0);
    expect(snap.progressPct).toBe(0);
    snap = press(engine, 60);
    expect(snap.completedNoteCount).toBe(1);
    expect(snap.progressPct).toBe(33);
    press(engine, 62);
    snap = press(engine, 64);
    expect(snap.isCompleted).toBe(true);
    expect(snap.completedNoteCount).toBe(3);
    expect(snap.progressPct).toBe(100);

    engine.startPractice('wait_mode', { handFilter: 'both', loopRange: [1, 1] });
    snap = engine.getSnapshot();
    expect(snap.totalNoteCount).toBe(1);
  });

  it('wait mode with zero playable notes does not fake a completion on the first key press', () => {
    const s = score([note('a', 60, 0)], 1);
    const engine = new PracticeEngine(s);
    const onComplete = vi.fn();
    engine.setCallbacks({ onSessionComplete: onComplete });
    engine.startPractice('wait_mode', { handFilter: 'left' });
    const snap = press(engine, 60);
    expect(snap.totalNoteCount).toBe(0);
    expect(snap.isCompleted).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('wait mode chord: needs every chord note, in any order, then advances', () => {
    const s = score([note('c', 60, 0), note('e', 64, 0), note('g', 67, 0), note('n', 62, 1)], 1);
    const engine = new PracticeEngine(s);
    engine.startPractice('wait_mode');
    engine.handleNoteInput(on(67));
    engine.handleNoteInput(on(60));
    let snap = engine.getSnapshot();
    expect(snap.activeTargetMidis).toEqual([64]);
    snap = engine.handleNoteInput(on(64));
    expect(snap.activeTargetMidis).toEqual([62]);
  });

  it('wait mode: the mic hearing our own hint cue does not satisfy the target', () => {
    const engine = new PracticeEngine(threeNotes(), { playCoachCue: vi.fn() });
    engine.startPractice('wait_mode');
    for (let t = 0; t < 2300; t += 100) engine.tick(100);
    let snap = engine.handleNoteInput(on(60, 'microphone'));
    expect(snap.noteStatuses['a']).toBe('hint_active');
    engine.handleNoteInput(off(60, 'microphone'));
    for (let t = 0; t < 1000; t += 100) engine.tick(100);
    snap = engine.handleNoteInput(on(60, 'microphone')); // real strike after the echo window
    expect(snap.noteStatuses['a']).toBe('correct_first_try');
  });

    it('wait mode repeated note (E E): one press advances only one group', () => {
    const s = score([note('e1', 64, 0), note('e2', 64, 1), note('f', 65, 2)], 1);
    const engine = new PracticeEngine(s);
    engine.startPractice('wait_mode');
    const snap = press(engine, 64);
    expect(snap.noteStatuses['e1']).toBe('correct_first_try');
    expect(snap.noteStatuses['e2']).toBe('active_target');
  });

  it('remediation drill: a stage whose range has no notes for the stage hand does not loop forever', () => {
    const s = score([note('a', 60, 0), note('b', 62, 4)], 2);
    const plan: RemediationPlan = {
      id: 'p',
      title: 'p',
      summary: '',
      measureRange: [0, 0],
      focusHand: 'left',
      linkedVideoIds: [],
      stages: [
        { stageNumber: 1, title: '', subtitle: '', mode: 'wait_mode', tempoMultiplier: 0.5, handFilter: 'left', measureRange: [0, 0], targetCleanReps: 1 },
        { stageNumber: 2, title: '', subtitle: '', mode: 'slow_practice', tempoMultiplier: 0.6, handFilter: 'left', measureRange: [0, 0], targetCleanReps: 2 },
        { stageNumber: 3, title: '', subtitle: '', mode: 'slow_practice', tempoMultiplier: 0.9, handFilter: 'both', measureRange: [0, 0], targetCleanReps: 1 },
      ],
    };
    const engine = new PracticeEngine(s);
    const onComplete = vi.fn();
    engine.setCallbacks({ onSessionComplete: onComplete });
    engine.startRemediationPlan(plan);
    // Stages 1-2 are empty for the left hand; they must be skipped, landing on stage 3 (both hands).
    let snap = engine.getSnapshot();
    expect(snap.remediationStageIndex).toBe(2);
    for (let i = 0; i < 600 && !snap.isCompleted; i++) {
      snap = engine.tick(16);
      if (snap.activeTargetMidis.includes(60) && snap.noteStatuses['a'] === 'active_target') {
        snap = engine.handleNoteInput(on(60));
      }
    }
    expect(snap.isCompleted).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('InputManager: microphone double-trigger', () => {
  function makeManager() {
    const audio = {
      noteOn: vi.fn(),
      noteOff: vi.fn(),
      setSustainPedal: vi.fn(),
      stopAll: vi.fn(),
      init: vi.fn(async () => {}),
      getAudioContext: () => null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mgr = new InputManager(audio as any);
    const received: NoteInputEvent[] = [];
    mgr.onNoteEvent((e) => received.push(e));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inject = (e: NoteInputEvent) => (mgr as any).handleIncomingNoteEvent(e);
    return { mgr, received, inject };
  }

  it('drops a mic note_on that echoes a QWERTY/virtual/MIDI note just played (synth through speakers)', () => {
    const { received, inject } = makeManager();
    inject(on(64, 'qwerty', 1000));
    inject(on(64, 'microphone', 1080)); // mic hears the synth
    inject(off(64, 'qwerty', 1200));
    inject(off(64, 'microphone', 1500));
    const ons = received.filter((e) => e.type === 'note_on');
    expect(ons.map((e) => e.source)).toEqual(['qwerty']);
    // The paired mic note_off is swallowed too, so consumers never see an orphan off.
    expect(received.filter((e) => e.source === 'microphone')).toHaveLength(0);
  });

  it('still passes a genuine mic note when no other source played that pitch', () => {
    const { received, inject } = makeManager();
    inject(on(64, 'qwerty', 1000));
    inject(off(64, 'qwerty', 1200));
    inject(on(65, 'microphone', 1050));
    inject(on(64, 'microphone', 5000)); // long after: real re-strike
    expect(received.filter((e) => e.source === 'microphone').map((e) => e.midi)).toEqual([65, 64]);
  });
});
