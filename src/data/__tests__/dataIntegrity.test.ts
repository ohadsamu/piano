import { describe, expect, it } from 'vitest';
import type { ScoreData } from '../../types';
import { midiToNoteName } from '../../utils/midiUtils';
import { CURRICULUM_LESSONS } from '../curriculumData';
import { SONG_LIBRARY } from '../songLibraryData';
import { VIDEO_LESSONS } from '../videoLibraryData';
import { DAILY_WORKOUTS } from '../workoutData';

/** On-screen keyboard range: C3 (48) to B5 (83). */
const MIN_MIDI = 48;
const MAX_MIDI = 83;
const EPS = 1e-9;

const videoIds = new Set(VIDEO_LESSONS.map((v) => v.id));
const lessonIds = new Set(CURRICULUM_LESSONS.map((l) => l.id));

const allScores: ScoreData[] = [
  ...CURRICULUM_LESSONS.map((l) => l.score),
  ...SONG_LIBRARY.map((s) => s.score),
  ...VIDEO_LESSONS.map((v) => v.interactiveDemoScore),
];

function expectInRange(midi: number, where: string) {
  expect(Number.isInteger(midi), `${where}: midi ${midi} is not an integer`).toBe(true);
  expect(midi >= MIN_MIDI && midi <= MAX_MIDI, `${where}: midi ${midi} outside ${MIN_MIDI}-${MAX_MIDI}`).toBe(true);
}

