import type {
  Clef,
  FingerNumber,
  Lesson,
  NoteDurationType,
  ScoreNoteEvent,
  SingleHand,
} from '../types';
import { inferClefForMidi, midiToNoteName } from '../utils/midiUtils';

function noteEvent(
  prefix: string,
  measureIndex: number,
  beatStart: number,
  durationBeats: number,
  midi: number,
  hand: SingleHand,
  finger: FingerNumber,
  opts?: {
    clef?: Clef;
    durationType?: NoteDurationType;
    chordSymbol?: string;
    techniqueTip?: string;
    lyric?: string;
  }
): ScoreNoteEvent {
  const durationType: NoteDurationType =
    opts?.durationType ??
    (durationBeats >= 4
      ? 'whole'
      : durationBeats >= 1.5
      ? 'half'
      : durationBeats >= 1
      ? 'quarter'
      : 'eighth');

  return {
    id: `${prefix}-m${measureIndex}-b${beatStart}-${hand}-${midi}`,
    midi,
    noteName: midiToNoteName(midi),
    measureIndex,
    beatStart,
    durationBeats,
    durationType,
    hand,
    clef: opts?.clef ?? inferClefForMidi(midi, hand),
    finger,
    chordSymbol: opts?.chordSymbol,
    techniqueTip: opts?.techniqueTip,
    lyric: opts?.lyric,
  };
}

