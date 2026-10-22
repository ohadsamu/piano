import { describe, expect, it } from 'vitest';
import {
  buildDirectionalCorrectionCopy,
  countWhiteKeyDelta,
  frequencyToMidiAndCents,
  isBlackKey,
  midiToDiatonicStepFromMiddleC,
  midiToFrequency,
  midiToNoteName,
  noteNameToMidi,
} from '../midiUtils';
import { getAllKeyboardKeys, getKeyGeometry } from '../keyboardLayout';

describe('midiUtils & keyboardLayout', () => {
  it('converts MIDI to frequency and back accurately', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 2);
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);

    const { midi, centsOff } = frequencyToMidiAndCents(261.63);
    expect(midi).toBe(60);
    expect(Math.abs(centsOff)).toBeLessThanOrEqual(2);
  });

  it('maps MIDI to note names and diatonic steps relative to Middle C', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(61)).toBe('C#4');
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('F#4')).toBe(66);

    expect(midiToDiatonicStepFromMiddleC(60)).toBe(0);  // C4
    expect(midiToDiatonicStepFromMiddleC(62)).toBe(1);  // D4
    expect(midiToDiatonicStepFromMiddleC(64)).toBe(2);  // E4 (bottom treble line)
    expect(midiToDiatonicStepFromMiddleC(59)).toBe(-1); // B3
    expect(midiToDiatonicStepFromMiddleC(57)).toBe(-2); // A3 (top bass line)
  });

  it('computes directional correction copy for wrong notes', () => {
    // User played F4 (65) when E4 (64) was expected
    const feedback = buildDirectionalCorrectionCopy(64, 65, 'right', 3);
    expect(feedback.direction).toBe('left');
    expect(feedback.semitoneDelta).toBe(1);
    expect(feedback.whiteKeyDelta).toBe(-1);
    expect(feedback.headline).toContain('F4');
    expect(feedback.actionInstruction).toContain('LEFT to E4');
    expect(feedback.actionInstruction).toContain('Middle (3)');
  });

  it('builds 36 keys (21 white, 15 black) across C3 to B5 with sub-pixel geometry', () => {
    const allKeys = getAllKeyboardKeys();
    expect(allKeys).toHaveLength(36);
    expect(allKeys.filter((k) => !k.isBlack)).toHaveLength(21);
    expect(allKeys.filter((k) => k.isBlack)).toHaveLength(15);

    const middleC = getKeyGeometry(60);
    expect(middleC.noteName).toBe('C4');
    expect(middleC.isBlack).toBe(false);
    expect(middleC.whiteKeyIndex).toBe(7);
    expect(isBlackKey(61)).toBe(true);
  });
});