describe('ids are unique and resolve', () => {
  it('top-level ids are unique', () => {
    for (const ids of [
      CURRICULUM_LESSONS.map((l) => l.id),
      SONG_LIBRARY.map((s) => s.id),
      VIDEO_LESSONS.map((v) => v.id),
      DAILY_WORKOUTS.map((w) => w.id),
      allScores.map((s) => s.id),
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('lesson video references resolve', () => {
    for (const lesson of CURRICULUM_LESSONS) {
      expect(videoIds.has(lesson.primaryVideoId), `${lesson.id} primaryVideoId`).toBe(true);
      for (const id of lesson.remedialVideoIds) {
        expect(videoIds.has(id), `${lesson.id} remedial ${id}`).toBe(true);
      }
      for (const step of lesson.steps) {
        if (step.videoId) expect(videoIds.has(step.videoId), `${step.id} videoId`).toBe(true);
      }
    }
  });

  it('song and video cross-references resolve', () => {
    for (const song of SONG_LIBRARY) {
      expect(videoIds.has(song.recommendedVideoId), `${song.id} recommendedVideoId`).toBe(true);
    }
    for (const video of VIDEO_LESSONS) {
      for (const id of video.linkedLessonIds) {
        expect(lessonIds.has(id), `${video.id} linked lesson ${id}`).toBe(true);
      }
    }
  });

  it('step and prompt ids are unique within a lesson', () => {
    for (const lesson of CURRICULUM_LESSONS) {
      const stepIds = lesson.steps.map((s) => s.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
      const promptIds = lesson.steps.flatMap((s) => s.discoveryPrompts ?? []).map((p) => p.id);
      expect(new Set(promptIds).size).toBe(promptIds.length);
    }
  });
});

describe('lessons are completable', () => {
  it('has five ordered steps, key discovery prompts are non-empty', () => {
    for (const lesson of CURRICULUM_LESSONS) {
      expect(lesson.steps.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5]);
      for (const step of lesson.steps) {
        expect(step.instruction.trim().length, `${step.id} instruction`).toBeGreaterThan(0);
        if (step.type === 'key_discovery') {
          expect(step.discoveryPrompts?.length ?? 0, `${step.id} prompts`).toBeGreaterThan(0);
        }
        if (step.type === 'video_intro') {
          expect(step.videoId, `${step.id} videoId`).toBeTruthy();
        }
      }
    }
  });

  it('discovery prompts are in range and name the right key', () => {
    for (const lesson of CURRICULUM_LESSONS) {
      for (const prompt of lesson.steps.flatMap((s) => s.discoveryPrompts ?? [])) {
        expectInRange(prompt.targetMidi, prompt.id);
        expect(prompt.targetNoteName, prompt.id).toBe(midiToNoteName(prompt.targetMidi));
      }
    }
  });

  it('every hand a step asks for has notes in the score', () => {
    for (const lesson of CURRICULUM_LESSONS) {
      for (const step of lesson.steps) {
        if (!step.handFilter || step.handFilter === 'both') continue;
        const count = lesson.score.notes.filter((n) => n.hand === step.handFilter).length;
        expect(count, `${step.id} has no ${step.handFilter}-hand notes`).toBeGreaterThan(0);
      }
    }
  });

  it('score note names are listed in the lesson targetNotes', () => {
    for (const lesson of CURRICULUM_LESSONS) {
      const targets = new Set(lesson.targetNotes);
      for (const note of lesson.score.notes) {
        expect(targets.has(note.noteName), `${lesson.id}: ${note.noteName} missing from targetNotes`).toBe(true);
      }
    }
  });
});

describe('scores', () => {
  it.each(allScores.map((s) => [s.id, s] as const))('%s is well formed', (_id, score) => {
    const [beatsPerBar, beatUnit] = score.timeSignature;
    expect(beatUnit).toBe(4);
    expect(score.notes.length).toBeGreaterThan(0);
    expect(score.totalBeats).toBe(score.totalMeasures * beatsPerBar);

    const noteIds = score.notes.map((n) => n.id);
    expect(new Set(noteIds).size, `${score.id} duplicate note ids`).toBe(noteIds.length);

    const beatsUsed = new Map<string, number>();
    for (const note of score.notes) {
      const where = `${score.id} ${note.id}`;
      expectInRange(note.midi, where);
      expect(note.noteName, where).toBe(midiToNoteName(note.midi));
      expect(note.durationBeats, where).toBeGreaterThan(0);
      expect([1, 2, 3, 4, 5]).toContain(note.finger);

      // The note starts in its own measure and does not cross the next barline.
      const barStart = note.measureIndex * beatsPerBar;
      const barEnd = barStart + beatsPerBar;
      expect(note.measureIndex >= 0 && note.measureIndex < score.totalMeasures, where).toBe(true);
      expect(note.beatStart >= barStart - EPS, `${where} starts before its measure`).toBe(true);
      expect(note.beatStart < barEnd - EPS, `${where} starts after its measure`).toBe(true);
      expect(note.beatStart + note.durationBeats <= barEnd + EPS, `${where} crosses the barline`).toBe(true);

      const key = `${note.measureIndex}|${note.hand}|${note.beatStart}`;
      // Count each onset once per hand (chord tones share an onset).
      if (!beatsUsed.has(key)) beatsUsed.set(key, note.durationBeats);
    }

    // Per hand and measure, the sounding melody line must fit in the bar.
    const perBar = new Map<string, number>();
    for (const [key, dur] of beatsUsed) {
      const [m, hand] = key.split('|');
      perBar.set(`${m}|${hand}`, (perBar.get(`${m}|${hand}`) ?? 0) + dur);
    }
    for (const [key, total] of perBar) {
      expect(total <= beatsPerBar + EPS, `${score.id} measure/hand ${key} has ${total} beats`).toBe(true);
    }

    for (const acc of score.accompaniment) {
      expect(acc.beatStart + acc.durationBeats <= score.totalBeats + EPS, `${score.id} accompaniment past end`).toBe(true);
      expect(acc.midiNotes.length).toBeGreaterThan(0);
    }
  });

  it('single-line melodies with no rests fill every measure exactly', () => {
    // These melodies have one right-hand note at a time and no rests, so each
    // measure's right-hand beats must add up to the time signature exactly.
    const exact = [
      'score-lesson-01-middle-c-walk',
      'score-lesson-02-ode-to-joy',
      'score-lesson-03-bass-clef-anchors',
      'score-lesson-07-two-hand-conversation',
      'song-score-twinkle-twinkle',
      'song-score-jingle-bells',
      'song-score-canon-in-d',
    ];
    for (const id of exact) {
      const score = allScores.find((s) => s.id === id);
      expect(score, id).toBeDefined();
      const [beatsPerBar] = score!.timeSignature;
      for (let m = 0; m < score!.totalMeasures; m++) {
        const sum = score!.notes
          .filter((n) => n.measureIndex === m && n.hand === 'right')
          .reduce((acc, n) => acc + n.durationBeats, 0);
        expect(sum, `${id} measure ${m + 1}`).toBeCloseTo(beatsPerBar, 9);
      }
    }
  });
});

describe('videos and workouts', () => {
  it('video checkpoints and chapter demos are playable', () => {
    for (const video of VIDEO_LESSONS) {
      const cp = video.interactiveCheckpoint;
      expect(cp.targetMidis.length).toBeGreaterThan(0);
      expect(cp.targetNoteNames.length).toBe(cp.targetMidis.length);
      expect(cp.fingers.length).toBe(cp.targetMidis.length);
      cp.targetMidis.forEach((midi, i) => {
        expectInRange(midi, `${video.id} checkpoint`);
        expect(cp.targetNoteNames[i]).toBe(midiToNoteName(midi));
      });
      for (const chapter of video.chapters) {
        expect(chapter.demoNotesMidi.length).toBeGreaterThan(0);
        chapter.demoNotesMidi.forEach((midi) => expectInRange(midi, `${video.id} ${chapter.title}`));
      }
    }
  });

  it('workout cards are playable', () => {
    for (const workout of DAILY_WORKOUTS) {
      expect(workout.cards.length).toBeGreaterThan(0);
      const cardIds = workout.cards.map((c) => c.id);
      expect(new Set(cardIds).size).toBe(cardIds.length);
      for (const card of workout.cards) {
        expect(card.targetMidis.length, card.id).toBeGreaterThan(0);
        expect(card.targetNoteNames.length, card.id).toBe(card.targetMidis.length);
        expect(card.fingers.length, card.id).toBe(card.targetMidis.length);
        card.targetMidis.forEach((midi, i) => {
          expectInRange(midi, card.id);
          expect(card.targetNoteNames[i], card.id).toBe(midiToNoteName(midi));
        });
        if (card.anchorMidi !== undefined) {
          expectInRange(card.anchorMidi, `${card.id} anchor`);
          expect(card.anchorNoteName, card.id).toBe(midiToNoteName(card.anchorMidi));
        }
      }
    }
  });
});
