import type {
  Clef,
  FingerNumber,
  MistakeCategory,
  NoteDurationType,
  ScoreData,
  ScoreNoteEvent,
  SingleHand,
  VideoLesson,
} from '../types';
import { inferClefForMidi, midiToNoteName } from '../utils/midiUtils';

function demoNote(
  idPrefix: string,
  measureIndex: number,
  beatStart: number,
  durationBeats: number,
  midi: number,
  hand: SingleHand,
  finger: FingerNumber,
  options?: {
    durationType?: NoteDurationType;
    clef?: Clef;
    chordSymbol?: string;
    techniqueTip?: string;
    lyric?: string;
  }
): ScoreNoteEvent {
  const durationType: NoteDurationType =
    options?.durationType ??
    (durationBeats >= 4
      ? 'whole'
      : durationBeats >= 2
      ? 'half'
      : durationBeats >= 1
      ? 'quarter'
      : 'eighth');

  return {
    id: `${idPrefix}-m${measureIndex}-b${beatStart}-${hand}-${midi}`,
    midi,
    noteName: midiToNoteName(midi),
    measureIndex,
    beatStart,
    durationBeats,
    durationType,
    hand,
    clef: options?.clef ?? inferClefForMidi(midi, hand),
    finger,
    chordSymbol: options?.chordSymbol,
    techniqueTip: options?.techniqueTip,
    lyric: options?.lyric,
  };
}

