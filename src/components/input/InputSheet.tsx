import React, { useState } from 'react';
import type { LiveMicTelemetry, MicCalibrationConfig, MidiDeviceInfo } from '../../types';
import type { PreferredInput } from '../../utils/storage';
import type { MicStatus } from '../../hooks/useNoteInputs';
import { Sheet } from '../shell/Sheet';
import { COPY } from '../copy';
import { BTN_SECONDARY } from '../practice/PromptCard';

export interface InputSheetProps {
  open: boolean;
  preferredInput?: PreferredInput;
  micTelemetry: LiveMicTelemetry;
  micStatus: MicStatus;
  micConfig: MicCalibrationConfig;
  midiDevices: MidiDeviceInfo[];
  midiSupported: boolean;
  onClose(): void;
  onChoose(p: PreferredInput): void;
  onToggleMic(): void;
  onCalibrate(): Promise<number>;
  onUpdateMicConfig(cfg: Partial<MicCalibrationConfig>): void;
  onRetryMidi(): void;
  onTestNote(): void;
}

// loadUserProfile resets thresholds outside (0.0035, 0.011), so keep the slider inside it.
const GATE_MIN = 0.004;
const GATE_MAX = 0.0105;

const Option: React.FC<{
  value: PreferredInput;
  current?: PreferredInput;
  label: string;
  onChoose(p: PreferredInput): void;
  children?: React.ReactNode;
}> = ({ value, current, label, onChoose, children }) => (
  <div className="py-3">
    <label className="min-h-11 flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="preferred-input"
        value={value}
        checked={current === value}
        onChange={() => onChoose(value)}
        className="w-5 h-5 accent-brass"
      />
      <span className="text-base text-ink-primary">{label}</span>
    </label>
    {children && <div className="pl-8 pt-1 flex flex-col gap-2">{children}</div>}
  </div>
);

export const InputSheet: React.FC<InputSheetProps> = ({
  open,
  preferredInput,
  micTelemetry,
  micStatus,
  micConfig,
  midiDevices,
  midiSupported,
  onClose,
  onChoose,
  onToggleMic,
  onCalibrate,
  onUpdateMicConfig,
  onRetryMidi,
  onTestNote,
}) => {
  const [calibrating, setCalibrating] = useState(false);
  const [floor, setFloor] = useState<number | null>(null);
  const connected = midiDevices.filter((d) => d.connected);
  const level = Math.min(1, micTelemetry.rmsLevel * 12);

  const calibrate = async () => {
    setCalibrating(true);
    try {
      setFloor(await onCalibrate());
    } finally {
      setCalibrating(false);
    }
  };

  return (
    <Sheet open={open} title={COPY.howYouPlay} onClose={onClose}>
      <p className="text-base text-ink-secondary pb-2">
        Every way of playing works at once. This only changes the hint shown above the keyboard.
      </p>
      <fieldset className="divide-y divide-ink-primary/10">
        <legend className="sr-only">{COPY.howYouPlay}</legend>
        <Option value="touch" current={preferredInput ?? 'touch'} label="Tap the keys on screen" onChoose={onChoose} />
        <Option value="qwerty" current={preferredInput} label="Computer keyboard" onChoose={onChoose}>
          <p className="text-xs-13 text-ink-secondary tabular-nums">
            Q W E R T Y U = C D E F G A B (middle octave). Z X C V B N M plays the octave below.
          </p>
        </Option>
        <Option value="midi" current={preferredInput} label="MIDI keyboard" onChoose={onChoose}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs-13 text-ink-secondary">
              {!midiSupported
                ? 'This browser has no MIDI support.'
                : connected.length > 0
                ? `Connected: ${connected.map((d) => d.name).join(', ')}`
                : 'None found'}
            </span>
            {midiSupported && (
              <button type="button" className={BTN_SECONDARY} onClick={onRetryMidi}>
                Retry
              </button>
            )}
          </div>
        </Option>
        <Option value="mic" current={preferredInput} label="Microphone (real piano)" onChoose={onChoose}>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={BTN_SECONDARY} onClick={onToggleMic} aria-pressed={micTelemetry.active}>
              {micTelemetry.active ? COPY.turnOffMic : COPY.turnOnMic}
            </button>
            <button type="button" className={BTN_SECONDARY} onClick={onTestNote}>
              Play a test note
            </button>
          </div>
          {micStatus === 'blocked' && !micTelemetry.active && (
            <p className="text-base text-state-wrong" role="alert">
              {COPY.micBlocked}
            </p>
          )}
          {micTelemetry.active && (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-2 rounded-full bg-ebony-iron overflow-hidden"
                  role="meter"
                  aria-label="Microphone level"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(level * 100)}
                >
                  <div className="h-full bg-state-ok" style={{ width: `${level * 100}%` }} />
                </div>
                <span className="text-base text-ink-primary tabular-nums w-24 text-right">
                  {micTelemetry.detectedNoteName ? `heard: ${micTelemetry.detectedNoteName}` : 'quiet'}
                </span>
              </div>
              <details className="group">
                <summary className="min-h-11 flex items-center cursor-pointer text-base text-ink-secondary">
                  Microphone fine-tuning
                </summary>
                <div className="flex flex-col gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={BTN_SECONDARY} onClick={calibrate} disabled={calibrating}>
                      {calibrating ? 'Listening to the room…' : `${COPY.tuneRoom} (1s)`}
                    </button>
                    {floor !== null && (
                      <span className="text-xs-13 text-ink-secondary tabular-nums">Noise floor: {floor.toFixed(4)}</span>
                    )}
                  </div>
                  <label className="flex flex-col gap-1 text-xs-13 text-ink-secondary">
                    Sensitivity (lower hears softer notes): {micConfig.rmsThreshold.toFixed(4)}
                    <input
                      type="range"
                      min={GATE_MIN}
                      max={GATE_MAX}
                      step={0.0005}
                      value={Math.min(GATE_MAX, Math.max(GATE_MIN, micConfig.rmsThreshold))}
                      onChange={(e) => onUpdateMicConfig({ rmsThreshold: parseFloat(e.target.value) })}
                      className="w-full h-11 accent-brass"
                    />
                  </label>
                </div>
              </details>
            </>
          )}
        </Option>
      </fieldset>
    </Sheet>
  );
};

export default InputSheet;
