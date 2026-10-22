import { describe, expect, it } from 'vitest';
import { estimatePitchYIN, estimatePolyphonicChords } from '../MicPitchDetector';
import { midiToFrequency } from '../../utils/midiUtils';
import { MidiInputAdapter } from '../MidiInputAdapter';
import { QwertyInputAdapter } from '../QwertyInputAdapter';
import type { NoteInputEvent } from '../../types';

/**
 * Generates a realistic synthetic acoustic piano waveform buffer with fundamental + 2nd, 3rd, and 4th harmonics.
 */
function createPianoToneBuffer(
  fundamentalHz: number,
  sampleRate = 44100,
  numSamples = 4096,
  amplitude = 0.25
): Float32Array {
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const f1 = Math.sin(2 * Math.PI * fundamentalHz * t);
    const f2 = 0.42 * Math.sin(2 * Math.PI * (fundamentalHz * 2) * t + 0.15);
    const f3 = 0.18 * Math.sin(2 * Math.PI * (fundamentalHz * 3) * t + 0.3);
    const f4 = 0.08 * Math.sin(2 * Math.PI * (fundamentalHz * 4) * t + 0.45);
    buffer[i] = amplitude * (f1 + f2 + f3 + f4);
  }
  return buffer;
}

describe('estimatePitchYIN (4-stage YIN / CMNDF Pitch Detector)', () => {
  const sampleRate = 44100;

  it('accurately detects Middle C (261.63 Hz -> MIDI 60) with harmonic overtones', () => {
    const buffer = createPianoToneBuffer(261.63, sampleRate);
    const result = estimatePitchYIN(buffer, sampleRate);

    expect(result).not.toBeNull();
    expect(result?.midi).toBe(60);
    expect(result?.frequencyHz).toBeCloseTo(261.63, 0);
    expect(Math.abs(result?.centsOff ?? 99)).toBeLessThanOrEqual(4);
    expect(result?.confidence).toBeGreaterThan(0.85);
  });

  it('accurately detects Concert A4 (440 Hz -> MIDI 69) without octave jumping to 880 Hz', () => {
    const buffer = createPianoToneBuffer(440.0, sampleRate);
    const result = estimatePitchYIN(buffer, sampleRate);

    expect(result).not.toBeNull();
    expect(result?.midi).toBe(69);
    expect(result?.frequencyHz).toBeCloseTo(440.0, 0);
    expect(Math.abs(result?.centsOff ?? 99)).toBeLessThanOrEqual(3);
    expect(result?.confidence).toBeGreaterThan(0.88);
  });

  it('accurately detects Bass G3 (196.00 Hz -> MIDI 55) with rich harmonics', () => {
    const buffer = createPianoToneBuffer(196.0, sampleRate);
    const result = estimatePitchYIN(buffer, sampleRate);

    expect(result).not.toBeNull();
    expect(result?.midi).toBe(55);
    expect(result?.frequencyHz).toBeCloseTo(196.0, 0);
    expect(Math.abs(result?.centsOff ?? 99)).toBeLessThanOrEqual(4);
    expect(result?.confidence).toBeGreaterThan(0.85);
  });

  it('rejects silent or sub-threshold ambient noise buffers via the RMS gate', () => {
    const quietBuffer = createPianoToneBuffer(261.63, sampleRate, 4096, 0.002);
    const result = estimatePitchYIN(quietBuffer, sampleRate, 0.012);
    expect(result).toBeNull();
  });

  it('rejects unpitched deterministic white noise buffers', () => {
    const noiseBuffer = new Float32Array(4096);
    // Deterministic LCG pseudo-random noise
    let seed = 1337;
    for (let i = 0; i < noiseBuffer.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      noiseBuffer[i] = ((seed / 0xffffffff) * 2 - 1) * 0.2;
    }

    const result = estimatePitchYIN(noiseBuffer, sampleRate);
    expect(result).toBeNull();
  });
});