export const VIDEO_LESSONS: VideoLesson[] = [
  {
    id: 'vid-01-posture-arch',
    title: 'The Natural Hand Arch & Curved Fingers ("The Orange Hold")',
    subtitle: 'Prevent neighbor-key slips with relaxed wrist alignment and curved knuckles',
    instructor: 'Clara Vance · Royal Conservatory Faculty',
    durationLabel: '1:45',
    durationSec: 105,
    category: 'Posture & Landmarks',
    addressesMistakes: ['ADJACENT_KEY_SLIP', 'CHROMATIC_ACCIDENTAL_MISS'],
    linkedLessonIds: ['lesson-01-middle-c-walk', 'lesson-02-ode-to-joy', 'lesson-08-fur-elise-gymnopedie'],
    summary:
      'Discover how holding an imaginary orange beneath your palm aligns all five fingers over their own adjacent white keys, eliminating stiff wrists and accidental neighbor-key slips.',
    keyCheckpoints: [
      'Drop your hand naturally from your side—that relaxed curve is your natural piano arch.',
      'Play with the fleshy pad just behind the fingernail, while Thumb (1) rests on its outer corner.',
      'Keep the bridge of your hand gently domed so Fingers 3, 4, and 5 never collapse flat.',
    ],
    youtubeVideoId: 'QBH6IpRkVDs',
    youtubeStartSec: 12,
    interactiveDemoScore: {
      id: 'demo-vid-01-posture-arch',
      title: 'The 5-Finger Orange Arch Walk',
      subtitle: 'Overhead Hand Posture Demonstration',
      bpm: 72,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 3,
      totalBeats: 12,
      notes: [
        demoNote('v01', 0, 0, 1, 60, 'right', 1, {
          chordSymbol: 'C',
          techniqueTip: 'Thumb (1) plays on its outside corner with a loose wrist',
          lyric: 'Do',
        }),
        demoNote('v01', 0, 1, 1, 62, 'right', 2, {
          techniqueTip: 'Index (2) curves gently onto the center of D4',
          lyric: 'Re',
        }),
        demoNote('v01', 0, 2, 1, 64, 'right', 3, {
          techniqueTip: 'Middle (3) forms the tallest pillar of the hand arch',
          lyric: 'Mi',
        }),
        demoNote('v01', 0, 3, 1, 65, 'right', 4, {
          techniqueTip: 'Lift Ring (4) independently from the main knuckle',
          lyric: 'Fa',
        }),
        demoNote('v01', 1, 4, 2, 67, 'right', 5, {
          chordSymbol: 'G',
          techniqueTip: 'Pinky (5) stays curved—never flat—to support the outer arch',
          lyric: 'Sol',
        }),
        demoNote('v01', 1, 6, 1, 65, 'right', 4, { lyric: 'Fa' }),
        demoNote('v01', 1, 7, 1, 64, 'right', 3, { lyric: 'Mi' }),
        demoNote('v01', 2, 8, 1, 62, 'right', 2, {
          chordSymbol: 'C',
          lyric: 'Re',
        }),
        demoNote('v01', 2, 9, 1, 64, 'right', 3, { lyric: 'Mi' }),
        demoNote('v01', 2, 10, 2, 60, 'right', 1, {
          techniqueTip: 'Release weight into the keybed and let the wrist float',
          lyric: 'Do',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55], style: 'warm_pad', velocity: 45 },
        { beatStart: 4, durationBeats: 4, midiNotes: [55, 59], style: 'warm_pad', velocity: 45 },
        { beatStart: 8, durationBeats: 4, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 50 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. The Imaginary Orange Dome',
        keyTakeaway: 'Let your palm form a hollow dome as if resting over a tennis ball or orange.',
        narration:
          'Welcome to the studio! Before pressing a single key, drop your right arm by your side and bring it up to the keyboard. Notice how your fingers naturally curve? Imagine holding a small orange under your palm.',
        demoNotesMidi: [60, 62, 64],
        hand: 'right',
        finger: 1,
      },
      {
        timeSec: 35,
        title: '2. Thumb Corner vs. Curved Finger Pads',
        keyTakeaway: 'Thumb (1) plays on its side edge; Fingers 2–5 play on their cushioned tips.',
        narration:
          'Your thumb is shorter than your fingers, so let it rest on its outer corner over Middle C (C4). Fingers 2 and 3 stand tall on their soft pads over D4 and E4 so they never brush adjacent keys.',
        demoNotesMidi: [60, 62, 64, 65],
        hand: 'right',
        finger: 3,
      },
      {
        timeSec: 70,
        title: '3. Supporting Fingers 4 & 5',
        keyTakeaway: 'Keep your pinky knuckle rounded so Ring (4) and Pinky (5) move cleanly.',
        narration:
          'When walking up to F4 and G4, avoid letting the outside of your palm collapse. A tall pinky bridge gives Ring Finger 4 room to lift cleanly without dragging E4 or G4 down with it.',
        demoNotesMidi: [64, 65, 67, 65, 64],
        hand: 'right',
        finger: 5,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Try the Curved Arch 3-Note Walk',
      instructions:
        'Curve your Right Hand over Middle C position and play C4 (Thumb 1) → D4 (Index 2) → E4 (Middle 3) cleanly.',
      targetMidis: [60, 62, 64],
      targetNoteNames: ['C4', 'D4', 'E4'],
      hand: 'right',
      fingers: [1, 2, 3],
    },
  },
  {
    id: 'vid-02-middle-c-landmark',
    title: 'Finding Middle C & The 2-Black-Key Chopsticks Landmark',
    subtitle: 'Instant keyboard orientation across C3, Middle C (C4), and C5 without stickers',
    instructor: 'Clara Vance · Royal Conservatory Faculty',
    durationLabel: '2:10',
    durationSec: 130,
    category: 'Posture & Landmarks',
    addressesMistakes: ['LANDMARK_DISPLACEMENT', 'OCTAVE_SHIFT'],
    linkedLessonIds: ['lesson-01-middle-c-walk', 'lesson-03-bass-clef-anchors'],
    summary:
      'Learn how the repeating pattern of 2 black keys ("chopsticks") and 3 black keys ("fork") gives you an unshakeable compass for finding any C and F on the piano in under a second.',
    keyCheckpoints: [
      'Every C on the piano sits immediately to the left of a group of 2 black keys.',
      'Middle C (C4) is the C closest to the center brand fallboard—bridge between Treble and Bass clefs.',
      'Bass C (C3) sits 1 octave (7 white keys) left of Middle C; Treble C (C5) sits 1 octave right.',
    ],
    youtubeVideoId: '4SXQ_wlbWog',
    youtubeStartSec: 8,
    interactiveDemoScore: {
      id: 'demo-vid-02-middle-c-landmark',
      title: 'Octave C Compass & Chopsticks Landmark',
      subtitle: 'Locating C3, C4, and C5',
      bpm: 70,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 3,
      totalBeats: 12,
      notes: [
        demoNote('v02', 0, 0, 2, 60, 'right', 1, {
          chordSymbol: 'C4 (Middle C)',
          techniqueTip: 'White key immediately left of the center 2 black keys',
          lyric: 'Mid-C',
        }),
        demoNote('v02', 0, 2, 1, 62, 'right', 2, {
          techniqueTip: 'D4 sits right between the 2 black keys ("dog in the doghouse")',
          lyric: 'D4',
        }),
        demoNote('v02', 0, 3, 1, 64, 'right', 3, {
          techniqueTip: 'E4 sits to the right of the 2 black keys',
          lyric: 'E4',
        }),
        demoNote('v02', 1, 4, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C3 (Bass C)',
          techniqueTip: 'One octave lower—left of the lower 2 black keys',
          lyric: 'Bass-C',
        }),
        demoNote('v02', 1, 6, 2, 60, 'right', 1, {
          chordSymbol: 'C4',
          lyric: 'Mid-C',
        }),
        demoNote('v02', 2, 8, 2, 72, 'right', 5, {
          chordSymbol: 'C5 (Treble C)',
          techniqueTip: 'One octave higher—left of the upper 2 black keys',
          lyric: 'High-C',
        }),
        demoNote('v02', 2, 10, 2, 60, 'right', 1, {
          chordSymbol: 'C4',
          techniqueTip: 'Return home to Middle C4',
          lyric: 'Home',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55], style: 'warm_pad', velocity: 42 },
        { beatStart: 4, durationBeats: 4, midiNotes: [48, 52], style: 'bass_pulse', velocity: 45 },
        { beatStart: 8, durationBeats: 4, midiNotes: [48, 55, 64], style: 'warm_pad', velocity: 48 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. The 2-Black-Key Chopsticks Landmark',
        keyTakeaway: 'Find the pair of 2 black keys—the white key to their immediate left is always C.',
        narration:
          'Look at the raised ebony keys: they alternate in groups of 2 ("chopsticks") and 3 ("three-tined fork"). Touch the 2 black keys in the middle of your keyboard, then slide down to the white key on the left. That is Middle C (C4)!',
        demoNotesMidi: [61, 63, 60],
        hand: 'right',
        finger: 1,
      },
      {
        timeSec: 45,
        title: '2. D4 in the Doghouse & E4 on the Right',
        keyTakeaway: 'C–D–E frame the 2 black keys: C on the left, D in the middle, E on the right.',
        narration:
          'Once you know Middle C, D4 lives right inside the two black keys—like a dog in a doghouse—and E4 sits just to the right of the second black key.',
        demoNotesMidi: [60, 62, 64],
        hand: 'right',
        finger: 2,
      },
      {
        timeSec: 90,
        title: '3. Navigating Octaves: Bass C3 to Treble C5',
        keyTakeaway: 'Shift 7 white keys left for Bass C (C3) or 7 white keys right for Treble C (C5).',
        narration:
          'If the coach says you are one octave off, check which pair of 2 black keys you anchored on. Bass C (C3) belongs to your Left Hand in Bass Clef; Middle C (C4) and Treble C (C5) belong to your Right Hand.',
        demoNotesMidi: [48, 60, 72],
        hand: 'left',
        finger: 5,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Landmark Compass Check: C3 → C4 → E4',
      instructions:
        'Find Bass C3 (left of lower 2 black keys), then Middle C4, then E4 (right of center 2 black keys).',
      targetMidis: [48, 60, 64],
      targetNoteNames: ['C3', 'C4', 'E4'],
      hand: 'right',
      fingers: [1, 1, 3],
    },
  },
  {
    id: 'vid-03-steps-vs-skips',
    title: 'Steps vs. Skips & Taming Fingers 4 and 5',
    subtitle: 'Reading line-to-space steps (2nds) vs. line-to-line skips (3rds) in 5-finger position',
    instructor: 'Julian Mercer · Conservatory Pedagogy Lead',
    durationLabel: '2:25',
    durationSec: 145,
    category: 'Sight Reading',
    addressesMistakes: ['ADJACENT_KEY_SLIP', 'INTERVAL_MISJUDGE'],
    linkedLessonIds: ['lesson-02-ode-to-joy', 'lesson-04-skipping-stones-leaps'],
    summary:
      'Train your eye and fingers to tell the difference between a neighbor step (line-to-space) and a skipping stone leap (line-to-line or space-to-space), while strengthening Ring (4) and Pinky (5).',
    keyCheckpoints: [
      'A Step (2nd) moves from a Line to the next Space and uses adjacent fingers (1→2, 2→3, 3→4).',
      'A Skip (3rd) jumps Line-to-Line (E4→G4) or Space-to-Space (D4→F4) and skips one finger & one white key.',
      'To control Ring Finger (4), release tension in Middle (3) and Pinky (5) before striking.',
    ],
    youtubeVideoId: 'WJ3-F02-F_Y',
    youtubeStartSec: 15,
    interactiveDemoScore: {
      id: 'demo-vid-03-steps-vs-skips',
      title: 'Steps vs. Skips & Upper Finger Control',
      subtitle: '5-Finger C Position Workout',
      bpm: 76,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 3,
      totalBeats: 12,
      notes: [
        demoNote('v03', 0, 0, 1, 64, 'right', 3, {
          chordSymbol: 'C (Steps)',
          techniqueTip: 'Start on E4 (Line 1) with Middle Finger 3',
          lyric: 'Step',
        }),
        demoNote('v03', 0, 1, 1, 65, 'right', 4, {
          techniqueTip: 'Step up to Space 1 (F4) with Ring Finger 4',
          lyric: 'up',
        }),
        demoNote('v03', 0, 2, 1, 67, 'right', 5, {
          techniqueTip: 'Step up to Line 2 (G4) with Pinky 5',
          lyric: 'high',
        }),
        demoNote('v03', 0, 3, 1, 65, 'right', 4, { lyric: 'down' }),
        demoNote('v03', 1, 4, 1, 60, 'right', 1, {
          chordSymbol: 'C (Skips)',
          techniqueTip: 'Start on C4 (Thumb 1)',
          lyric: 'Skip',
        }),
        demoNote('v03', 1, 5, 1, 64, 'right', 3, {
          techniqueTip: 'Skip over D4! Jump C4 (1) → E4 (3)',
          lyric: 'to-E',
        }),
        demoNote('v03', 1, 6, 2, 67, 'right', 5, {
          techniqueTip: 'Skip over F4! Jump E4 (3) → G4 (5)',
          lyric: 'to-G',
        }),
        demoNote('v03', 2, 8, 1, 65, 'right', 4, {
          chordSymbol: 'G7 → C',
          lyric: 'Fa',
        }),
        demoNote('v03', 2, 9, 1, 62, 'right', 2, {
          techniqueTip: 'Skip Space-to-Space down F4 (4) → D4 (2)',
          lyric: 'Re',
        }),
        demoNote('v03', 2, 10, 2, 60, 'right', 1, { lyric: 'Do' }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55], style: 'warm_pad', velocity: 44 },
        { beatStart: 4, durationBeats: 4, midiNotes: [48, 52, 55], style: 'arpeggio', velocity: 46 },
        { beatStart: 8, durationBeats: 4, midiNotes: [48, 55, 60], style: 'warm_pad', velocity: 48 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. Taming Ring (4) & Pinky (5) in Ode to Joy',
        keyTakeaway: 'Fingers 4 and 5 share a tendon—keep your wrist level and lift softly.',
        narration:
          'In Beethoven’s Ode to Joy, the melody begins on E4 (Finger 3) and climbs to F4 (Finger 4) and G4 (Finger 5). Because fingers 4 and 5 are naturally linked, lean your hand weight slightly toward the pinky side.',
        demoNotesMidi: [64, 65, 67, 65, 64],
        hand: 'right',
        finger: 4,
      },
      {
        timeSec: 50,
        title: '2. How to Spot a Skip (3rd) on the Staff',
        keyTakeaway: 'Line-to-Line or Space-to-Space means skip 1 white key and skip 1 finger.',
        narration:
          'When two notes sit on neighboring lines—like E4 (Line 1) and G4 (Line 2)—do not play F4 in between! Jump directly from Finger 3 to Finger 5.',
        demoNotesMidi: [60, 64, 67],
        hand: 'right',
        finger: 5,
      },
      {
        timeSec: 100,
        title: '3. Space-to-Space Skips (D4 to F4)',
        keyTakeaway: 'Index Finger (2) on D4 to Ring Finger (4) on F4 skips over E4.',
        narration:
          'Now try a space-to-space skip: press D4 with Finger 2, skip over E4, and land on F4 with Finger 4. Notice how your five-finger hand never needs to shift away from C position!',
        demoNotesMidi: [62, 65, 64, 60],
        hand: 'right',
        finger: 2,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Upper Arch & Skip Check',
      instructions:
        'Play E4 (3) → F4 (4) → G4 (5), then skip from E4 (3) → C4 (1).',
      targetMidis: [64, 65, 67, 64, 60],
      targetNoteNames: ['E4', 'F4', 'G4', 'E4', 'C4'],
      hand: 'right',
      fingers: [3, 4, 5, 3, 1],
    },
  },
  {
    id: 'vid-04-rhythm-pulse-breathing',
    title: 'The Inner Metronome: Quarter, Half & Whole Note Pulse',
    subtitle: 'Cure rushing, hesitation pauses, and clipped half/whole notes with breath counting',
    instructor: 'Clara Vance · Royal Conservatory Faculty',
    durationLabel: '2:15',
    durationSec: 135,
    category: 'Rhythm & Tempo',
    addressesMistakes: ['RUSHING_BEAT', 'DRAGGING_HESITATION', 'SHORT_NOTE_CLIPPING'],
    linkedLessonIds: ['lesson-01-middle-c-walk', 'lesson-03-bass-clef-anchors', 'lesson-04-skipping-stones-leaps'],
    summary:
      'Learn how to lock into the brass metronome pulse, hold open-head Half Notes for a full 2 beats and Whole Notes for 4 beats, and read one beat ahead so measure barlines never cause a freeze.',
    keyCheckpoints: [
      'Filled black noteheads with stems are Quarter Notes (1 beat: "1").',
      'Hollow noteheads with stems are Half Notes (hold down for 2 full clicks: "1 - 2").',
      'Hollow oval Whole Notes have no stem—let the piano string ring for all 4 beats ("1 - 2 - 3 - 4").',
    ],
    youtubeVideoId: '2UphJk0QqYM',
    youtubeStartSec: 10,
    interactiveDemoScore: {
      id: 'demo-vid-04-rhythm-pulse-breathing',
      title: 'Quarter, Half & Whole Note Sustain Etude',
      subtitle: 'Rhythmic Subdivision & Full Sustain',
      bpm: 72,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 3,
      totalBeats: 12,
      notes: [
        demoNote('v04', 0, 0, 1, 60, 'right', 1, {
          chordSymbol: 'C (Quarters)',
          techniqueTip: 'Beat 1: Steady quarter note pulse',
          lyric: '1',
        }),
        demoNote('v04', 0, 1, 1, 60, 'right', 1, { lyric: '2' }),
        demoNote('v04', 0, 2, 1, 60, 'right', 1, { lyric: '3' }),
        demoNote('v04', 0, 3, 1, 62, 'right', 2, { lyric: '4' }),
        demoNote('v04', 1, 4, 2, 64, 'right', 3, {
          chordSymbol: 'G (Half Notes)',
          techniqueTip: 'Half Note: Keep Finger 3 pressed through Beat 1 AND Beat 2',
          lyric: 'Hold 1-2',
        }),
        demoNote('v04', 1, 6, 2, 62, 'right', 2, {
          techniqueTip: 'Half Note: Keep Finger 2 down through Beat 3 AND Beat 4',
          lyric: 'Hold 3-4',
        }),
        demoNote('v04', 2, 8, 4, 60, 'right', 1, {
          chordSymbol: 'C (Whole Note)',
          techniqueTip: 'Whole Note: Hold for all 4 beats while listening to the decay',
          lyric: 'Hold 1-2-3-4',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55], style: 'bass_pulse', velocity: 46 },
        { beatStart: 4, durationBeats: 4, midiNotes: [43, 50, 55], style: 'bass_pulse', velocity: 46 },
        { beatStart: 8, durationBeats: 4, midiNotes: [48, 52, 55], style: 'warm_pad', velocity: 50 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. Quarter Note Heartbeat vs. Half Note Sustain',
        keyTakeaway: 'Never lift a Half Note early—keep the key depressed for 2 full metronome clicks.',
        narration:
          'When beginners see an open Half Note, they often strike it on time but lift their finger after one beat. In piano music, how long you hold a key shapes the phrase just as much as when you strike it.',
        demoNotesMidi: [60, 62, 64],
        hand: 'right',
        finger: 3,
      },
      {
        timeSec: 45,
        title: '2. Reading Ahead While Holding Long Notes',
        keyTakeaway: 'Use the 2-beat or 4-beat sustain window to move your eyes to the next measure.',
        narration:
          'Long notes are a gift! While your finger holds a 2-beat Half Note on E4, your eyes should already travel across the barline to spot the first note of the next measure—eliminating barline hesitation.',
        demoNotesMidi: [64, 62, 60],
        hand: 'right',
        finger: 2,
      },
      {
        timeSec: 90,
        title: '3. Breathing Against Rushing',
        keyTakeaway: 'Exhale on Beat 1 and let the metronome click arrive before your finger drops.',
        narration:
          'If the Coach diagnoses Rushing, your fingers are anticipating familiar notes. Count "1-and-2-and" softly out loud so each note lands squarely in the center of the beat.',
        demoNotesMidi: [60, 60, 62, 64],
        hand: 'right',
        finger: 1,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Rhythm Pulse Check: C4 → C4 → D4 → E4',
      instructions:
        'Play the opening phrase of Au Clair de la Lune: C4 (1) → C4 (1) → D4 (2) → E4 (3) with an even pulse.',
      targetMidis: [60, 60, 62, 64],
      targetNoteNames: ['C4', 'C4', 'D4', 'E4'],
      hand: 'right',
      fingers: [1, 1, 2, 3],
    },
  },
  {
    id: 'vid-05-triad-claw-and-inversions',
    title: 'The 1–3–5 Triad Shape: Striking 3-Note Chords Together',
    subtitle: 'Build C Major and G Major root-position triads with a locked, relaxed hand frame',
    instructor: 'Elena Rostova · Contemporary & Pop Piano Coach',
    durationLabel: '2:30',
    durationSec: 150,
    category: 'Chords & Accompaniment',
    addressesMistakes: ['CHORD_TRANSITION_STALL', 'ADJACENT_KEY_SLIP'],
    linkedLessonIds: ['lesson-05-c-and-g-major-triads', 'lesson-06-four-chord-pop-engine'],
    summary:
      'Master the universal "Play 1, Skip 1, Play 1, Skip 1, Play 1" triad formula using Fingers 1–3–5 so all three chord tones sound simultaneously and shift smoothly between chords.',
    keyCheckpoints: [
      'A Root-Position Triad uses Thumb (1) on the Root, Middle (3) on the 3rd, and Pinky (5) on the 5th.',
      'Lift Fingers 2 and 4 slightly so they stay relaxed in the air while 1–3–5 drop with arm weight.',
      'When moving from C Major (C4-E4-G4) to G Major (G4-B4-D5), keep the 1–3–5 spacing molded in the air.',
    ],
    youtubeVideoId: 'gmvwZRwn-j0',
    youtubeStartSec: 18,
    interactiveDemoScore: {
      id: 'demo-vid-05-triad-claw-and-inversions',
      title: 'C Major & G Major Triad Groove',
      subtitle: 'Simultaneous 1–3–5 Chord Voicing',
      bpm: 76,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 2,
      totalBeats: 8,
      notes: [
        demoNote('v05', 0, 0, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          techniqueTip: 'C Major Triad: Strike C4 (1) + E4 (3) + G4 (5) together',
        }),
        demoNote('v05', 0, 0, 2, 64, 'right', 3),
        demoNote('v05', 0, 0, 2, 67, 'right', 5),
        demoNote('v05', 0, 2, 2, 60, 'right', 1, { chordSymbol: 'C' }),
        demoNote('v05', 0, 2, 2, 64, 'right', 3),
        demoNote('v05', 0, 2, 2, 67, 'right', 5),
        demoNote('v05', 1, 4, 2, 67, 'right', 1, {
          chordSymbol: 'G',
          techniqueTip: 'G Major Triad: Glide 1–3–5 frame up to G4 (1) + B4 (3) + D5 (5)',
        }),
        demoNote('v05', 1, 4, 2, 71, 'right', 3),
        demoNote('v05', 1, 4, 2, 74, 'right', 5),
        demoNote('v05', 1, 6, 2, 60, 'right', 1, {
          chordSymbol: 'C',
          techniqueTip: 'Return to C Major cleanly as a single unit',
        }),
        demoNote('v05', 1, 6, 2, 64, 'right', 3),
        demoNote('v05', 1, 6, 2, 67, 'right', 5),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 4, midiNotes: [48, 55], style: 'bass_pulse', velocity: 52 },
        { beatStart: 4, durationBeats: 2, midiNotes: [43, 50], style: 'bass_pulse', velocity: 52 },
        { beatStart: 6, durationBeats: 2, midiNotes: [48, 55], style: 'bass_pulse', velocity: 52 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. The "Play 1, Skip 1, Play 1" Triad Formula',
        keyTakeaway: 'Place Fingers 1–3–5 on every other white key to build any diatonic triad.',
        narration:
          'Chords are the engine of pop, film, and classical accompaniment. Place your Right Hand in C position and press Thumb (1) on C4, Middle (3) on E4, and Pinky (5) on G4 while Fingers 2 and 4 float.',
        demoNotesMidi: [60, 64, 67],
        hand: 'right',
        finger: 1,
      },
      {
        timeSec: 55,
        title: '2. Dropping with Arm Weight (Zero Chord Roll)',
        keyTakeaway: 'Pre-feel all three keys before pressing down together from the forearm.',
        narration:
          'If your chords sound staggered like an involuntary harp roll, touch the surface of C4, E4, and G4 first, firm your 1–3–5 fingertips slightly, and drop straight down with forearm weight.',
        demoNotesMidi: [60, 64, 67],
        hand: 'right',
        finger: 3,
      },
      {
        timeSec: 105,
        title: '3. The Air-Frame Glide to G Major',
        keyTakeaway: 'Keep your 1–3–5 spacing frozen in the air as Thumb moves from C4 to G4.',
        narration:
          'Never rebuild a chord one finger at a time! Hold your 1–3–5 hand mold in the air, watch only your Thumb (1) glide up to G4, and B4 (3) + D5 (5) will automatically land on their targets.',
        demoNotesMidi: [67, 71, 74, 60, 64, 67],
        hand: 'right',
        finger: 5,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Arpeggiate & Lock the C Major Triad',
      instructions:
        'Play the three notes of the C Major Triad: C4 (Thumb 1) → E4 (Middle 3) → G4 (Pinky 5).',
      targetMidis: [60, 64, 67],
      targetNoteNames: ['C4', 'E4', 'G4'],
      hand: 'right',
      fingers: [1, 3, 5],
    },
  },
  {
    id: 'vid-06-left-hand-anchor-and-groove',
    title: 'Left Hand Bass Landmarks & Pop Root Anchoring',
    subtitle: 'Master Bass Clef mirror fingerings (5 on C3, 1 on G3) and 4-chord pop transitions',
    instructor: 'Elena Rostova · Contemporary & Pop Piano Coach',
    durationLabel: '2:40',
    durationSec: 160,
    category: 'Chords & Accompaniment',
    addressesMistakes: ['OCTAVE_SHIFT', 'CHORD_TRANSITION_STALL', 'LANDMARK_DISPLACEMENT'],
    linkedLessonIds: [
      'lesson-03-bass-clef-anchors',
      'lesson-04-skipping-stones-leaps',
      'lesson-06-four-chord-pop-engine',
    ],
    summary:
      'Conquer the Bass Clef and Left Hand mirror finger numbering (Pinky 5 on C3, Thumb 1 on G3/A3), and anchor rich pop progressions (C – G – Am – F) with confident bass roots.',
    keyCheckpoints: [
      'Left Hand numbers mirror the Right Hand: Thumb is ALWAYS 1 (on G3/A3) and Pinky is ALWAYS 5 (on C3).',
      'The two dots of the Bass Clef (F Clef) surround the F3 line (Finger 2 in C3 position).',
      'In the 4-Chord Hit Progression (C–G–Am–F), your Left Hand plays C3 (5) → G3 (1) → A3 (1) → F3 (2).',
    ],
    youtubeVideoId: '3BULT0-vT7Q',
    youtubeStartSec: 14,
    interactiveDemoScore: {
      id: 'demo-vid-06-left-hand-anchor-and-groove',
      title: 'Left Hand Bass C3–G3–A3–F3 Anchor Walk',
      subtitle: 'Bass Clef Landmarks & Pop Root Progression',
      bpm: 74,
      timeSignature: [4, 4],
      keySignature: 'C Major',
      totalMeasures: 2,
      totalBeats: 8,
      notes: [
        demoNote('v06', 0, 0, 2, 48, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'C',
          techniqueTip: 'Bass C3 with Left Hand Pinky (5)',
          lyric: 'C3 (5)',
        }),
        demoNote('v06', 0, 2, 2, 55, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'G',
          techniqueTip: 'Perfect 5th up to G3 with Left Hand Thumb (1)',
          lyric: 'G3 (1)',
        }),
        demoNote('v06', 1, 4, 2, 57, 'left', 1, {
          clef: 'bass',
          chordSymbol: 'Am',
          techniqueTip: 'Step Thumb 1 white key right to A3 (top line of Bass Clef)',
          lyric: 'A3 (1)',
        }),
        demoNote('v06', 1, 6, 2, 53, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'F',
          techniqueTip: 'Index Finger (2) on F3 (the F-Clef dot line)',
          lyric: 'F3 (2)',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 2, midiNotes: [60, 64, 67], style: 'warm_pad', velocity: 45 },
        { beatStart: 2, durationBeats: 2, midiNotes: [59, 62, 67], style: 'warm_pad', velocity: 45 },
        { beatStart: 4, durationBeats: 2, midiNotes: [60, 64, 69], style: 'warm_pad', velocity: 45 },
        { beatStart: 6, durationBeats: 2, midiNotes: [60, 65, 69], style: 'warm_pad', velocity: 45 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. Left Hand Mirror Finger Numbers (5 to 1)',
        keyTakeaway: 'In C3 Bass Position, Pinky (5) anchors on C3 and Thumb (1) sits on G3.',
        narration:
          'When switching to the Left Hand, remember that thumbs are always Finger 1 on both hands. That means when your Left Hand rests on C3–D3–E3–F3–G3, C3 is played by Pinky (5) and G3 is played by Thumb (1).',
        demoNotesMidi: [48, 50, 52, 53, 55],
        hand: 'left',
        finger: 5,
      },
      {
        timeSec: 55,
        title: '2. Reading the F-Clef Dots & The 5th Leap',
        keyTakeaway: 'F3 sits right between the two dots of the Bass Clef; G3 sits in the top space.',
        narration:
          'The Bass Clef is also called the F Clef because its two dots hug the F3 line (Left Hand Finger 2). One space above F3 is G3 (Thumb 1)—giving you an instant landmark for the C3-to-G3 fifth jump.',
        demoNotesMidi: [48, 55, 53, 52],
        hand: 'left',
        finger: 1,
      },
      {
        timeSec: 110,
        title: '3. The 4-Chord Hit Root Pattern (C – G – Am – F)',
        keyTakeaway: 'Play C3 (5) → G3 (1) → A3 (1) → F3 (2) with zero hand jumps.',
        narration:
          'To play thousands of pop ballads, your Left Hand barely moves! Play C3 with Pinky (5), G3 with Thumb (1), reach Thumb 1 key right to A3, and drop Index (2) onto F3.',
        demoNotesMidi: [48, 55, 57, 53],
        hand: 'left',
        finger: 2,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Try the Left Hand 4-Chord Bass Roots',
      instructions:
        'Play Left Hand C3 (Pinky 5) → G3 (Thumb 1) → A3 (Thumb 1) → F3 (Index 2).',
      targetMidis: [48, 55, 57, 53],
      targetNoteNames: ['C3', 'G3', 'A3', 'F3'],
      hand: 'left',
      fingers: [5, 1, 1, 2],
    },
  },
  {
    id: 'vid-07-black-keys-and-accidentals',
    title: 'Black Keys, Sharps & Chromatic Neighbor Touch',
    subtitle: 'Slide smoothly forward toward the fallboard to reach D#5, G#4, and F#4 effortlessly',
    instructor: 'Julian Mercer · Conservatory Pedagogy Lead',
    durationLabel: '2:20',
    durationSec: 140,
    category: 'Sight Reading',
    addressesMistakes: ['CHROMATIC_ACCIDENTAL_MISS', 'ADJACENT_KEY_SLIP'],
    linkedLessonIds: ['lesson-08-fur-elise-gymnopedie'],
    summary:
      'Learn how sharps (#) raise a note by one half-step (semitone) to the adjacent black key, and why sliding your hand 2 cm closer to the fallboard prevents twisting your wrist on passages like Für Elise.',
    keyCheckpoints: [
      'A Sharp (#) means play the very next key to the right (usually a raised black key, 1 semitone higher).',
      'Slide your whole hand slightly forward ("into the keys") so shorter fingers reach black keys without twisting.',
      'In Für Elise, Finger 5 stays over white E5 while Finger 4 rests poised right on black D#5.',
    ],
    youtubeVideoId: '5pidokakU4I',
    youtubeStartSec: 20,
    interactiveDemoScore: {
      id: 'demo-vid-07-black-keys-and-accidentals',
      title: 'Für Elise Chromatic Neighbor Motif',
      subtitle: 'Black Key In-and-Out Hand Position',
      bpm: 74,
      timeSignature: [3, 4],
      keySignature: 'A Minor',
      totalMeasures: 3,
      totalBeats: 9,
      notes: [
        demoNote('v07', 0, 0, 0.5, 76, 'right', 5, {
          chordSymbol: 'Am',
          techniqueTip: 'Pinky (5) on white key E5',
          lyric: 'E5',
        }),
        demoNote('v07', 0, 0.5, 0.5, 75, 'right', 4, {
          techniqueTip: 'Ring Finger (4) poised forward on black key D#5',
          lyric: 'D#5',
        }),
        demoNote('v07', 0, 1, 0.5, 76, 'right', 5, { lyric: 'E5' }),
        demoNote('v07', 0, 1.5, 0.5, 75, 'right', 4, { lyric: 'D#5' }),
        demoNote('v07', 0, 2, 0.5, 76, 'right', 5, { lyric: 'E5' }),
        demoNote('v07', 0, 2.5, 0.5, 71, 'right', 2, {
          techniqueTip: 'Index (2) lands cleanly on B4',
          lyric: 'B4',
        }),
        demoNote('v07', 1, 3, 0.5, 74, 'right', 4, {
          techniqueTip: 'Now Ring Finger (4) plays white key D5 natural!',
          lyric: 'D5',
        }),
        demoNote('v07', 1, 3.5, 0.5, 72, 'right', 3, { lyric: 'C5' }),
        demoNote('v07', 1, 4, 2, 69, 'right', 1, {
          chordSymbol: 'Am',
          techniqueTip: 'Settle warmly onto A4 (Thumb 1)',
          lyric: 'A4',
        }),
        demoNote('v07', 2, 6, 1, 64, 'right', 1, {
          chordSymbol: 'E7',
          lyric: 'E4',
        }),
        demoNote('v07', 2, 7, 1, 68, 'right', 2, {
          techniqueTip: 'Index (2) reaches middle black key G#4',
          lyric: 'G#4',
        }),
        demoNote('v07', 2, 8, 1, 69, 'right', 3, {
          chordSymbol: 'Am',
          lyric: 'A4',
        }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 3, midiNotes: [57, 64], style: 'warm_pad', velocity: 40 },
        { beatStart: 3, durationBeats: 3, midiNotes: [45, 52, 57], style: 'arpeggio', velocity: 46 },
        { beatStart: 6, durationBeats: 3, midiNotes: [52, 56, 59], style: 'warm_pad', velocity: 46 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. In-and-Out Hand Motion (Forward Toward the Fallboard)',
        keyTakeaway: 'Move your hand 2 cm deeper into the keys instead of twisting your wrist sideways.',
        narration:
          'White keys can be played near their front edge, right between the black keys, or further back. When a melody uses a black key like D#5 or G#4, slide your whole forearm slightly forward so your finger rests naturally on top of the black key.',
        demoNotesMidi: [76, 75, 76],
        hand: 'right',
        finger: 4,
      },
      {
        timeSec: 50,
        title: '2. The Für Elise Shimmer: E5 (5) ↔ D#5 (4)',
        keyTakeaway: 'Pre-place Ring Finger (4) on D#5 before starting the opening motif.',
        narration:
          'Before you play the first note of Für Elise, touch E5 with Pinky (5) and D#5 with Ring Finger (4) at the same time. Because both fingers are already touching their home keys, alternating E5–D#5–E5 becomes effortless.',
        demoNotesMidi: [76, 75, 76, 75, 76, 71, 74, 72, 69],
        hand: 'right',
        finger: 5,
      },
      {
        timeSec: 100,
        title: '3. D#5 (Sharp) vs. D5 (Natural) Resolution',
        keyTakeaway: 'Notice how Finger 4 plays black D#5 in Bar 1, then shifts 1 cm back to white D5 in Bar 2.',
        narration:
          'The secret of Beethoven’s magic is that Finger 4 plays the black key D#5 first, and then after B4 (Finger 2), Finger 4 plays the white key D5 natural on the way down to C5 and A4.',
        demoNotesMidi: [71, 74, 72, 69],
        hand: 'right',
        finger: 4,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Try the Für Elise Chromatic Opening',
      instructions:
        'Play E5 (5) → D#5 (4) → E5 (5) → B4 (2) → D5 (4) → C5 (3) → A4 (1).',
      targetMidis: [76, 75, 76, 71, 74, 72, 69],
      targetNoteNames: ['E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4'],
      hand: 'right',
      fingers: [5, 4, 5, 2, 4, 3, 1],
    },
  },
  {
    id: 'vid-08-two-hand-independence',
    title: 'Unlocking Both Hands Together & Downbeat Synchronization',
    subtitle: 'Coordinate simultaneous Left + Right Hand attacks and graceful handoffs in 3/4 and 4/4',
    instructor: 'Julian Mercer · Conservatory Pedagogy Lead',
    durationLabel: '3:00',
    durationSec: 180,
    category: 'Hand Coordination',
    addressesMistakes: ['TWO_HAND_DESYNC', 'DRAGGING_HESITATION'],
    linkedLessonIds: [
      'lesson-06-four-chord-pop-engine',
      'lesson-07-two-hand-conversation',
      'lesson-08-fur-elise-gymnopedie',
    ],
    summary:
      'Bridge the gap from one-hand playing to genuine two-hand piano performance by thinking vertically on shared downbeats ("Pinch Beat 1") and sustaining the Left Hand anchor while the Right Hand sings.',
    keyCheckpoints: [
      'Think vertically, not horizontally: on Beat 1, both hands execute a single unified event.',
      'Pre-position BOTH hands on their starting keys before counting in—never search with one hand after starting.',
      'Practice the "Beat 1 Freeze": strike Beat 1 with both hands together, pause to verify sustain, then flow through Beats 2 and 3.',
    ],
    youtubeVideoId: 'x2rQ7B5gX0I',
    youtubeStartSec: 15,
    interactiveDemoScore: {
      id: 'demo-vid-08-two-hand-independence',
      title: 'Minuet in G Two-Hand Downbeat Etude',
      subtitle: 'Simultaneous Downbeats & Independent Melody',
      bpm: 78,
      timeSignature: [3, 4],
      keySignature: 'G Major',
      totalMeasures: 4,
      totalBeats: 12,
      notes: [
        demoNote('v08', 0, 0, 3, 55, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'G',
          techniqueTip: 'Left Hand Pinky (5) holds G3 across all 3 beats of the measure',
        }),
        demoNote('v08', 0, 0, 1, 74, 'right', 5, {
          techniqueTip: 'Strike RH D5 (5) + LH G3 (5) at the exact same instant on Beat 1',
          lyric: 'Both!',
        }),
        demoNote('v08', 0, 1, 0.5, 67, 'right', 1, { lyric: 'G4' }),
        demoNote('v08', 0, 1.5, 0.5, 69, 'right', 2, { lyric: 'A4' }),
        demoNote('v08', 0, 2, 0.5, 71, 'right', 3, { lyric: 'B4' }),
        demoNote('v08', 0, 2.5, 0.5, 72, 'right', 4, { lyric: 'C5' }),
        demoNote('v08', 1, 3, 3, 59, 'left', 3, {
          clef: 'bass',
          chordSymbol: 'G/B',
          techniqueTip: 'Left Hand Middle (3) steps to B3 on Beat 1',
        }),
        demoNote('v08', 1, 3, 1, 74, 'right', 5, {
          techniqueTip: 'Together on Beat 1: LH B3 (3) + RH D5 (5)',
          lyric: 'Both!',
        }),
        demoNote('v08', 1, 4, 1, 67, 'right', 1, { lyric: 'G4' }),
        demoNote('v08', 1, 5, 1, 67, 'right', 1, { lyric: 'G4' }),
        demoNote('v08', 2, 6, 3, 60, 'left', 2, {
          clef: 'bass',
          chordSymbol: 'C',
        }),
        demoNote('v08', 2, 6, 1, 76, 'right', 5, {
          techniqueTip: 'Together on Beat 1: LH C4 (2) + RH E5 (5)',
          lyric: 'Both!',
        }),
        demoNote('v08', 2, 7, 1, 72, 'right', 3, { lyric: 'C5' }),
        demoNote('v08', 2, 8, 1, 74, 'right', 4, { lyric: 'D5' }),
        demoNote('v08', 3, 9, 3, 55, 'left', 5, {
          clef: 'bass',
          chordSymbol: 'G',
        }),
        demoNote('v08', 3, 9, 2, 71, 'right', 3, {
          lyric: 'Hold',
        }),
        demoNote('v08', 3, 11, 1, 67, 'right', 1, { lyric: 'G4' }),
      ],
      accompaniment: [
        { beatStart: 0, durationBeats: 3, midiNotes: [43, 50], style: 'warm_pad', velocity: 42 },
        { beatStart: 3, durationBeats: 3, midiNotes: [47, 55], style: 'warm_pad', velocity: 42 },
        { beatStart: 6, durationBeats: 3, midiNotes: [48, 55], style: 'warm_pad', velocity: 44 },
        { beatStart: 9, durationBeats: 3, midiNotes: [43, 50, 55], style: 'warm_pad', velocity: 46 },
      ],
    },
    chapters: [
      {
        timeSec: 0,
        title: '1. The Secret of Two Hands: Vertical "Beat 1 Pinch"',
        keyTakeaway: 'Your brain cannot track two separate melodies at once—fuse Beat 1 into one combined gesture.',
        narration:
          'When beginners play with both hands, one hand often lands slightly after the other. Instead of thinking "Left Hand plays G3 and Right Hand plays D5," feel both Pinkies (5 and 5) dropping together as a single unified clap on Beat 1.',
        demoNotesMidi: [55, 74],
        hand: 'right',
        finger: 5,
      },
      {
        timeSec: 60,
        title: '2. Left Hand glue while Right Hand dances',
        keyTakeaway: 'Let the Left Hand rest heavy like an anchor while the Right Hand steps lightly.',
        narration:
          'In Minuet in G, once your Left Hand strikes G3 on Beat 1, its job for the rest of the bar is simply to stay relaxed and heavy on that key while your Right Hand walks up G4–A4–B4–C5.',
        demoNotesMidi: [55, 67, 69, 71, 72, 74],
        hand: 'right',
        finger: 1,
      },
      {
        timeSec: 125,
        title: '3. Hand-to-Hand Conversation Handoffs',
        keyTakeaway: 'Prepare the receiving hand on its first key while the active hand plays its last note.',
        narration:
          'Whether in Minuet in G or Für Elise, always pre-park your inactive hand on its next note one beat early. When your hands are already resting on the keys, coordination feels automatic.',
        demoNotesMidi: [59, 74, 67, 60, 76],
        hand: 'left',
        finger: 3,
      },
    ],
    interactiveCheckpoint: {
      prompt: 'Minuet Melody & Anchor Check',
      instructions:
        'Play the Minuet in G right-hand motif: D5 (5) → G4 (1) → A4 (2) → B4 (3) → C5 (4) → D5 (5).',
      targetMidis: [74, 67, 69, 71, 72, 74],
      targetNoteNames: ['D5', 'G4', 'A4', 'B4', 'C5', 'D5'],
      hand: 'right',
      fingers: [5, 1, 2, 3, 4, 5],
    },
  },
];

/**
 * Cross-specification alias map so any short or alternate video ID resolves cleanly
 */
const VIDEO_ID_ALIAS_MAP: Record<string, string> = {
  'vid-01': 'vid-01-posture-arch',
  'vid-01-posture-arch': 'vid-01-posture-arch',
  'vid-02': 'vid-02-middle-c-landmark',
  'vid-02-middle-c-landmark': 'vid-02-middle-c-landmark',
  'vid-02-middle-c-landmarks': 'vid-02-middle-c-landmark',
  'vid-03': 'vid-03-steps-vs-skips',
  'vid-03-steps-vs-skips': 'vid-03-steps-vs-skips',
  'vid-03-five-finger-ode': 'vid-03-steps-vs-skips',
  'vid-04': 'vid-04-rhythm-pulse-breathing',
  'vid-04-rhythm-pulse-breathing': 'vid-04-rhythm-pulse-breathing',
  'vid-04-rhythm-pulse-counting': 'vid-04-rhythm-pulse-breathing',
  'vid-05': 'vid-05-triad-claw-and-inversions',
  'vid-05-triad-claw-and-inversions': 'vid-05-triad-claw-and-inversions',
  'vid-06-triad-chords-claw': 'vid-05-triad-claw-and-inversions',
  'vid-06': 'vid-06-left-hand-anchor-and-groove',
  'vid-06-left-hand-anchor-and-groove': 'vid-06-left-hand-anchor-and-groove',
  'vid-05-left-hand-bass-power': 'vid-06-left-hand-anchor-and-groove',
  'vid-07-four-chord-transitions': 'vid-06-left-hand-anchor-and-groove',
  'vid-07': 'vid-07-black-keys-and-accidentals',
  'vid-07-black-keys-and-accidentals': 'vid-07-black-keys-and-accidentals',
  'vid-08': 'vid-08-two-hand-independence',
  'vid-08-two-hand-independence': 'vid-08-two-hand-independence',
};

export function getVideoById(id: string): VideoLesson | undefined {
  const canonicalId = VIDEO_ID_ALIAS_MAP[id] ?? id;
  return VIDEO_LESSONS.find((v) => v.id === canonicalId);
}

export function getVideosForMistakes(categories: MistakeCategory[]): VideoLesson[] {
  if (!categories || categories.length === 0) {
    return [VIDEO_LESSONS[0]];
  }
  const categorySet = new Set(categories);
  const matched = VIDEO_LESSONS.filter((video) =>
    video.addressesMistakes.some((m) => categorySet.has(m))
  );
  return matched.length > 0 ? matched : [VIDEO_LESSONS[0]];
}
