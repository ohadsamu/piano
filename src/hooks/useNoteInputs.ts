import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LiveMicTelemetry,
  MicCalibrationConfig,
  MidiDeviceInfo,
  NoteInputEvent,
  PracticeSessionSnapshot,
} from '../types';
import type { PracticeEngine } from '../engines/PracticeEngine';
import { sharedAudioEngine } from '../engines/AudioEngine';
import { sharedInputManager } from '../engines/InputManager';
import { createMicAutoStart } from '../utils/micAutoStart';
import type { PreferredInput } from '../utils/storage';

/** Untimed steps start on the first key press (spec §4.3 rule 3). */
export function isUntimedAwaitingStart(snap: PracticeSessionSnapshot): boolean {
  if (snap.isCompleted) return false;
  if (snap.isPlaying && !snap.isPaused) return false;
  return snap.mode === 'key_discovery' || snap.mode === 'wait_mode';
}

export type MicStatus = 'off' | 'on' | 'blocked';

export interface NoteInputsOptions {
  initialMicCalibration?: MicCalibrationConfig;
  /**
   * Return true when a note_on should start the session first (untimed step waiting for its
   * first note). Defaults to never, i.e. legacy behaviour.
   */
  shouldAutoStart?: (snap: PracticeSessionSnapshot) => boolean;
  /** When 'mic', the microphone is kept listening automatically. */
  preferredInput?: PreferredInput;
}

export function useNoteInputs(engine: PracticeEngine, opts: NoteInputsOptions = {}) {
  const [micTelemetry, setMicTelemetry] = useState<LiveMicTelemetry>(() =>
    sharedInputManager.getMicTelemetry()
  );
  const [midiDevices, setMidiDevices] = useState<MidiDeviceInfo[]>([]);
  const [heldMidis, setHeldMidis] = useState<number[]>([]);
  const [lastNote, setLastNote] = useState<NoteInputEvent | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatus>('off');

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const micAuto = useRef<ReturnType<typeof createMicAutoStart> | null>(null);
  useEffect(() => {
    const ctl = createMicAutoStart({
      input: sharedInputManager,
      audio: sharedAudioEngine,
      target: window,
      onResult: (ok) => setMicStatus(ok ? 'on' : 'blocked'),
    });
    micAuto.current = ctl;
    return () => {
      ctl.dispose();
      micAuto.current = null;
    };
  }, []);
  useEffect(() => {
    const p = opts.preferredInput;
    if (!p) return;
    micAuto.current?.setPreferred(p);
    if (p !== 'mic') setMicStatus('off');
  }, [opts.preferredInput]);

  useEffect(() => {
    void sharedInputManager.startDefaultInputs();
    if (optsRef.current.initialMicCalibration) {
      sharedInputManager.updateMicCalibration(optsRef.current.initialMicCalibration);
    }

    const unsubNote = sharedInputManager.onNoteEvent((event) => {
      setLastNote(event);
      setHeldMidis((prev) => {
        if (event.type === 'note_on') {
          return prev.includes(event.midi) ? prev : [...prev, event.midi];
        }
        return prev.filter((m) => m !== event.midi);
      });
      if (
        event.type === 'note_on' &&
        optsRef.current.shouldAutoStart?.(engine.getSnapshot())
      ) {
        // Synchronous on purpose: awaiting init() first would lose this note.
        void sharedAudioEngine.init();
        engine.resume();
      }
      engine.handleNoteInput(event);
    });
    const unsubMic = sharedInputManager.onMicTelemetry(setMicTelemetry);
    const unsubMidi = sharedInputManager.onMidiDevicesChanged(setMidiDevices);
    return () => {
      unsubNote();
      unsubMic();
      unsubMidi();
    };
  }, [engine]);

  const pressKey = useCallback((midi: number, velocity?: number) => {
    void sharedAudioEngine.init();
    sharedInputManager.triggerVirtualNoteOn(midi, velocity);
  }, []);

  const releaseKey = useCallback((midi: number) => {
    sharedInputManager.triggerVirtualNoteOff(midi);
  }, []);

  const toggleMic = useCallback(async () => {
    if (sharedInputManager.isMicrophoneActive()) {
      sharedInputManager.disableMicrophone();
      micAuto.current?.userStopped();
      setMicStatus('off');
      return;
    }
    micAuto.current?.userStarted();
    let ok = false;
    try {
      ok = await sharedInputManager.enableMicrophone();
    } catch {
      ok = false;
    }
    setMicStatus(ok && sharedInputManager.isMicrophoneActive() ? 'on' : 'blocked');
  }, []);

  return { micTelemetry, midiDevices, heldMidis, lastNote, micStatus, pressKey, releaseKey, toggleMic };
}

export type NoteInputsApi = ReturnType<typeof useNoteInputs>;
