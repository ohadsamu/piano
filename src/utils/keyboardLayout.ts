import { isBlackKey, midiToNoteName, midiToSolfege } from './midiUtils';

export const KEYBOARD_MIN_MIDI = 48; // C3
export const KEYBOARD_MAX_MIDI = 83; // B5
export const TOTAL_WHITE_KEYS = 21;  // 3 octaves * 7 white keys

export interface KeyGeometry {
  midi: number;
  noteName: string;
  solfege: string;
  octave: number;
  pitchClass: number;
  isBlack: boolean;
  /** Percentage [0 - 100] from left edge of the 3-octave keyboard */
  leftPct: number;
  /** Percentage [0 - 100] width of key */
  widthPct: number;
  /** Percentage [0 - 100] horizontal center of key */
  centerPct: number;
  /** Index among white keys [0 - 20], or -1 for black keys */
  whiteKeyIndex: number;
  /** Optional QWERTY computer keyboard shortcut label */
  qwertyLabel?: string;
}

export const MIDI_TO_QWERTY_LABEL: Record<number, string> = {
  // Lower Octave (C3 - B3)
  48: 'Z',
  49: 'S',
  50: 'X',
  51: 'D',
  52: 'C',
  53: 'V',
  54: 'G',
  55: 'B',
  56: 'H',
  57: 'N',
  58: 'J',
  59: 'M',
  // Middle Octave (C4 - B4)
  60: 'Q',
  61: '2',
  62: 'W',
  63: '3',
  64: 'E',
  65: 'R',
  66: '5',
  67: 'T',
  68: '6',
  69: 'Y',
  70: '7',
  71: 'U',
  // Upper Octave (C5 - G5)
  72: 'I',
  73: '9',
  74: 'O',
  75: '0',
  76: 'P',
  77: '[',
  79: ']',
};

/**
 * Fine acoustic offset of each black key relative to the boundary between its left and right white keys
 */
const BLACK_KEY_BOUNDARY_SHIFT: Record<number, number> = {
  1: -0.06, // C# sits slightly left
  3: +0.06, // D# sits slightly right
  6: -0.07, // F# sits slightly left
  8: 0.0,   // G# centered
  10: +0.07,// A# sits slightly right
};

const KEY_GEOMETRY_CACHE: Map<number, KeyGeometry> = new Map();
const ALL_KEYS_LIST: KeyGeometry[] = [];

function buildKeyboardGeometry(): void {
  if (ALL_KEYS_LIST.length > 0) return;

  const whiteWidthPct = 100 / TOTAL_WHITE_KEYS;
  const blackWidthPct = whiteWidthPct * 0.62;

  let currentWhiteIdx = 0;
  const midiToLeftWhiteIdx: Record<number, number> = {};

  for (let midi = KEYBOARD_MIN_MIDI; midi <= KEYBOARD_MAX_MIDI; midi++) {
    if (!isBlackKey(midi)) {
      midiToLeftWhiteIdx[midi] = currentWhiteIdx;
      currentWhiteIdx++;
    } else {
      midiToLeftWhiteIdx[midi] = currentWhiteIdx - 1;
    }
  }

  for (let midi = KEYBOARD_MIN_MIDI; midi <= KEYBOARD_MAX_MIDI; midi++) {
    const black = isBlackKey(midi);
    const pitchClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const whiteIdx = midiToLeftWhiteIdx[midi];

    let leftPct: number;
    let widthPct: number;

    if (!black) {
      leftPct = whiteIdx * whiteWidthPct;
      widthPct = whiteWidthPct;
    } else {
      const boundaryPct = (whiteIdx + 1) * whiteWidthPct;
      const shiftPct = (BLACK_KEY_BOUNDARY_SHIFT[pitchClass] ?? 0) * whiteWidthPct;
      leftPct = boundaryPct - blackWidthPct / 2 + shiftPct;
      widthPct = blackWidthPct;
    }

    const geom: KeyGeometry = {
      midi,
      noteName: midiToNoteName(midi),
      solfege: midiToSolfege(midi),
      octave,
      pitchClass,
      isBlack: black,
      leftPct,
      widthPct,
      centerPct: leftPct + widthPct / 2,
      whiteKeyIndex: black ? -1 : whiteIdx,
      qwertyLabel: MIDI_TO_QWERTY_LABEL[midi],
    };

    KEY_GEOMETRY_CACHE.set(midi, geom);
    ALL_KEYS_LIST.push(geom);
  }
}

buildKeyboardGeometry();

export function getKeyGeometry(midi: number): KeyGeometry {
  const clamped = Math.max(KEYBOARD_MIN_MIDI, Math.min(KEYBOARD_MAX_MIDI, midi));
  return KEY_GEOMETRY_CACHE.get(clamped)!;
}

export function getAllKeyboardKeys(): KeyGeometry[] {
  return ALL_KEYS_LIST;
}

export function getWhiteKeyboardKeys(): KeyGeometry[] {
  return ALL_KEYS_LIST.filter((k) => !k.isBlack);
}

export function getBlackKeyboardKeys(): KeyGeometry[] {
  return ALL_KEYS_LIST.filter((k) => k.isBlack);
}
