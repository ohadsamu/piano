import type { MidiDeviceInfo, NoteInputEvent } from '../types';
import { midiToFrequency, midiToNoteName } from '../utils/midiUtils';

export type MidiNoteListener = (event: NoteInputEvent) => void;
export type MidiDevicesListener = (devices: MidiDeviceInfo[]) => void;
export type MidiSustainListener = (active: boolean) => void;

export class MidiInputAdapter {
  private midiAccess: MIDIAccess | null = null;
  private devices: MidiDeviceInfo[] = [];
  private noteListeners: Set<MidiNoteListener> = new Set();
  private deviceListeners: Set<MidiDevicesListener> = new Set();
  private sustainListeners: Set<MidiSustainListener> = new Set();
  private boundInputs: Map<string, MIDIInput> = new Map();

  constructor(
    onNoteEvent?: MidiNoteListener,
    onDevicesChanged?: MidiDevicesListener,
    onSustainPedal?: MidiSustainListener
  ) {
    if (onNoteEvent) {
      this.noteListeners.add(onNoteEvent);
    }
    if (onDevicesChanged) {
      this.deviceListeners.add(onDevicesChanged);
    }
    if (onSustainPedal) {
      this.sustainListeners.add(onSustainPedal);
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
  }

  public onNoteEvent(listener: MidiNoteListener): () => void {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  }

  public onDevicesChanged(listener: MidiDevicesListener): () => void {
    this.deviceListeners.add(listener);
    return () => {
      this.deviceListeners.delete(listener);
    };
  }

  public onSustainPedal(listener: MidiSustainListener): () => void {
    this.sustainListeners.add(listener);
    return () => {
      this.sustainListeners.delete(listener);
    };
  }

  public getDevices(): MidiDeviceInfo[] {
    return [...this.devices];
  }

  /**
   * Requests Web MIDI API access and subscribes to all connected MIDI input ports.
   */
  public async init(): Promise<MidiDeviceInfo[]> {
    if (!this.isSupported()) {
      this.devices = [];
      this.notifyDeviceListeners();
      return [];
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.midiAccess.onstatechange = () => {
        this.refreshInputs();
      };
      this.refreshInputs();
      return this.getDevices();
    } catch {
      this.devices = [];
      this.notifyDeviceListeners();
      return [];
    }
  }

  public async connect(): Promise<boolean> {
    const list = await this.init();
    return this.midiAccess !== null || list.length > 0;
  }

  public disconnect(): void {
    for (const input of this.boundInputs.values()) {
      input.onmidimessage = null;
    }
    this.boundInputs.clear();
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.devices = [];
    this.notifyDeviceListeners();
  }

  private refreshInputs(): void {
    if (!this.midiAccess) return;

    // Clean up disconnected inputs
    for (const input of this.boundInputs.values()) {
      input.onmidimessage = null;
    }
    this.boundInputs.clear();

    const nextDevices: MidiDeviceInfo[] = [];
    for (const input of this.midiAccess.inputs.values()) {
      const connected = input.state === 'connected';
      nextDevices.push({
        id: input.id,
        name: input.name || 'MIDI Keyboard',
        manufacturer: input.manufacturer || 'Generic MIDI',
        connected,
      });

      if (connected) {
        input.onmidimessage = (ev: MIDIMessageEvent) => {
          if (ev.data) {
            this.handleRawMidiMessage(ev.data);
          }
        };
        this.boundInputs.set(input.id, input);
      }
    }

    this.devices = nextDevices;
    this.notifyDeviceListeners();
  }

  /**
   * Parses raw MIDI status & data bytes (`0x90` Note On, `0x80` Note Off, `0xB0` CC64 Sustain).
   */
  public handleRawMidiMessage(data: Uint8Array | number[]): void {
    if (!data || data.length < 2) return;

    const status = data[0] & 0xf0;
    const data1 = data[1] & 0x7f;
    const data2 = data.length > 2 ? data[2] & 0x7f : 0;

    // Note On (0x90) with velocity > 0
    if (status === 0x90 && data2 > 0) {
      const midi = data1;
      const velocity = Math.max(0.05, Math.min(1.0, data2 / 127));
      const event: NoteInputEvent = {
        type: 'note_on',
        midi,
        noteName: midiToNoteName(midi),
        frequencyHz: midiToFrequency(midi),
        velocity,
        source: 'midi',
        timestampMs: performance.now(),
      };
      this.notifyNoteListeners(event);
      return;
    }

    // Note Off (0x80) or Note On with velocity 0
    if (status === 0x80 || (status === 0x90 && data2 === 0)) {
      const midi = data1;
      const event: NoteInputEvent = {
        type: 'note_off',
        midi,
        noteName: midiToNoteName(midi),
        frequencyHz: midiToFrequency(midi),
        velocity: 0,
        source: 'midi',
        timestampMs: performance.now(),
      };
      this.notifyNoteListeners(event);
      return;
    }

    // Control Change (0xB0) — Damper Sustain Pedal (CC 64)
    if (status === 0xb0 && data1 === 64) {
      const active = data2 >= 64;
      for (const listener of this.sustainListeners) {
        listener(active);
      }
    }
  }

  private notifyNoteListeners(event: NoteInputEvent): void {
    for (const listener of this.noteListeners) {
      listener(event);
    }
  }

  private notifyDeviceListeners(): void {
    const snapshot = this.getDevices();
    for (const listener of this.deviceListeners) {
      listener(snapshot);
    }
  }
}