export const CURRICULUM_LESSONS: Lesson[] = [
  {
    id: 'lesson-01-middle-c-walk',
    trackId: 'soloist',
    unitNumber: 1,
    title: 'Finding Middle C & The 3-Note Walk',
    subtitle: 'Anchor your Right Hand Thumb on C4 and walk across C4–D4–E4',
    description:
      'Locate the 2-black-key group ("chopsticks") near the center of the keyboard, anchor Right Hand Thumb (Finger 1) on Middle C (C4), and walk smoothly across C4–D4–E4 in a 4-measure promenade.',
    difficulty: 'Beginner 1',
    skillsTaught: [
      '2-Black-Key Chopsticks Landmark',
      'Middle C (C4) Ledger Line',
      'Right Hand Fingers 1–2–3 Arch',
      'Stepping Up & Down by Seconds',
    ],
    targetNotes: ['C4', 'D4', 'E4'],
    primaryVideoId: 'vid-02-middle-c-landmark',
    remedialVideoIds: ['vid-01-posture-arch', 'vid-04-rhythm-pulse-breathing'],
    score: {
      id: 'score-lesson-01-middle-c-walk',
      title: 'The 3-Note Promenade',
      subtitle: 'Lesson 1 · C Major · Right Hand 1–2–3',
      bpm: 68,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: E4 D4 C4(half)
        noteEvent('l01', 0, 0, 1, 64, 'right', 3, {
          chordSymbol: 'C',
          techniqueTip: 'Start on E4 with Middle Finger (3) curved gently',
          lyric: 'Step',
        }),
        noteEvent('l01', 0, 1, 1, 62, 'right', 2, {
          techniqueTip: 'Step 1 white key left to D4 with Index Finger (2)',
          lyric: 'down',
        }),
        noteEvent('l01', 0, 2, 2, 60, 'right', 1, {
          techniqueTip: 'Land on Middle C (C4) with Thumb (1) and hold 2 beats',
          lyric: 'home —',
        }),
        // Measure 2: E4 D4 C4(half)
        noteEvent('l01', 1, 4, 1, 64, 'right', 3, {
          chordSymbol: 'G7',
          lyric: 'Three',
        }),
        noteEvent('l01', 1, 5, 1, 62, 'right', 2, {
          lyric: 'white',
        }),
        noteEvent('l01', 1, 6, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          lyric: 'keys —',
        }),
        // Measure 3: C4 D4 E4 C4
        noteEvent('l01', 2, 8, 1, 60, 'right', 1, {
          chordSymbol: 'C',
          techniqueTip: 'Climb smoothly up from C4 (1) → D4 (2) → E4 (3)',
          lyric: 'Climb',
        }),
        noteEvent('l01', 2, 9, 1, 62, 'right', 2, {
          lyric: 'right',
        }),
        noteEvent('l01', 2, 10, 1, 64, 'right', 3, {
          lyric: 'up',
        }),
        noteEvent('l01', 2, 11, 1, 60, 'right', 1, {
          lyric: 'to',
        }),
        // Measure 4: D4 E4 C4(half)
        noteEvent('l01', 3, 12, 1, 62, 'right', 2, {
          chordSymbol: 'G7',
          lyric: 'D',
        }),
        noteEvent('l01', 3, 13, 1, 64, 'right', 3, {
          lyric: 'and',
        }),
        noteEvent('l01', 3, 14, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          techniqueTip: 'Hold the final Middle C for 2 full beats',
          lyric: 'rest —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55], style: 'warm_pad', velocity: 46 },
        { beatStart: 4, durationBeats: 2, midiNotes: [43, 50], style: 'bass_pulse', velocity: 48 },
        { beatStart: 6, durationBeats: 2, midiNotes: [48, 55], style: 'warm_pad', velocity: 46 },
        { beatStart: 8, durationBeats: 4, midiNotes: [48, 52, 55], style: 'arpeggio', velocity: 48 },
        { beatStart: 12, durationBeats: 2, midiNotes: [43, 53], style: 'bass_pulse', velocity: 48 },
        { beatStart: 14, durationBeats: 2, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 52 },
      ],
    },
    steps: [
      {
        id: 'l01-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: Finding Middle C & Hand Arch',
        instruction:
          'Watch how the 2-black-key landmark reveals Middle C (C4) and how your Right Hand forms a natural dome over C4, D4, and E4.',
        coachTip: 'Notice how Thumb (1) plays on its outer corner while Fingers 2 and 3 curve gently.',
        videoId: 'vid-02-middle-c-landmark',
      },
      {
        id: 'l01-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Anchor C4, D4, and E4',
        instruction:
          'Find the 2 black keys in the middle of your keyboard and press each highlighted key with the matching Right Hand finger.',
        coachTip: 'Keep all three fingers resting lightly on C4, D4, and E4 so your hand never jumps.',
        discoveryPrompts: [
          {
            id: 'l01-disc-1',
            targetMidi: 60,
            targetNoteName: 'C4',
            hand: 'right',
            finger: 1,
            instruction:
              'Find the group of 2 black keys in the middle. Press the white key just to their left: Middle C (C4) with Right Hand Thumb (Finger 1).',
            landmarkHint: 'White key immediately left of the center 2 black keys ("chopsticks")',
          },
          {
            id: 'l01-disc-2',
            targetMidi: 62,
            targetNoteName: 'D4',
            hand: 'right',
            finger: 2,
            instruction: 'Step 1 white key right to D4 with Index Finger (2).',
            landmarkHint: 'White key tucked right between the 2 black keys',
          },
          {
            id: 'l01-disc-3',
            targetMidi: 64,
            targetNoteName: 'E4',
            hand: 'right',
            finger: 3,
            instruction: 'Step 1 more white key right to E4 with Middle Finger (3).',
            landmarkHint: 'White key immediately right of the 2 black keys',
          },
        ],
      },
      {
        id: 'l01-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Untimed Note Walkthrough',
        instruction:
          'Play through all 4 measures at your own pace. The score freezes on every note until you play the right key.',
        coachTip: 'Start on E4 with Middle Finger (3), then walk down E4 → D4 → C4.',
        handFilter: 'right',
      },
      {
        id: 'l01-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 70% Guided Tempo (48 BPM)',
        instruction:
          'Play along with warm acoustic bass accompaniment at a relaxed 70% practice tempo.',
        coachTip: 'Hold the Half Notes on C4 at the end of Measures 1, 2, and 4 for two full beats.',
        tempoMultiplier: 0.7,
        handFilter: 'right',
      },
      {
        id: 'l01-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 68 BPM Conservatory Check',
        instruction:
          'Perform The 3-Note Promenade at full tempo with chamber backing to earn your stars and AI Coach report.',
        coachTip: 'Keep your eyes on the music and trust your 1–2–3 finger home positions.',
        tempoMultiplier: 1.0,
        handFilter: 'right',
      },
    ],
  },
  {
    id: 'lesson-02-ode-to-joy',
    trackId: 'soloist',
    unitNumber: 2,
    title: "The 5-Finger Arch & Beethoven's Ode to Joy",
    subtitle: 'Expand to full C–D–E–F–G position and strengthen Fingers 4 & 5',
    description:
      "Expand from 3 fingers to the full 5-Finger C Position (C4–D4–E4–F4–G4 with Fingers 1–2–3–4–5), building control in your Ring (4) and Pinky (5) fingers through Beethoven's immortal Symphony No. 9 theme.",
    difficulty: 'Beginner 1',
    skillsTaught: [
      'Full 5-Finger C Position (C4–G4)',
      'Ring (4) & Pinky (5) Independence',
      '8-Measure Melodic Phrasing',
      'Stepwise Motion Across 5 Keys',
    ],
    targetNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
    primaryVideoId: 'vid-03-steps-vs-skips',
    remedialVideoIds: ['vid-01-posture-arch', 'vid-04-rhythm-pulse-breathing'],
    score: {
      id: 'score-lesson-02-ode-to-joy',
      title: 'Ode to Joy (Symphony No. 9 Theme)',
      subtitle: 'Ludwig van Beethoven · 5-Finger C Major Arrangement',
      bpm: 80,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 8,
      totalBeats: 32,
      notes: [
        // Measure 1: E4 E4 F4 G4
        noteEvent('l02', 0, 0, 1, 64, 'right', 3, {
          chordSymbol: 'C',
          techniqueTip: 'Begin on E4 with Middle Finger (3)',
          lyric: 'Joy-',
        }),
        noteEvent('l02', 0, 1, 1, 64, 'right', 3, { lyric: 'ful' }),
        noteEvent('l02', 0, 2, 1, 65, 'right', 4, {
          techniqueTip: 'Lift Ring Finger (4) cleanly onto F4',
          lyric: 'joy-',
        }),
        noteEvent('l02', 0, 3, 1, 67, 'right', 5, {
          techniqueTip: 'Keep Pinky (5) curved on the tip of G4',
          lyric: 'ful',
        }),
        // Measure 2: G4 F4 E4 D4
        noteEvent('l02', 1, 4, 1, 67, 'right', 5, {
          chordSymbol: 'G',
          lyric: 'we',
        }),
        noteEvent('l02', 1, 5, 1, 65, 'right', 4, { lyric: 'a-' }),
        noteEvent('l02', 1, 6, 1, 64, 'right', 3, { lyric: 'dore' }),
        noteEvent('l02', 1, 7, 1, 62, 'right', 2, { lyric: 'thee' }),
        // Measure 3: C4 C4 D4 E4
        noteEvent('l02', 2, 8, 1, 60, 'right', 1, {
          chordSymbol: 'Am',
          lyric: 'God',
        }),
        noteEvent('l02', 2, 9, 1, 60, 'right', 1, { lyric: 'of' }),
        noteEvent('l02', 2, 10, 1, 62, 'right', 2, { lyric: 'glo-' }),
        noteEvent('l02', 2, 11, 1, 64, 'right', 3, { lyric: 'ry' }),
        // Measure 4: E4(1.5) D4(0.5) D4(2)
        noteEvent('l02', 3, 12, 1.5, 64, 'right', 3, {
          chordSymbol: 'G',
          durationType: 'quarter',
          techniqueTip: 'Hold E4 slightly longer before the quick D4 resolution',
          lyric: 'Lord',
        }),
        noteEvent('l02', 3, 13.5, 0.5, 62, 'right', 2, {
          durationType: 'eighth',
          lyric: 'of',
        }),
        noteEvent('l02', 3, 14, 2, 62, 'right', 2, {
          durationType: 'half',
          lyric: 'love —',
        }),
        // Measure 5: E4 E4 F4 G4
        noteEvent('l02', 4, 16, 1, 64, 'right', 3, {
          chordSymbol: 'C',
          lyric: 'Hearts',
        }),
        noteEvent('l02', 4, 17, 1, 64, 'right', 3, { lyric: 'un-' }),
        noteEvent('l02', 4, 18, 1, 65, 'right', 4, { lyric: 'fold' }),
        noteEvent('l02', 4, 19, 1, 67, 'right', 5, { lyric: 'like' }),
        // Measure 6: G4 F4 E4 D4
        noteEvent('l02', 5, 20, 1, 67, 'right', 5, {
          chordSymbol: 'G',
          lyric: 'flow’rs',
        }),
        noteEvent('l02', 5, 21, 1, 65, 'right', 4, { lyric: 'be-' }),
        noteEvent('l02', 5, 22, 1, 64, 'right', 3, { lyric: 'fore' }),
        noteEvent('l02', 5, 23, 1, 62, 'right', 2, { lyric: 'thee' }),
        // Measure 7: C4 C4 D4 E4
        noteEvent('l02', 6, 24, 1, 60, 'right', 1, {
          chordSymbol: 'F',
          lyric: 'Hail',
        }),
        noteEvent('l02', 6, 25, 1, 60, 'right', 1, { lyric: 'thee' }),
        noteEvent('l02', 6, 26, 1, 62, 'right', 2, {
          chordSymbol: 'G',
          lyric: 'sun',
        }),
        noteEvent('l02', 6, 27, 1, 64, 'right', 3, { lyric: 'a-' }),
        // Measure 8: D4(1.5) C4(0.5) C4(2)
        noteEvent('l02', 7, 28, 1.5, 62, 'right', 2, {
          chordSymbol: 'G7',
          durationType: 'quarter',
          lyric: 'bove',
        }),
        noteEvent('l02', 7, 29.5, 0.5, 60, 'right', 1, {
          durationType: 'eighth',
          lyric: 'us',
        }),
        noteEvent('l02', 7, 30, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Settle onto Middle C (Thumb 1) for the triumphant cadence',
          lyric: 'all —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 50 },
        { beatStart: 4, durationBeats: 4, midiNotes: [43, 50, 55], style: 'warm_pad', velocity: 48 },
        { beatStart: 8, durationBeats: 4, midiNotes: [45, 52, 57], style: 'warm_pad', velocity: 48 },
        { beatStart: 12, durationBeats: 4, midiNotes: [43, 50, 55], style: 'bass_pulse', velocity: 50 },
        { beatStart: 16, durationBeats: 4, midiNotes: [48, 52, 55], style: 'arpeggio', velocity: 52 },
        { beatStart: 20, durationBeats: 4, midiNotes: [43, 50, 55], style: 'arpeggio', velocity: 50 },
        { beatStart: 24, durationBeats: 2, midiNotes: [41, 48, 53], style: 'bass_pulse', velocity: 52 },
        { beatStart: 26, durationBeats: 2, midiNotes: [43, 50, 55], style: 'bass_pulse', velocity: 52 },
        { beatStart: 28, durationBeats: 2, midiNotes: [43, 47, 53], style: 'bass_pulse', velocity: 50 },
        { beatStart: 30, durationBeats: 2, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 56 },
      ],
    },
    steps: [
      {
        id: 'l02-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: The 5-Finger Arch & Taming Fingers 4 and 5',
        instruction:
          'Learn how to support the outer arch of your Right Hand so Ring (4) on F4 and Pinky (5) on G4 play with crisp independence.',
        coachTip: 'Keep your pinky knuckle gently domed—never let the outside of your hand collapse.',
        videoId: 'vid-03-steps-vs-skips',
      },
      {
        id: 'l02-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Map All 5 Fingers (C4 to G4)',
        instruction:
          'Place Right Hand Fingers 1–2–3–4–5 over C4–D4–E4–F4–G4 and test the upper notes of Ode to Joy.',
        coachTip: 'Notice that Ode to Joy starts on E4 (Middle Finger 3), not C4!',
        discoveryPrompts: [
          {
            id: 'l02-disc-1',
            targetMidi: 64,
            targetNoteName: 'E4',
            hand: 'right',
            finger: 3,
            instruction:
              'Place Right Hand Fingers 1, 2, 3, 4, 5 over C4, D4, E4, F4, G4. Press E4 with Middle Finger (3).',
            landmarkHint: 'Line 1 of Treble Clef · White key right of the 2 black keys',
          },
          {
            id: 'l02-disc-2',
            targetMidi: 65,
            targetNoteName: 'F4',
            hand: 'right',
            finger: 4,
            instruction: 'Press F4 with Ring Finger (4)—keep your knuckle curved!',
            landmarkHint: 'Space 1 of Treble Clef · White key left of the 3 black keys',
          },
          {
            id: 'l02-disc-3',
            targetMidi: 67,
            targetNoteName: 'G4',
            hand: 'right',
            finger: 5,
            instruction: 'Press G4 with Pinky (5) on the cushion of its tip.',
            landmarkHint: 'Line 2 (G-Clef swirl line) · 5th white key from Middle C',
          },
          {
            id: 'l02-disc-4',
            targetMidi: 60,
            targetNoteName: 'C4',
            hand: 'right',
            finger: 1,
            instruction: 'Anchor back down on Middle C (C4) with Right Hand Thumb (1).',
            landmarkHint: 'Ledger line below Treble Staff',
          },
        ],
      },
      {
        id: 'l02-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: 8-Measure Ode to Joy Walkthrough',
        instruction:
          'Play through all 8 measures untimed. Focus on clean finger transitions between E4 (3), F4 (4), and G4 (5).',
        coachTip: 'Measures 1–4 end on D4 (Finger 2); Measures 5–8 resolve home to C4 (Finger 1).',
        handFilter: 'right',
      },
      {
        id: 'l02-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 56 BPM Orchestral Rehearsal',
        instruction:
          'Play Ode to Joy at 70% speed with warm strings and French horn accompaniment.',
        coachTip: 'Count carefully through Measure 4 and Measure 8 where the dotted-rhythm cadence lands.',
        tempoMultiplier: 0.7,
        handFilter: 'right',
      },
      {
        id: 'l02-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 80 BPM Symphony Finale',
        instruction:
          'Perform Beethoven’s Ode to Joy at full 80 BPM concert tempo for your Coach evaluation.',
        coachTip: 'Keep your wrist relaxed and let each quarter note sing with even tone.',
        tempoMultiplier: 1.0,
        handFilter: 'right',
      },
    ],
  },
  {
    id: 'lesson-03-bass-clef-anchors',
    trackId: 'soloist',
    unitNumber: 3,
    title: 'Rhythm & Half Notes — Au Clair de la Lune',
    subtitle: 'Master Quarter, Half, and Whole note sustain durations in Treble Clef',
    description:
      'Master note duration literacy—distinguishing 1-beat Quarter Notes, 2-beat Half Notes, and 4-beat Whole Notes in the classic French melody Au Clair de la Lune without clipping long notes short.',
    difficulty: 'Beginner 1',
    skillsTaught: [
      'Quarter (1 Beat) vs. Half (2 Beats) vs. Whole (4 Beats)',
      'Full Note Sustain Without Early Release',
      'Reading Ahead Across Barlines',
      'Phrase Breathing & Pulse',
    ],
    targetNotes: ['C4', 'D4', 'E4'],
    primaryVideoId: 'vid-04-rhythm-pulse-breathing',
    remedialVideoIds: ['vid-02-middle-c-landmark', 'vid-01-posture-arch'],
    score: {
      id: 'score-lesson-03-bass-clef-anchors',
      title: 'Au Clair de la Lune',
      subtitle: '18th-Century French Lullaby · Rhythm & Sustain Etude',
      bpm: 76,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: C4 C4 C4 D4
        noteEvent('l03', 0, 0, 1, 60, 'right', 1, {
          chordSymbol: 'C',
          techniqueTip: 'Three steady Quarter Notes on Middle C (Thumb 1)',
          lyric: 'Au',
        }),
        noteEvent('l03', 0, 1, 1, 60, 'right', 1, { lyric: 'clair' }),
        noteEvent('l03', 0, 2, 1, 60, 'right', 1, { lyric: 'de' }),
        noteEvent('l03', 0, 3, 1, 62, 'right', 2, {
          techniqueTip: 'Step up to D4 (Index 2) on Beat 4',
          lyric: 'la',
        }),
        // Measure 2: E4(half) D4(half)
        noteEvent('l03', 1, 4, 2, 64, 'right', 3, {
          chordSymbol: 'G7',
          durationType: 'half',
          techniqueTip: 'Half Note: Keep E4 (Finger 3) held down for 2 full beats ("1–2")',
          lyric: 'lu -',
        }),
        noteEvent('l03', 1, 6, 2, 62, 'right', 2, {
          durationType: 'half',
          techniqueTip: 'Half Note: Keep D4 (Finger 2) held down for Beats 3–4',
          lyric: 'ne —',
        }),
        // Measure 3: C4 E4 D4 D4
        noteEvent('l03', 2, 8, 1, 60, 'right', 1, {
          chordSymbol: 'C',
          lyric: 'Mon',
        }),
        noteEvent('l03', 2, 9, 1, 64, 'right', 3, {
          techniqueTip: 'Skip from C4 (1) directly to E4 (3)!',
          lyric: 'a-',
        }),
        noteEvent('l03', 2, 10, 1, 62, 'right', 2, {
          chordSymbol: 'G7',
          lyric: 'mi',
        }),
        noteEvent('l03', 2, 11, 1, 62, 'right', 2, { lyric: 'Pier-' }),
        // Measure 4: C4(whole)
        noteEvent('l03', 3, 12, 4, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Whole Note: Hold Middle C down for all 4 beats of the final bar!',
          lyric: 'rot — — —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 52, 55], style: 'arpeggio', velocity: 46 },
        { beatStart: 4, durationBeats: 4, midiNotes: [43, 50, 55], style: 'arpeggio', velocity: 46 },
        { beatStart: 8, durationBeats: 2, midiNotes: [48, 52, 55], style: 'bass_pulse', velocity: 48 },
        { beatStart: 10, durationBeats: 2, midiNotes: [43, 47, 53], style: 'bass_pulse', velocity: 48 },
        { beatStart: 12, durationBeats: 4, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 52 },
      ],
    },
    steps: [
      {
        id: 'l03-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: The Inner Metronome — Quarter, Half & Whole Notes',
        instruction:
          'See how open-head Half Notes (2 beats) and Whole Notes (4 beats) sustain across the beat grid while your eyes look ahead.',
        coachTip: 'Count "1 - 2 - 3 - 4" steadily so you never rush through the long notes in Measure 2.',
        videoId: 'vid-04-rhythm-pulse-breathing',
      },
      {
        id: 'l03-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Quarter Pulse & Skip Check',
        instruction:
          'Warm up your C4–D4–E4 position and test the C4 (1) → E4 (3) skip before starting the song.',
        coachTip: 'In Measure 3, the melody jumps from C4 (1) straight to E4 (3), skipping over D4.',
        discoveryPrompts: [
          {
            id: 'l03-disc-1',
            targetMidi: 60,
            targetNoteName: 'C4',
            hand: 'right',
            finger: 1,
            instruction: 'Press Middle C (C4) with Right Hand Thumb (1).',
            landmarkHint: 'Left of the center 2 black keys',
          },
          {
            id: 'l03-disc-2',
            targetMidi: 64,
            targetNoteName: 'E4',
            hand: 'right',
            finger: 3,
            instruction: 'Now jump a 3rd to E4 with Middle Finger (3)—this is the Measure 2 & 3 target.',
            landmarkHint: 'Right of the center 2 black keys (Line 1 of Treble Staff)',
          },
          {
            id: 'l03-disc-3',
            targetMidi: 62,
            targetNoteName: 'D4',
            hand: 'right',
            finger: 2,
            instruction: 'Step down to D4 with Index Finger (2).',
            landmarkHint: 'Between the 2 black keys',
          },
        ],
      },
      {
        id: 'l03-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Note & Skip Sequence Check',
        instruction:
          'Play through all 4 measures of Au Clair de la Lune untimed, watching the C4 → E4 skip in Measure 3.',
        coachTip: 'Notice the hollow Half Notes in Measure 2 and the stemless Whole Note in Measure 4.',
        handFilter: 'right',
      },
      {
        id: 'l03-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 54 BPM Sustain Practice',
        instruction:
          'Play with the harp arpeggio backing at 70% speed, holding every Half Note for 2 full beats.',
        coachTip: 'Do not lift your finger early on E4 or D4 in Measure 2!',
        tempoMultiplier: 0.7,
        handFilter: 'right',
      },
      {
        id: 'l03-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 76 BPM Lullaby Recital',
        instruction:
          'Perform Au Clair de la Lune at 76 BPM. The Coach evaluates both pitch accuracy and full note duration.',
        coachTip: 'Let the final Whole Note on C4 ring through all 4 beats of Measure 4.',
        tempoMultiplier: 1.0,
        handFilter: 'right',
      },
    ],
  },
  {
    id: 'lesson-04-skipping-stones-leaps',
    trackId: 'soloist',
    unitNumber: 4,
    title: 'Left Hand Bass Landmarks & Twinkle Twinkle',
    subtitle: 'Conquer the Bass Clef, Left Hand mirror fingers (5–1), and the C3-to-G3 5th leap',
    description:
      'Introduce the Bass Clef (F Clef), Left Hand C3 Position (C3–D3–E3–F3–G3–A3), mirror-image finger numbering (Pinky = 5 on C3, Thumb = 1 on G3/A3), and the iconic Perfect 5th leap in Twinkle, Twinkle, Little Star.',
    difficulty: 'Beginner 1',
    skillsTaught: [
      'Bass Clef (F Clef) Staff Reading',
      'Left Hand Mirror Finger Numbers (5 on C3, 1 on G3)',
      'Perfect 5th Harmonic Leap (C3 → G3)',
      'Thumb 1 Reach to A3',
    ],
    targetNotes: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3'],
    primaryVideoId: 'vid-06-left-hand-anchor-and-groove',
    remedialVideoIds: ['vid-02-middle-c-landmark', 'vid-03-steps-vs-skips'],
    score: {
      id: 'score-lesson-04-skipping-stones-leaps',
      title: 'Twinkle, Twinkle, Little Star (Bass Baritone)',
      subtitle: 'Traditional · Left Hand Bass Clef Showcase',
      bpm: 74,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: C3 C3 G3 G3
        noteEvent('l04', 0, 0, 1, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          techniqueTip: 'Left Hand Pinky (5) on Bass C (C3)',
          lyric: 'Twin-',
        }),
        noteEvent('l04', 0, 1, 1, 48, 'left', 5, {
          clef: 'bass',
          lyric: 'kle',
        }),
        noteEvent('l04', 0, 2, 1, 55, 'left', 1, {
          clef: 'bass',
          techniqueTip: 'Jump a 5th up to G3 with Left Hand Thumb (1)',
          lyric: 'twin-',
        }),
        noteEvent('l04', 0, 3, 1, 55, 'left', 1, {
          clef: 'bass',
          lyric: 'kle',
        }),
        // Measure 2: A3 A3 G3(half)
        noteEvent('l04', 1, 4, 1, 57, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'F',
          techniqueTip: 'Reach Left Hand Thumb (1) one white key right to A3',
          lyric: 'lit-',
        }),
        noteEvent('l04', 1, 5, 1, 57, 'left', 1, {
          clef: 'bass',
          lyric: 'tle',
        }),
        noteEvent('l04', 1, 6, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Return Thumb (1) to G3 and hold 2 beats',
          lyric: 'star —',
        }),
        // Measure 3: F3 F3 E3 E3
        noteEvent('l04', 2, 8, 1, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          techniqueTip: 'Index Finger (2) on F3 (the Bass Clef dot line)',
          lyric: 'How',
        }),
        noteEvent('l04', 2, 9, 1, 53, 'left', 2, {
          clef: 'bass',
          lyric: 'I',
        }),
        noteEvent('l04', 2, 10, 1, 52, 'left', 3, {
          clef: 'bass',
          chordSymbol: 'C',
          techniqueTip: 'Middle Finger (3) on E3',
          lyric: 'won-',
        }),
        noteEvent('l04', 2, 11, 1, 52, 'left', 3, {
          clef: 'bass',
          lyric: 'der',
        }),
        // Measure 4: D3 D3 C3(half)
        noteEvent('l04', 3, 12, 1, 50, 'left', 4, {
          clef: 'bass',
          chordSymbol: 'G7',
          techniqueTip: 'Ring Finger (4) on D3',
          lyric: 'what',
        }),
        noteEvent('l04', 3, 13, 1, 50, 'left', 4, {
          clef: 'bass',
          lyric: 'you',
        }),
        noteEvent('l04', 3, 14, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Pinky (5) settles home on C3 for 2 beats',
          lyric: 'are —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [64, 67, 72], style: 'arpeggio', velocity: 44 },
        { beatStart: 4, durationBeats: 2, midiNotes: [65, 69, 72], style: 'arpeggio', velocity: 44 },
        { beatStart: 6, durationBeats: 2, midiNotes: [64, 67, 72], style: 'warm_pad', velocity: 46 },
        { beatStart: 8, durationBeats: 2, midiNotes: [65, 69, 72], style: 'arpeggio', velocity: 44 },
        { beatStart: 10, durationBeats: 2, midiNotes: [64, 67, 72], style: 'arpeggio', velocity: 44 },
        { beatStart: 12, durationBeats: 2, midiNotes: [62, 65, 71], style: 'bass_pulse', velocity: 44 },
        { beatStart: 14, durationBeats: 2, midiNotes: [60, 64, 67], style: 'warm_pad', velocity: 50 },
      ],
    },
    steps: [
      {
        id: 'l04-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: Left Hand Mirror Numbers & Bass Landmarks',
        instruction:
          'Learn why Left Hand Pinky is Finger 5 on C3 and how to spot F3 and G3 in the Bass Clef.',
        coachTip: 'Thumbs are always Finger 1 on both hands—so in Left Hand C3 position, Thumb (1) sits on top at G3!',
        videoId: 'vid-06-left-hand-anchor-and-groove',
      },
      {
        id: 'l04-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Left Hand C3 Position & A3 Reach',
        instruction:
          'Shift 1 octave left of Middle C to Bass C (C3) and map your Left Hand fingers from C3 to A3.',
        coachTip: 'Notice the warm, resonant baritone register of the lower octave.',
        discoveryPrompts: [
          {
            id: 'l04-disc-1',
            targetMidi: 48,
            targetNoteName: 'C3',
            hand: 'left',
            finger: 5,
            instruction:
              'Shift 1 octave left of Middle C to Bass C (C3). Press C3 with Left Hand Pinky (Finger 5).',
            landmarkHint: 'White key left of the lower pair of 2 black keys',
          },
          {
            id: 'l04-disc-2',
            targetMidi: 55,
            targetNoteName: 'G3',
            hand: 'left',
            finger: 1,
            instruction: 'Jump a 5th up to G3 with Left Hand Thumb (Finger 1).',
            landmarkHint: '4th space of Bass Clef · 5th white key up from C3',
          },
          {
            id: 'l04-disc-3',
            targetMidi: 57,
            targetNoteName: 'A3',
            hand: 'left',
            finger: 1,
            instruction: 'Stretch your Left Hand Thumb 1 white key right to A3 (Finger 1).',
            landmarkHint: 'Top line (5th line) of Bass Clef',
          },
          {
            id: 'l04-disc-4',
            targetMidi: 53,
            targetNoteName: 'F3',
            hand: 'left',
            finger: 2,
            instruction: 'Press F3 with Left Hand Index Finger (2).',
            landmarkHint: '4th line of Bass Clef (between the two F-Clef dots)',
          },
        ],
      },
      {
        id: 'l04-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Left Hand Twinkle Walkthrough',
        instruction:
          'Play Twinkle, Twinkle, Little Star in the Left Hand untimed. Walk cleanly down F3 (2) → E3 (3) → D3 (4) → C3 (5) in Bars 3–4.',
        coachTip: 'After playing A3 with Thumb (1), slide your Thumb back to G3 before walking down.',
        handFilter: 'left',
      },
      {
        id: 'l04-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 52 BPM Celesta Duet',
        instruction:
          'Play your Left Hand melody at 70% tempo while a shimmering upper-register piano accompaniment harmonizes above you.',
        coachTip: 'Keep your Left Hand wrist supple so the Pinky (5) and Ring (4) notes speak clearly.',
        tempoMultiplier: 0.7,
        handFilter: 'left',
      },
      {
        id: 'l04-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 74 BPM Bass Clef Mastery',
        instruction:
          'Perform Twinkle, Twinkle in the Left Hand at 74 BPM for your Coach evaluation.',
        coachTip: 'Hold the Half Notes on G3 (Measure 2) and C3 (Measure 4) for 2 full beats.',
        tempoMultiplier: 1.0,
        handFilter: 'left',
      },
    ],
  },
  {
    id: 'lesson-05-c-and-g-major-triads',
    trackId: 'chords',
    unitNumber: 5,
    title: 'Chords Path I: C Major & G Major Pop Pulse',
    subtitle: 'Build 3-note root-position triads (1–3–5) and groove on C and G Major',
    description:
      'Unlock the Chords Path! Learn how to build any Root-Position Triad ("Play 1, Skip 1, Play 1" with Fingers 1–3–5), strike 3 keys simultaneously without rolling, and groove over a rhythmic pop band backing.',
    difficulty: 'Beginner 2',
    skillsTaught: [
      'Root-Position Triad Formula (1–3–5)',
      'Simultaneous 3-Note Chord Attack',
      'C Major Triad (C4–E4–G4)',
      'G Major Triad (G4–B4–D5) Air-Frame Shift',
    ],
    targetNotes: ['C4', 'E4', 'G4', 'B4', 'D5'],
    primaryVideoId: 'vid-05-triad-claw-and-inversions',
    remedialVideoIds: ['vid-04-rhythm-pulse-breathing', 'vid-01-posture-arch'],
    score: {
      id: 'score-lesson-05-c-and-g-major-triads',
      title: 'C & G Pop Pulse Groove',
      subtitle: 'Chords Path I · Simultaneous 1–3–5 Triads',
      bpm: 82,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: C Major Triad (Beat 0 half, Beat 2 half)
        noteEvent('l05', 0, 0, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'C Major: Press C4 (1) + E4 (3) + G4 (5) at the exact same instant',
        }),
        noteEvent('l05', 0, 0, 2, 64, 'right', 3, { durationType: 'half' }),
        noteEvent('l05', 0, 0, 2, 67, 'right', 5, { durationType: 'half' }),
        noteEvent('l05', 0, 2, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Pulse C Major again on Beat 3; start looking up toward G4!',
        }),
        noteEvent('l05', 0, 2, 2, 64, 'right', 3, { durationType: 'half' }),
        noteEvent('l05', 0, 2, 2, 67, 'right', 5, { durationType: 'half' }),
        // Measure 2: G Major Triad (Beat 4 half, Beat 6 half)
        noteEvent('l05', 1, 4, 2, 67, 'right', 1, {
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'G Major: Keep your 1–3–5 hand shape locked and land Thumb (1) on G4',
        }),
        noteEvent('l05', 1, 4, 2, 71, 'right', 3, { durationType: 'half' }),
        noteEvent('l05', 1, 4, 2, 74, 'right', 5, { durationType: 'half' }),
        noteEvent('l05', 1, 6, 2, 67, 'right', 1, {
          chordSymbol: 'G',
          durationType: 'half',
        }),
        noteEvent('l05', 1, 6, 2, 71, 'right', 3, { durationType: 'half' }),
        noteEvent('l05', 1, 6, 2, 74, 'right', 5, { durationType: 'half' }),
        // Measure 3: C Major (Beat 8 half) -> G Major (Beat 10 half)
        noteEvent('l05', 2, 8, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Quick 2-beat switch: C Major on Beat 1',
        }),
        noteEvent('l05', 2, 8, 2, 64, 'right', 3, { durationType: 'half' }),
        noteEvent('l05', 2, 8, 2, 67, 'right', 5, { durationType: 'half' }),
        noteEvent('l05', 2, 10, 2, 67, 'right', 1, {
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'Glide up to G Major (G4–B4–D5) on Beat 3',
        }),
        noteEvent('l05', 2, 10, 2, 71, 'right', 3, { durationType: 'half' }),
        noteEvent('l05', 2, 10, 2, 74, 'right', 5, { durationType: 'half' }),
        // Measure 4: C Major Finale (Whole note)
        noteEvent('l05', 3, 12, 4, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'whole',
          techniqueTip: 'Finale C Major Triad: Hold all 3 notes for 4 full beats!',
        }),
        noteEvent('l05', 3, 12, 4, 64, 'right', 3, { durationType: 'whole' }),
        noteEvent('l05', 3, 12, 4, 67, 'right', 5, { durationType: 'whole' }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 2, midiNotes: [48, 55], style: 'bass_pulse', velocity: 54 },
        { beatStart: 2, durationBeats: 2, midiNotes: [48, 52, 55], style: 'percussion_accent', velocity: 52 },
        { beatStart: 4, durationBeats: 2, midiNotes: [43, 50], style: 'bass_pulse', velocity: 54 },
        { beatStart: 6, durationBeats: 2, midiNotes: [43, 47, 50], style: 'percussion_accent', velocity: 52 },
        { beatStart: 8, durationBeats: 2, midiNotes: [48, 55], style: 'bass_pulse', velocity: 54 },
        { beatStart: 10, durationBeats: 2, midiNotes: [43, 50], style: 'bass_pulse', velocity: 54 },
        { beatStart: 12, durationBeats: 4, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 58 },
      ],
    },
    steps: [
      {
        id: 'l05-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: Building 3-Note Triads & The 1–3–5 Hand Frame',
        instruction:
          'Watch how Fingers 1–3–5 form a stable triangle over C–E–G and glide as one unit up to G–B–D.',
        coachTip: 'Keep Fingers 2 and 4 slightly elevated so they never brush D4 or F4.',
        videoId: 'vid-05-triad-claw-and-inversions',
      },
      {
        id: 'l05-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Map C Major & G Major Triads',
        instruction:
          'Locate the root, third, and fifth of C Major (C4–E4–G4) and G Major (G4–B4–D5).',
        coachTip: 'Notice that G4 is the Pinky note of C Major AND the Thumb note of G Major!',
        discoveryPrompts: [
          {
            id: 'l05-disc-1',
            targetMidi: 60,
            targetNoteName: 'C4',
            hand: 'right',
            finger: 1,
            instruction: 'C Major Root: Press Middle C (C4) with Right Hand Thumb (1).',
            landmarkHint: 'Left of center 2 black keys',
          },
          {
            id: 'l05-disc-2',
            targetMidi: 64,
            targetNoteName: 'E4',
            hand: 'right',
            finger: 3,
            instruction: 'C Major 3rd: Skip D4 and press E4 with Middle Finger (3).',
            landmarkHint: 'Right of center 2 black keys',
          },
          {
            id: 'l05-disc-3',
            targetMidi: 67,
            targetNoteName: 'G4',
            hand: 'right',
            finger: 5,
            instruction: 'C Major 5th: Skip F4 and press G4 with Pinky (5). That completes C–E–G!',
            landmarkHint: 'Line 2 of Treble Clef',
          },
          {
            id: 'l05-disc-4',
            targetMidi: 71,
            targetNoteName: 'B4',
            hand: 'right',
            finger: 3,
            instruction:
              'Now shift Thumb (1) to G4 and press B4 (the 3rd of G Major) with Middle Finger (3).',
            landmarkHint: 'Middle line (Line 3) of Treble Clef · Right of the 3 black keys',
          },
          {
            id: 'l05-disc-5',
            targetMidi: 74,
            targetNoteName: 'D5',
            hand: 'right',
            finger: 5,
            instruction: 'Press D5 (the 5th of G Major) with Pinky (5) to complete G4–B4–D5.',
            landmarkHint: 'Line 4 of Treble Clef · Between the upper 2 black keys',
          },
        ],
      },
      {
        id: 'l05-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Chord Voicing & Transition Check',
        instruction:
          'Play each 3-note triad in Wait Mode. All 3 notes of each chord must be pressed to advance.',
        coachTip: 'Freeze your 1–3–5 hand mold in the air when jumping from C Major to G Major.',
        handFilter: 'right',
      },
      {
        id: 'l05-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 58 BPM Pop Band Groove',
        instruction:
          'Play the C and G Major chord pulse at 70% tempo with studio bass and percussion.',
        coachTip: 'In Measure 3, you switch from C Major to G Major after just 2 beats—prepare early!',
        tempoMultiplier: 0.7,
        handFilter: 'right',
      },
      {
        id: 'l05-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 82 BPM Band Showcase',
        instruction:
          'Perform C & G Pop Pulse at full 82 BPM. The Coach measures both chord simultaneity and transition speed.',
        coachTip: 'Drop with relaxed forearm weight so all 3 chord tones speak together.',
        tempoMultiplier: 1.0,
        handFilter: 'right',
      },
    ],
  },
  {
    id: 'lesson-06-four-chord-pop-engine',
    trackId: 'chords',
    unitNumber: 6,
    title: 'Chords Path II: The 4-Chord Hit Progression (C–G–Am–F)',
    subtitle: 'Combine Left Hand bass roots with Right Hand triads across I–V–vi–IV',
    description:
      'Master the most famous chord progression in modern music (C Major → G Major → A Minor → F Major, heard in Let It Be and Someone Like You), adding emotional A Minor color and Left Hand bass roots.',
    difficulty: 'Beginner 2',
    skillsTaught: [
      'The I–V–vi–IV Pop Anthem Progression (C–G–Am–F)',
      'Major vs. Minor Triad Emotional Color (A Minor)',
      'Left Hand Root + Right Hand Triad Voicing',
      'Smooth 4-Measure Harmonic Transitions',
    ],
    targetNotes: ['C3', 'F3', 'G3', 'A3', 'C4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
    primaryVideoId: 'vid-06-left-hand-anchor-and-groove',
    remedialVideoIds: ['vid-05-triad-claw-and-inversions', 'vid-08-two-hand-independence'],
    score: {
      id: 'score-lesson-06-four-chord-pop-engine',
      title: 'Four-Chord Pop Anthem (C – G – Am – F)',
      subtitle: 'Chords Path II · Left Hand Bass Root + Right Hand Triad',
      bpm: 76,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 4,
      totalBeats: 16,
      notes: [
        // Measure 1: C Major (LH C3 whole-bar or half anchor + RH C4-E4-G4 on Beat 0 & Beat 2)
        noteEvent('l06', 0, 0, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Left Hand Pinky (5) anchors C3 while Right Hand plays C4+E4+G4',
        }),
        noteEvent('l06', 0, 0, 2, 60, 'right', 1, { durationType: 'half' }),
        noteEvent('l06', 0, 0, 2, 64, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 0, 0, 2, 67, 'right', 5, { durationType: 'half' }),
        noteEvent('l06', 0, 2, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Pulse the Right Hand C Major triad on Beat 3',
        }),
        noteEvent('l06', 0, 2, 2, 64, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 0, 2, 2, 67, 'right', 5, { durationType: 'half' }),
        // Measure 2: G Major (LH G3 + RH G4-B4-D5)
        noteEvent('l06', 1, 4, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'Left Hand Thumb (1) on G3 + Right Hand G4+B4+D5',
        }),
        noteEvent('l06', 1, 4, 2, 67, 'right', 1, { durationType: 'half' }),
        noteEvent('l06', 1, 4, 2, 71, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 1, 4, 2, 74, 'right', 5, { durationType: 'half' }),
        noteEvent('l06', 1, 6, 2, 67, 'right', 1, {
          chordSymbol: 'G',
          durationType: 'half',
        }),
        noteEvent('l06', 1, 6, 2, 71, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 1, 6, 2, 74, 'right', 5, { durationType: 'half' }),
        // Measure 3: A Minor (LH A3 + RH A4-C5-E5)
        noteEvent('l06', 2, 8, 2, 57, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'Am',
          durationType: 'half',
          techniqueTip: 'Step both hands up 1 white key to A Minor: LH A3 (1) + RH A4+C5+E5',
        }),
        noteEvent('l06', 2, 8, 2, 69, 'right', 1, { durationType: 'half' }),
        noteEvent('l06', 2, 8, 2, 72, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 2, 8, 2, 76, 'right', 5, { durationType: 'half' }),
        noteEvent('l06', 2, 10, 2, 69, 'right', 1, {
          chordSymbol: 'Am',
          durationType: 'half',
        }),
        noteEvent('l06', 2, 10, 2, 72, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 2, 10, 2, 76, 'right', 5, { durationType: 'half' }),
        // Measure 4: F Major (LH F3 + RH F4-A4-C5)
        noteEvent('l06', 3, 12, 2, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          durationType: 'half',
          techniqueTip: 'Step down to warm F Major: LH F3 (2) + RH F4+A4+C5',
        }),
        noteEvent('l06', 3, 12, 2, 65, 'right', 1, { durationType: 'half' }),
        noteEvent('l06', 3, 12, 2, 69, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 3, 12, 2, 72, 'right', 5, { durationType: 'half' }),
        noteEvent('l06', 3, 14, 2, 65, 'right', 1, {
          chordSymbol: 'F',
          durationType: 'half',
        }),
        noteEvent('l06', 3, 14, 2, 69, 'right', 3, { durationType: 'half' }),
        noteEvent('l06', 3, 14, 2, 72, 'right', 5, { durationType: 'half' }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55, 64], style: 'warm_pad', velocity: 46 },
        { beatStart: 4, durationBeats: 4, midiNotes: [43, 50, 59], style: 'warm_pad', velocity: 46 },
        { beatStart: 8, durationBeats: 4, midiNotes: [45, 52, 60], style: 'warm_pad', velocity: 48 },
        { beatStart: 12, durationBeats: 4, midiNotes: [41, 48, 57], style: 'warm_pad', velocity: 48 },
      ],
    },
    steps: [
      {
        id: 'l06-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: The 4 Chords That Unlock 1,000 Songs (C–G–Am–F)',
        instruction:
          'See how adding a single Left Hand bass note under your Right Hand 1–3–5 triad creates a full studio ballad arrangement.',
        coachTip: 'From G Major to A Minor, every finger simply shifts 1 white key to the right!',
        videoId: 'vid-06-left-hand-anchor-and-groove',
      },
      {
        id: 'l06-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Find A Minor & F Major Roots',
        instruction:
          'Test the four chord roots in your Left Hand and the new A Minor (A4–C5–E5) & F Major (F4–A4–C5) positions in your Right Hand.',
        coachTip: 'Listen to the wistful, emotional sound of A Minor compared to bright C Major.',
        discoveryPrompts: [
          {
            id: 'l06-disc-1',
            targetMidi: 48,
            targetNoteName: 'C3',
            hand: 'left',
            finger: 5,
            instruction: 'Chord 1 Bass Root: Press C3 with Left Hand Pinky (5).',
            landmarkHint: 'Bass C · Left of lower 2 black keys',
          },
          {
            id: 'l06-disc-2',
            targetMidi: 55,
            targetNoteName: 'G3',
            hand: 'left',
            finger: 1,
            instruction: 'Chord 2 Bass Root: Press G3 with Left Hand Thumb (1).',
            landmarkHint: '4th space of Bass Clef',
          },
          {
            id: 'l06-disc-3',
            targetMidi: 69,
            targetNoteName: 'A4',
            hand: 'right',
            finger: 1,
            instruction:
              'Chord 3 (A Minor): Place Right Hand Thumb (1) on A4 (with C5 on 3 and E5 on 5).',
            landmarkHint: '2nd space of Treble Clef',
          },
          {
            id: 'l06-disc-4',
            targetMidi: 65,
            targetNoteName: 'F4',
            hand: 'right',
            finger: 1,
            instruction:
              'Chord 4 (F Major): Slide Right Hand Thumb (1) down to F4 (with A4 on 3 and C5 on 5).',
            landmarkHint: '1st space of Treble Clef · Left of center 3 black keys',
          },
        ],
      },
      {
        id: 'l06-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Two-Hand 4-Chord Walkthrough',
        instruction:
          'Play C → G → Am → F at your own pace. On Beat 1 of each measure, strike the Left Hand root together with the Right Hand triad.',
        coachTip: 'Take a breath before each barline and place your Thumb (1) on the new root first.',
        handFilter: 'both',
      },
      {
        id: 'l06-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 54 BPM Ballad Groove',
        instruction:
          'Play the 4-Chord Anthem at 70% speed with soulful cello and acoustic drum accompaniment.',
        coachTip: 'Use Beat 4 of each bar to glide your Right Hand frame into the next chord.',
        tempoMultiplier: 0.7,
        handFilter: 'both',
      },
      {
        id: 'l06-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 76 BPM Studio Ballad',
        instruction:
          'Perform the 4-Chord Hit Progression at full 76 BPM concert tempo.',
        coachTip: 'Strike Left Hand root and Right Hand triad together on Beat 1 of every measure.',
        tempoMultiplier: 1.0,
        handFilter: 'both',
      },
    ],
  },
  {
    id: 'lesson-07-two-hand-conversation',
    trackId: 'synthesis',
    unitNumber: 7,
    title: 'Both Hands Together — Minuet in G (Simplified)',
    subtitle: 'Coordinate 3/4 waltz downbeats and independent melody in Petzold & Bach’s masterpiece',
    description:
      'Synthesize Soloist melody reading with Left Hand harmonic anchoring in 3/4 triple meter ("ONE - two - three"). Coordinate simultaneous downbeats on Beat 1 while your Right Hand dances through the baroque melody.',
    difficulty: 'Elementary',
    skillsTaught: [
      '3/4 Waltz Triple Meter ("ONE - two - three")',
      'Simultaneous Two-Hand Downbeat Coordination',
      'Sustained Left Hand Bass Under Moving Right Hand Melody',
      'Eighth-Note Melodic Grace (G4–A4–B4–C5)',
    ],
    targetNotes: ['G3', 'B3', 'C4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
    primaryVideoId: 'vid-08-two-hand-independence',
    remedialVideoIds: ['vid-06-left-hand-anchor-and-groove', 'vid-03-steps-vs-skips'],
    score: {
      id: 'score-lesson-07-two-hand-conversation',
      title: 'Minuet in G Major (BWV Anh. 114)',
      subtitle: 'Christian Petzold / Anna Magdalena Bach Notebook (Simplified)',
      bpm: 84,
      timeSignature: [3, 4],
      keySignature: 'G Major',
      totalMeasures: 4,
      totalBeats: 12,
      notes: [
        // Measure 1 (3/4): Beat 0 LH G3 (3 beats) + RH D5 (1 beat); Beat 1 G4(0.5) A4(0.5); Beat 2 B4(0.5) C5(0.5)
        noteEvent('l07', 0, 0, 3, 55, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'Left Hand Pinky (5) holds G3 across all 3 beats of Measure 1',
        }),
        noteEvent('l07', 0, 0, 1, 74, 'right', 5, {
          durationType: 'quarter',
          techniqueTip: 'Downbeat Pinch: Strike LH G3 (5) + RH D5 (5) together on Beat 1!',
          lyric: 'Da',
        }),
        noteEvent('l07', 0, 1, 0.5, 67, 'right', 1, {
          durationType: 'eighth',
          techniqueTip: 'Drop Right Hand Thumb (1) to G4 and walk smoothly up',
          lyric: 'di',
        }),
        noteEvent('l07', 0, 1.5, 0.5, 69, 'right', 2, {
          durationType: 'eighth',
          lyric: 'da',
        }),
        noteEvent('l07', 0, 2, 0.5, 71, 'right', 3, {
          durationType: 'eighth',
          lyric: 'di',
        }),
        noteEvent('l07', 0, 2.5, 0.5, 72, 'right', 4, {
          durationType: 'eighth',
          lyric: 'da',
        }),
        // Measure 2 (3/4): Beat 3 LH B3 (3 beats) + RH D5 (1 beat); Beat 4 G4 (1); Beat 5 G4 (1)
        noteEvent('l07', 1, 3, 3, 59, 'left', 3, {
          clef: 'bass',
          chordSymbol: 'G/B',
          durationType: 'half',
          techniqueTip: 'Left Hand Middle Finger (3) plays B3 on Beat 1',
        }),
        noteEvent('l07', 1, 3, 1, 74, 'right', 5, {
          durationType: 'quarter',
          techniqueTip: 'Together on Beat 1: LH B3 (3) + RH D5 (5)',
          lyric: 'Da',
        }),
        noteEvent('l07', 1, 4, 1, 67, 'right', 1, {
          durationType: 'quarter',
          techniqueTip: 'Light staccato bounce on G4 (Thumb 1)',
          lyric: 'dum',
        }),
        noteEvent('l07', 1, 5, 1, 67, 'right', 1, {
          durationType: 'quarter',
          lyric: 'dum',
        }),
        // Measure 3 (3/4): Beat 6 LH C4 (3 beats) + RH E5 (1 beat); Beat 7 C5 (1); Beat 8 D5 (1)
        noteEvent('l07', 2, 6, 3, 60, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'C',
          durationType: 'half',
          techniqueTip: 'Left Hand Index (2) steps up to C4',
        }),
        noteEvent('l07', 2, 6, 1, 76, 'right', 5, {
          durationType: 'quarter',
          techniqueTip: 'Reach Right Hand Pinky (5) 1 key higher to E5 with LH C4 (2)',
          lyric: 'High',
        }),
        noteEvent('l07', 2, 7, 1, 72, 'right', 3, {
          durationType: 'quarter',
          lyric: 'step',
        }),
        noteEvent('l07', 2, 8, 1, 74, 'right', 4, {
          durationType: 'quarter',
          lyric: 'up',
        }),
        // Measure 4 (3/4): Beat 9 LH G3 (3 beats) + RH B4 (2 beats); Beat 11 G4 (1 beat)
        noteEvent('l07', 3, 9, 3, 55, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'G',
          durationType: 'half',
          techniqueTip: 'Return Left Hand Pinky (5) to G3',
        }),
        noteEvent('l07', 3, 9, 2, 71, 'right', 3, {
          durationType: 'half',
          techniqueTip: 'Graceful 2-beat sigh on B4 (3) resolving to G4 (1)',
          lyric: 'grace —',
        }),
        noteEvent('l07', 3, 11, 1, 67, 'right', 1, {
          durationType: 'quarter',
          lyric: 'rest',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 3, midiNotes: [43, 50], style: 'warm_pad', velocity: 42 },
        { beatStart: 3, durationBeats: 3, midiNotes: [47, 55], style: 'warm_pad', velocity: 42 },
        { beatStart: 6, durationBeats: 3, midiNotes: [48, 55], style: 'warm_pad', velocity: 44 },
        { beatStart: 9, durationBeats: 3, midiNotes: [43, 50, 55], style: 'warm_pad', velocity: 46 },
      ],
    },
    steps: [
      {
        id: 'l07-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: Unlocking Two-Hand Coordination & 3/4 Waltz Pulse',
        instruction:
          'Learn the "Beat 1 Pinch" technique so your Left Hand anchor and Right Hand melody land in lockstep.',
        coachTip: 'In 3/4 time, count "ONE - two - three" with a gentle sway on Beat 1.',
        videoId: 'vid-08-two-hand-independence',
      },
      {
        id: 'l07-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: G5 Position & Two-Hand Anchors',
        instruction:
          'Place your Left Hand on G3–B3–C4 and your Right Hand in G4–A4–B4–C5–D5 position.',
        coachTip: 'Notice how both Pinkies (LH 5 on G3, RH 5 on D5) start the very first beat together!',
        discoveryPrompts: [
          {
            id: 'l07-disc-1',
            targetMidi: 55,
            targetNoteName: 'G3',
            hand: 'left',
            finger: 5,
            instruction: 'Place Left Hand Pinky (5) on G3 (4th space of Bass Clef).',
            landmarkHint: '3 white keys below Middle C',
          },
          {
            id: 'l07-disc-2',
            targetMidi: 74,
            targetNoteName: 'D5',
            hand: 'right',
            finger: 5,
            instruction: 'Place Right Hand Pinky (5) on high D5 (4th line of Treble Clef).',
            landmarkHint: 'Between the upper pair of 2 black keys',
          },
          {
            id: 'l07-disc-3',
            targetMidi: 67,
            targetNoteName: 'G4',
            hand: 'right',
            finger: 1,
            instruction:
              'Place Right Hand Thumb (1) on G4—this is the launchpad for the G4–A4–B4–C5 run.',
            landmarkHint: 'Line 2 of Treble Clef',
          },
          {
            id: 'l07-disc-4',
            targetMidi: 59,
            targetNoteName: 'B3',
            hand: 'left',
            finger: 3,
            instruction: 'Press B3 with Left Hand Middle Finger (3) for Measure 2’s bass note.',
            landmarkHint: '1 white key immediately left of Middle C',
          },
        ],
      },
      {
        id: 'l07-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Two-Hand Baroque Walkthrough',
        instruction:
          'Step through all 4 measures untimed. On Beat 1 of each measure, strike both Left and Right Hand notes together.',
        coachTip: 'Keep your Left Hand key held down while your Right Hand steps through Beats 2 and 3.',
        handFilter: 'both',
      },
      {
        id: 'l07-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 58 BPM Chamber Continuo Practice',
        instruction:
          'Play Minuet in G at 70% speed with gentle string continuo backing.',
        coachTip: 'Let the eighth notes in Measure 1 (G4–A4–B4–C5) flow evenly into Measure 2’s D5 downbeat.',
        tempoMultiplier: 0.7,
        handFilter: 'both',
      },
      {
        id: 'l07-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 84 BPM Baroque Recital',
        instruction:
          'Perform Minuet in G at 84 BPM. The Coach tracks two-hand downbeat alignment and melodic accuracy.',
        coachTip: 'Breathe before Beat 1 of each bar so both hands drop together with poise.',
        tempoMultiplier: 1.0,
        handFilter: 'both',
      },
    ],
  },
  {
    id: 'lesson-08-fur-elise-gymnopedie',
    trackId: 'synthesis',
    unitNumber: 8,
    title: 'Expressive Mastery — Für Elise Opening & Gymnopédie Motif',
    subtitle: 'Master black-key accidentals (D#5 & G#4) and seamless hand-to-hand conversation',
    description:
      "Introduce Black Key Accidentals (D#5 and G#4/G#3), expressive touch, and seamless Left-to-Right Hand handoffs in Beethoven's iconic Für Elise opening in A Minor.",
    difficulty: 'Elementary',
    skillsTaught: [
      'Chromatic Black Key Accidentals (D#5 & G#4)',
      'Forward Hand Slide for Black Key Ergonomics',
      'Seamless Left-to-Right Hand Melodic Handoff',
      'A Minor Expressive Phrasing in 3/4',
    ],
    targetNotes: ['G#3', 'A3', 'C4', 'E4', 'G#4', 'A4', 'B4', 'C5', 'D5', 'D#5', 'E5'],
    primaryVideoId: 'vid-07-black-keys-and-accidentals',
    remedialVideoIds: ['vid-08-two-hand-independence', 'vid-01-posture-arch'],
    score: {
      id: 'score-lesson-08-fur-elise-gymnopedie',
      title: 'Für Elise (Bagatelle No. 25 in A Minor)',
      subtitle: 'Ludwig van Beethoven · Conservatory Showcase Theme',
      bpm: 78,
      timeSignature: [3, 4],
      keySignature: 'A Minor',
      totalMeasures: 4,
      totalBeats: 12,
      notes: [
        // Measure 1 (3/4): E5(0.5) D#5(0.5) E5(0.5) D#5(0.5) E5(0.5) B4(0.5)
        noteEvent('l08', 0, 0, 0.5, 76, 'right', 5, {
          chordSymbol: 'Am',
          durationType: 'eighth',
          techniqueTip: 'Slide Right Hand slightly forward: Pinky (5) on E5, Ring (4) poised on black D#5',
          lyric: 'E',
        }),
        noteEvent('l08', 0, 0.5, 0.5, 75, 'right', 4, {
          durationType: 'eighth',
          techniqueTip: 'Black key D#5 (2nd black key of the upper pair) with Ring Finger (4)',
          lyric: 'D#',
        }),
        noteEvent('l08', 0, 1, 0.5, 76, 'right', 5, {
          durationType: 'eighth',
          lyric: 'E',
        }),
        noteEvent('l08', 0, 1.5, 0.5, 75, 'right', 4, {
          durationType: 'eighth',
          lyric: 'D#',
        }),
        noteEvent('l08', 0, 2, 0.5, 76, 'right', 5, {
          durationType: 'eighth',
          lyric: 'E',
        }),
        noteEvent('l08', 0, 2.5, 0.5, 71, 'right', 2, {
          durationType: 'eighth',
          techniqueTip: 'Reach Index Finger (2) cleanly down to B4',
          lyric: 'B',
        }),
        // Measure 2 (3/4): D5(0.5) C5(0.5) | Beat 4: LH A3(2) + RH A4(1) | Beat 5: C4(0.5) E4(0.5)
        noteEvent('l08', 1, 3, 0.5, 74, 'right', 4, {
          durationType: 'eighth',
          techniqueTip: 'Now Ring Finger (4) plays white key D5 natural!',
          lyric: 'D♮',
        }),
        noteEvent('l08', 1, 3.5, 0.5, 72, 'right', 3, {
          durationType: 'eighth',
          lyric: 'C',
        }),
        noteEvent('l08', 1, 4, 2, 57, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'Am',
          durationType: 'half',
          techniqueTip: 'Left Hand Index (2) anchors A3 warm bass response',
        }),
        noteEvent('l08', 1, 4, 1, 69, 'right', 1, {
          durationType: 'quarter',
          techniqueTip: 'Thumb (1) lands on A4 together with Left Hand A3',
          lyric: 'A',
        }),
        noteEvent('l08', 1, 5, 0.5, 60, 'right', 1, {
          durationType: 'eighth',
          techniqueTip: 'Arpeggio rise: C4 (1) → E4 (2) → A4 (4)',
          lyric: 'C',
        }),
        noteEvent('l08', 1, 5.5, 0.5, 64, 'right', 2, {
          durationType: 'eighth',
          lyric: 'E',
        }),
        // Measure 3 (3/4): Beat 6: A4(1) | Beat 7: LH G#3(2) + RH B4(1) | Beat 8: E4(0.5) G#4(0.5)
        noteEvent('l08', 2, 6, 1, 69, 'right', 4, {
          durationType: 'quarter',
          lyric: 'A',
        }),
        noteEvent('l08', 2, 7, 2, 56, 'left', 3, {
          clef: 'bass',
          chordSymbol: 'E7',
          durationType: 'half',
          techniqueTip: 'Left Hand Middle (3) plays black key G#3 for E7 harmony',
        }),
        noteEvent('l08', 2, 7, 1, 71, 'right', 5, {
          durationType: 'quarter',
          techniqueTip: 'Right Hand Pinky (5) on B4 together with Left Hand G#3',
          lyric: 'B',
        }),
        noteEvent('l08', 2, 8, 0.5, 64, 'right', 1, {
          durationType: 'eighth',
          lyric: 'E',
        }),
        noteEvent('l08', 2, 8.5, 0.5, 68, 'right', 2, {
          durationType: 'eighth',
          techniqueTip: 'Index Finger (2) touches middle black key G#4',
          lyric: 'G#',
        }),
        // Measure 4 (3/4): Beat 9: B4(0.5) C5(0.5) | Beat 10: LH A3(2) + RH A4(2)
        noteEvent('l08', 3, 9, 0.5, 71, 'right', 4, {
          durationType: 'eighth',
          lyric: 'B',
        }),
        noteEvent('l08', 3, 9.5, 0.5, 72, 'right', 5, {
          durationType: 'eighth',
          lyric: 'C',
        }),
        noteEvent('l08', 3, 10, 2, 57, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'Am',
          durationType: 'half',
          techniqueTip: 'Final A Minor resolution: LH A3 (2) + RH A4 (3) held for 2 beats',
        }),
        noteEvent('l08', 3, 10, 2, 69, 'right', 3, {
          durationType: 'half',
          lyric: 'Home —',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 3, midiNotes: [57, 64], style: 'warm_pad', velocity: 38 },
        { beatStart: 3, durationBeats: 3, midiNotes: [45, 52, 57], style: 'arpeggio', velocity: 45 },
        { beatStart: 6, durationBeats: 3, midiNotes: [52, 56, 59], style: 'arpeggio', velocity: 45 },
        { beatStart: 9, durationBeats: 3, midiNotes: [45, 52, 57], style: 'warm_pad', velocity: 50 },
      ],
    },
    steps: [
      {
        id: 'l08-step-1',
        stepNumber: 1,
        type: 'video_intro',
        title: 'Watch: Black Key Touch & The Für Elise Chromatic Motif',
        instruction:
          'See how sliding your Right Hand 2 cm toward the fallboard puts Ring Finger (4) directly over D#5 without wrist twist.',
        coachTip: 'Notice how Finger 4 plays black D#5 in Measure 1, then white D5 natural in Measure 2.',
        videoId: 'vid-07-black-keys-and-accidentals',
      },
      {
        id: 'l08-step-2',
        stepNumber: 2,
        type: 'key_discovery',
        title: 'Key Discovery: Map E5, Black Key D#5, and G#4',
        instruction:
          'Locate the chromatic neighbor keys of Für Elise before playing the full phrase.',
        coachTip: 'Touch both E5 (5) and D#5 (4) together before starting so your hand knows the exact distance.',
        discoveryPrompts: [
          {
            id: 'l08-disc-1',
            targetMidi: 76,
            targetNoteName: 'E5',
            hand: 'right',
            finger: 5,
            instruction: 'Locate high E5 with Right Hand Pinky (Finger 5).',
            landmarkHint: '4th space of Treble Clef · Right of the upper 2 black keys',
          },
          {
            id: 'l08-disc-2',
            targetMidi: 75,
            targetNoteName: 'D#5',
            hand: 'right',
            finger: 4,
            instruction:
              'Slide slightly forward and press the black key immediately left of E5: D#5 with Ring Finger (4).',
            landmarkHint: 'Rightmost black key of the upper 2-black-key pair',
          },
          {
            id: 'l08-disc-3',
            targetMidi: 71,
            targetNoteName: 'B4',
            hand: 'right',
            finger: 2,
            instruction: 'Press B4 with Right Hand Index Finger (2) for the descending turn.',
            landmarkHint: 'Middle line (Line 3) of Treble Clef',
          },
          {
            id: 'l08-disc-4',
            targetMidi: 68,
            targetNoteName: 'G#4',
            hand: 'right',
            finger: 2,
            instruction: 'Find the middle black key of the 3-black-key group: G#4 with Index Finger (2).',
            landmarkHint: 'Center black key between G4 and A4',
          },
        ],
      },
      {
        id: 'l08-step-3',
        stepNumber: 3,
        type: 'wait_mode',
        title: 'Wait Mode: Für Elise Untimed Walkthrough',
        instruction:
          'Walk through all 4 measures of Für Elise untimed. Pay close attention to D#5 in Measure 1 vs. D5 natural in Measure 2.',
        coachTip: 'In Measure 3, both Left Hand (G#3) and Right Hand (G#4) visit the middle black key of the 3-black-key group.',
        handFilter: 'both',
      },
      {
        id: 'l08-step-4',
        stepNumber: 4,
        type: 'slow_flow',
        title: 'Slow Flow: 55 BPM Expressive Rehearsal',
        instruction:
          'Play Für Elise at 70% tempo with warm acoustic pedal resonance.',
        coachTip: 'Let the eighth-note motif float gently like a whispered conversation.',
        tempoMultiplier: 0.7,
        handFilter: 'both',
      },
      {
        id: 'l08-step-5',
        stepNumber: 5,
        type: 'stage_performance',
        title: 'Stage Performance: 78 BPM Conservatory Showcase',
        instruction:
          'Perform Beethoven’s Für Elise at 78 BPM to complete the Beginner Conservatory Curriculum!',
        coachTip: 'Keep your shoulders relaxed and savor the final A Minor resolution.',
        tempoMultiplier: 1.0,
        handFilter: 'both',
      },
    ],
  },
];

