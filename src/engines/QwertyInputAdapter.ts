import type { NoteInputEvent } from '../types';
import { midiToFrequency, midiToNoteName } from '../utils/midiUtils';

export type QwertyLayoutMode = 'two_row' | 'home_row';
export type QwertyNoteListener = (event: NoteInputEvent) => void;

/**
 * Standard 2-tier conservatory computer keyboard layout:
 * - Lower row (Z..M + S,D,G,H,J): C3 (48) – B3 (59)
 * - Upper row (Q..] + 2,3,5,6,7,9,0): C4 (60) – G5 (79)
 */
export const TWO_ROW_KEY_TO_MIDI: Readonly<Record<string, number>> = {
  // Lower Octave (C3 - B3)
  z: 48, // C3
  s: 49, // C#3
  x: 50, // D3
  d: 51, // D#3
  c: 52, // E3
  v: 53, // F3
  g: 54, // F#3
  b: 55, // G3
  h: 56, // G#3
  n: 57, // A3
  j: 58, // A#3
  m: 59, // B3
  ',': 60, // C4 alias

  // Middle & Upper Octave (C4 - G5)
  q: 60, // C4
  '2': 61, // C#4
  w: 62, // D4
  '3': 63, // D#4
  e: 64, // E4
  r: 65, // F4
  '5': 66, // F#4
  t: 67, // G4
  '6': 68, // G#4
  y: 69, // A4
  '7': 70, // A#4
  u: 71, // B4
  i: 72, // C5
  '9': 73, // C#5
  o: 74, // D5
  '0': 75, // D#5
  p: 76, // E5
  '[': 77, // F5
  '=': 78, // F#5
  ']': 79, // G5
};

/**
 * Single-octave home-row fallback layout (A,S,D,F,G,H,J,K,L for C4–D5 + W,E,T,Y,U,O,P sharps)
 */
export const HOME_ROW_KEY_TO_MIDI: Readonly<Record<string, number>> = {
  a: 60, // C4
  w: 61, // C#4
  s: 62, // D4
  e: 63, // D#4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4
  g: 67, // G4
  y: 68, // G#4
  h: 69, // A4
  u: 70, // A#4
  j: 71, // B4
  k: 72, // C5
  o: 73, // C#5
  l: 74, // D5
  p: 75, // D#5
  ';': 76, // E5
  "'": 77, // F5
  // Keep Z..M lower octave white keys available
  z: 48,
  x: 50,
  c: 52,
  v: 53,
  b: 55,
  n: 57,
  m: 59,
};

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  if ('tagName' in target && typeof target.tagName === 'string') {
    const tag = target.tagName.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return true;
    }
  }
  if ('isContentEditable' in target && target.isContentEditable === true) {
    return true;
  }
  return false;
}

export class QwertyInputAdapter {
  private layoutMode: QwertyLayoutMode = 'two_row';
  private enabled = false;
  private depressedKeys: Map<string, number> = new Map();
  private noteListeners: Set<QwertyNoteListener> = new Set();

  private readonly boundKeyDown: (event: KeyboardEvent) => void;
  private readonly boundKeyUp: (event: KeyboardEvent) => void;
  private readonly boundBlur: () => void;

  constructor(onNoteEvent?: QwertyNoteListener, initialLayout: QwertyLayoutMode = 'two_row') {
    this.layoutMode = initialLayout;
    if (onNoteEvent) {
      this.noteListeners.add(onNoteEvent);
    }
    this.boundKeyDown = (ev) => this.handleKeyDown(ev);
    this.boundKeyUp = (ev) => this.handleKeyUp(ev);
    this.boundBlur = () => this.releaseAll();
  }

  public onNoteEvent(listener: QwertyNoteListener): () => void {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  }

  public setLayoutMode(mode: QwertyLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.releaseAll();
    this.layoutMode = mode;
  }

  public getLayoutMode(): QwertyLayoutMode {
    return this.layoutMode;
  }

  public start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    this.enabled = true;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
  }

  public stop(): void {
    if (!this.enabled || typeof window === 'undefined') return;
    this.enabled = false;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);
    this.releaseAll();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public resolveKeyToMidi(key: string): number | null {
    const normalized = key.toLowerCase();
    const map = this.layoutMode === 'home_row' ? HOME_ROW_KEY_TO_MIDI : TWO_ROW_KEY_TO_MIDI;
    const midi = map[normalized];
    return typeof midi === 'number' ? midi : null;
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableElement(event.target)) return;

    const key = event.key.toLowerCase();
    if (this.depressedKeys.has(key)) return;

    const midi = this.resolveKeyToMidi(key);
    if (midi === null) return;

    this.depressedKeys.set(key, midi);
    const inputEvent: NoteInputEvent = {
      type: 'note_on',
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      velocity: 0.78,
      source: 'qwerty',
      timestampMs: performance.now(),
    };
    this.emit(inputEvent);
  }

  public handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const midi = this.depressedKeys.get(key);
    if (midi === undefined) return;

    this.depressedKeys.delete(key);
    const inputEvent: NoteInputEvent = {
      type: 'note_off',
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      velocity: 0,
      source: 'qwerty',
      timestampMs: performance.now(),
    };
    this.emit(inputEvent);
  }

  public releaseAll(): void {
    for (const [key, midi] of this.depressedKeys.entries()) {
      this.depressedKeys.delete(key);
      this.emit({
        type: 'note_off',
        midi,
        noteName: midiToNoteName(midi),
        frequencyHz: midiToFrequency(midi),
        velocity: 0,
        source: 'qwerty',
        timestampMs: performance.now(),
      });
    }
  }

  private emit(event: NoteInputEvent): void {
    for (const listener of this.noteListeners) {
      listener(event);
    }
  }
}
