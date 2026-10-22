import type {
  LiveMicTelemetry,
  MicCalibrationConfig,
  MidiDeviceInfo,
  NoteInputEvent,
} from '../types';
import { midiToFrequency, midiToNoteName } from '../utils/midiUtils';
import { AudioEngine, sharedAudioEngine } from './AudioEngine';
import { MicPitchDetector } from './MicPitchDetector';
import { MidiInputAdapter } from './MidiInputAdapter';
import { QwertyInputAdapter, type QwertyLayoutMode } from './QwertyInputAdapter';

export type UnifiedNoteListener = (event: NoteInputEvent) => void;
export type MicTelemetrySubscriber = (telemetry: LiveMicTelemetry) => void;
export type MidiDevicesSubscriber = (devices: MidiDeviceInfo[]) => void;

/**
 * Multiplexes Microphone (YIN pitch detector), Web MIDI controllers,
 * Computer QWERTY keyboard, and on-screen Virtual Piano touch/pointer inputs
 * into a unified stream of NoteInputEvents, while coordinating local synthesis.
 */
export class InputManager {
  private readonly audioEngine: AudioEngine;
  private readonly micDetector: MicPitchDetector;
  private readonly midiAdapter: MidiInputAdapter;
  private readonly qwertyAdapter: QwertyInputAdapter;

  private noteListeners: Set<UnifiedNoteListener> = new Set();
  private micTelemetryListeners: Set<MicTelemetrySubscriber> = new Set();
  private midiDeviceListeners: Set<MidiDevicesSubscriber> = new Set();

  private activeVirtualMidis: Set<number> = new Set();
  /** When false (default), acoustic microphone notes do not double-trigger the internal piano synth */
  private micSynthMonitor = false;
  private localSynthEnabled = true;

  constructor(
    audioEngine: AudioEngine = sharedAudioEngine,
    initialCalibration?: Partial<MicCalibrationConfig>
  ) {
    this.audioEngine = audioEngine;

    this.micDetector = new MicPitchDetector(
      initialCalibration,
      (event) => this.handleIncomingNoteEvent(event),
      (telemetry) => this.notifyMicTelemetry(telemetry)
    );

    this.midiAdapter = new MidiInputAdapter(
      (event) => this.handleIncomingNoteEvent(event),
      (devices) => this.notifyMidiDevices(devices),
      (pedalActive) => this.audioEngine.setSustainPedal(pedalActive)
    );

    this.qwertyAdapter = new QwertyInputAdapter((event) =>
      this.handleIncomingNoteEvent(event)
    );
  }

  private handleIncomingNoteEvent(event: NoteInputEvent): void {
    const shouldPlaySynth =
      this.localSynthEnabled &&
      (event.source !== 'microphone' || this.micSynthMonitor);

    if (shouldPlaySynth) {
      if (event.type === 'note_on') {
        this.audioEngine.noteOn(event.midi, event.velocity);
      } else {
        this.audioEngine.noteOff(event.midi);
      }
    }

    for (const listener of this.noteListeners) {
      listener(event);
    }
  }

  private notifyMicTelemetry(telemetry: LiveMicTelemetry): void {
    for (const listener of this.micTelemetryListeners) {
      listener(telemetry);
    }
  }

  private notifyMidiDevices(devices: MidiDeviceInfo[]): void {
    for (const listener of this.midiDeviceListeners) {
      listener(devices);
    }
  }

  public onNoteEvent(listener: UnifiedNoteListener): () => void {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  }

  public onMicTelemetry(listener: MicTelemetrySubscriber): () => void {
    this.micTelemetryListeners.add(listener);
    listener(this.micDetector.getTelemetry());
    return () => {
      this.micTelemetryListeners.delete(listener);
    };
  }

  public onMidiDevicesChanged(listener: MidiDevicesSubscriber): () => void {
    this.midiDeviceListeners.add(listener);
    listener(this.midiAdapter.getDevices());
    return () => {
      this.midiDeviceListeners.delete(listener);
    };
  }

  /**
   * Triggers a virtual piano key press (mouse / touch / pen).
   */
  public triggerVirtualNoteOn(midi: number, velocity = 0.82): void {
    if (this.activeVirtualMidis.has(midi)) {
      this.triggerVirtualNoteOff(midi);
    }
    this.activeVirtualMidis.add(midi);

    const event: NoteInputEvent = {
      type: 'note_on',
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      velocity: Math.max(0.05, Math.min(1.0, velocity)),
      source: 'virtual',
      timestampMs: performance.now(),
    };
    this.handleIncomingNoteEvent(event);
  }