const LESSON_ID_ALIAS_MAP: Record<string, string> = {
  'lesson-01': 'lesson-01-middle-c-walk',
  'lesson-01-middle-c-walk': 'lesson-01-middle-c-walk',
  'lesson-02': 'lesson-02-ode-to-joy',
  'lesson-02-ode-to-joy': 'lesson-02-ode-to-joy',
  'lesson-03': 'lesson-03-bass-clef-anchors',
  'lesson-03-bass-clef-anchors': 'lesson-03-bass-clef-anchors',
  'lesson-03-au-clair-rhythm': 'lesson-03-bass-clef-anchors',
  'lesson-04': 'lesson-04-skipping-stones-leaps',
  'lesson-04-skipping-stones-leaps': 'lesson-04-skipping-stones-leaps',
  'lesson-04-left-hand-twinkle': 'lesson-04-skipping-stones-leaps',
  'lesson-05': 'lesson-05-c-and-g-major-triads',
  'lesson-05-c-and-g-major-triads': 'lesson-05-c-and-g-major-triads',
  'lesson-05-chords-c-g-pop': 'lesson-05-c-and-g-major-triads',
  'lesson-06': 'lesson-06-four-chord-pop-engine',
  'lesson-06-four-chord-pop-engine': 'lesson-06-four-chord-pop-engine',
  'lesson-06-four-chord-anthem': 'lesson-06-four-chord-pop-engine',
  'lesson-07': 'lesson-07-two-hand-conversation',
  'lesson-07-two-hand-conversation': 'lesson-07-two-hand-conversation',
  'lesson-07-minuet-in-g': 'lesson-07-two-hand-conversation',
  'lesson-08': 'lesson-08-fur-elise-gymnopedie',
  'lesson-08-fur-elise-gymnopedie': 'lesson-08-fur-elise-gymnopedie',
};

export function getLessonById(id: string): Lesson {
  const canonicalId = LESSON_ID_ALIAS_MAP[id] ?? id;
  return (
    CURRICULUM_LESSONS.find((lesson) => lesson.id === canonicalId) ?? CURRICULUM_LESSONS[0]
  );
}
