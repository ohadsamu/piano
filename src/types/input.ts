export type InputSource = 'microphone' | 'midi' | 'virtual' | 'qwerty';

export interface NoteInputEvent {
  type: 'note_on' | 'note_off';
  midi: number;
  noteName: string;
  frequencyHz: number;
  /** Normalized velocity [0.05 - 1.0] */
  velocity: number;
  source: InputSource;
  timestampMs: number;
  /** For microphone detection: pitch offset in cents [-50, +50] */
  centsOff?: number;
  /** For microphone detection: YIN confidence [0.0 - 1.0] */
  confidence?: number;
}

export interface MicCalibrationConfig {
  /** RMS noise floor threshold (default 0.012) */
  rmsThreshold: number;
  /** YIN threshold (default 0.16) */
  yinThreshold: number;
  /** Minimum consecutive frames required to confirm a note (default 2) */
  stabilityFrames: number;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  connected: boolean;
}

export interface LiveMicTelemetry {
  active: boolean;
  rmsLevel: number;
  dbLevel: number;
  detectedMidi: number | null;
  detectedNoteName: string | null;
  frequencyHz: number | null;
  centsOff: number;
  confidence: number;
}