  /**
   * Releases a virtual piano key press.
   */
  public triggerVirtualNoteOff(midi: number): void {
    if (!this.activeVirtualMidis.has(midi)) return;
    this.activeVirtualMidis.delete(midi);

    const event: NoteInputEvent = {
      type: 'note_off',
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      velocity: 0,
      source: 'virtual',
      timestampMs: performance.now(),
    };
    this.handleIncomingNoteEvent(event);
  }

  /**
   * Starts QWERTY listening and initializes Web MIDI if supported.
   */
  public async startDefaultInputs(): Promise<void> {
    this.qwertyAdapter.start();
    if (this.midiAdapter.isSupported()) {
      await this.midiAdapter.init();
    }
  }

  // Microphone Controls
  public async enableMicrophone(): Promise<boolean> {
    await this.audioEngine.init();
    const ctx = this.audioEngine.getAudioContext() ?? undefined;
    return this.micDetector.start(ctx);
  }

  public async startMicrophone(): Promise<boolean> {
    return this.enableMicrophone();
  }

  public disableMicrophone(): void {
    this.micDetector.stop();
  }

  public stopMicrophone(): void {
    this.micDetector.stop();
  }

  public isMicrophoneActive(): boolean {
    return this.micDetector.isActive();
  }

  public async calibrateMicrophone(durationMs = 900): Promise<number> {
    return this.micDetector.calibrateNoiseFloor(durationMs);
  }

  public updateMicCalibration(cfg: Partial<MicCalibrationConfig>): void {
    this.micDetector.updateConfig(cfg);
  }

  public getMicCalibration(): MicCalibrationConfig {
    return this.micDetector.getConfig();
  }

  public getMicTelemetry(): LiveMicTelemetry {
    return this.micDetector.getTelemetry();
  }

  public setMicSynthMonitor(enabled: boolean): void {
    this.micSynthMonitor = enabled;
  }

  public isMicSynthMonitorEnabled(): boolean {
    return this.micSynthMonitor;
  }

  public setLocalSynthEnabled(enabled: boolean): void {
    this.localSynthEnabled = enabled;
  }

  public isLocalSynthEnabled(): boolean {
    return this.localSynthEnabled;
  }

  // MIDI Controls
  public async initMidi(): Promise<MidiDeviceInfo[]> {
    return this.midiAdapter.init();
  }

  public async connectMidi(): Promise<boolean> {
    return this.midiAdapter.connect();
  }

  public disconnectMidi(): void {
    this.midiAdapter.disconnect();
  }

  public getMidiDevices(): MidiDeviceInfo[] {
    return this.midiAdapter.getDevices();
  }

  public isMidiSupported(): boolean {
    return this.midiAdapter.isSupported();
  }

  // QWERTY Controls
  public enableQwerty(): void {
    this.qwertyAdapter.start();
  }

  public disableQwerty(): void {
    this.qwertyAdapter.stop();
  }

  public isQwertyEnabled(): boolean {
    return this.qwertyAdapter.isEnabled();
  }

  public setQwertyLayout(mode: QwertyLayoutMode): void {
    this.qwertyAdapter.setLayoutMode(mode);
  }

  public getQwertyLayout(): QwertyLayoutMode {
    return this.qwertyAdapter.getLayoutMode();
  }

  // Direct adapter accessors
  public getMicDetector(): MicPitchDetector {
    return this.micDetector;
  }

  public getMidiAdapter(): MidiInputAdapter {
    return this.midiAdapter;
  }

  public getQwertyAdapter(): QwertyInputAdapter {
    return this.qwertyAdapter;
  }

  public getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }

  public stopAll(): void {
    for (const midi of Array.from(this.activeVirtualMidis)) {
      this.triggerVirtualNoteOff(midi);
    }
    this.qwertyAdapter.releaseAll();
    this.audioEngine.stopAll();
  }

  public dispose(): void {
    this.stopAll();
    this.micDetector.stop();
    this.midiAdapter.disconnect();
    this.qwertyAdapter.stop();
  }
}

export const sharedInputManager = new InputManager(sharedAudioEngine);