describe('MidiInputAdapter & QwertyInputAdapter', () => {
  it('parses MIDI 0x90 Note On, 0x80 Note Off, and 0xB0 CC64 Sustain messages', () => {
    const events: NoteInputEvent[] = [];
    const pedalStates: boolean[] = [];

    const midi = new MidiInputAdapter(
      (ev) => events.push(ev),
      undefined,
      (active) => pedalStates.push(active)
    );

    // Note On C4 (60) velocity 100
    midi.handleRawMidiMessage([0x90, 60, 100]);
    // Note On with velocity 0 -> Note Off C4 (60)
    midi.handleRawMidiMessage([0x90, 60, 0]);
    // Sustain pedal down & up
    midi.handleRawMidiMessage([0xb0, 64, 127]);
    midi.handleRawMidiMessage([0xb0, 64, 0]);

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('note_on');
    expect(events[0].midi).toBe(60);
    expect(events[0].noteName).toBe('C4');
    expect(events[0].source).toBe('midi');
    expect(events[1].type).toBe('note_off');
    expect(events[1].midi).toBe(60);
    expect(pedalStates).toEqual([true, false]);
  });

  it('maps two-row and home-row QWERTY layouts while suppressing key repeats', () => {
    const events: NoteInputEvent[] = [];
    const qwerty = new QwertyInputAdapter((ev) => events.push(ev), 'two_row');

    expect(qwerty.resolveKeyToMidi('z')).toBe(48); // C3
    expect(qwerty.resolveKeyToMidi('q')).toBe(60); // C4
    expect(qwerty.resolveKeyToMidi(']')).toBe(79); // G5

    qwerty.setLayoutMode('home_row');
    expect(qwerty.resolveKeyToMidi('a')).toBe(60); // C4
    expect(qwerty.resolveKeyToMidi('k')).toBe(72); // C5

    // Simulate keydown + repeat keydown + keyup
    qwerty.handleKeyDown({
      key: 'a',
      repeat: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      target: null,
    } as unknown as KeyboardEvent);

    qwerty.handleKeyDown({
      key: 'a',
      repeat: true,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      target: null,
    } as unknown as KeyboardEvent);

    qwerty.handleKeyUp({
      key: 'a',
      repeat: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      target: null,
    } as unknown as KeyboardEvent);

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('note_on');
    expect(events[0].midi).toBe(60);
    expect(events[1].type).toBe('note_off');
    expect(events[1].midi).toBe(60);
  });
});

describe('estimatePolyphonicChords (Electric Piano Microphone Chord & Two-Hand Detection)', () => {
  const sampleRate = 44100;

  function createPolyphonicPianoChordBuffer(midis: number[], numSamples = 4096): Float32Array {
    const combined = new Float32Array(numSamples);
    for (const midi of midis) {
      const tone = createPianoToneBuffer(midiToFrequency(midi), sampleRate, numSamples, 0.18);
      for (let i = 0; i < numSamples; i++) {
        combined[i] += tone[i];
      }
    }
    return combined;
  }

  it('accurately detects all 3 notes of a C Major triad (C4 + E4 + G4 = [60, 64, 67])', () => {
    const buffer = createPolyphonicPianoChordBuffer([60, 64, 67]);
    const detected = estimatePolyphonicChords(buffer, sampleRate, [60, 64, 67]);
    const midis = detected.map((d) => d.midi);
    expect(midis).toEqual([60, 64, 67]);
  });

  it('accurately detects Two-Hand dyads (Bass C3 + Treble E4 = [48, 64]) without false octave overtone', () => {
    const buffer = createPolyphonicPianoChordBuffer([48, 64]);
    const detected = estimatePolyphonicChords(buffer, sampleRate, [48, 64]);
    const midis = detected.map((d) => d.midi);
    expect(midis).toContain(48);
    expect(midis).toContain(64);
    expect(midis).not.toContain(60); // 2nd harmonic of C3 (C4=60) suppressed by overtone cancellation
  });

  it('identifies a wrong note inside a played chord (C4 + F4 + G4 when C4 + E4 + G4 was expected)', () => {
    const buffer = createPolyphonicPianoChordBuffer([60, 65, 67]);
    const detected = estimatePolyphonicChords(buffer, sampleRate, [60, 64, 67]);
    const midis = detected.map((d) => d.midi);
    expect(midis).toEqual([60, 65, 67]);
  });

  it('detects quiet E-Piano notes (amplitude = 0.0045) with the new 0.0025 RMS threshold', () => {
    const quietNote = createPianoToneBuffer(midiToFrequency(64), sampleRate, 4096, 0.0045);
    const yinRes = estimatePitchYIN(quietNote, sampleRate);
    expect(yinRes).not.toBeNull();
    expect(yinRes?.midi).toBe(64);
  });
});
