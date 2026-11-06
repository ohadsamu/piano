import React from 'react';
import { Keyboard, Mic, Piano, Hand } from 'lucide-react';
import type { LiveMicTelemetry, MidiDeviceInfo } from '../../types';
import type { PreferredInput } from '../../utils/storage';

export interface InputStatusChipProps {
  preferredInput?: PreferredInput;
  midiDevices: MidiDeviceInfo[];
  micTelemetry: LiveMicTelemetry;
  onOpen(): void;
}

export function inputStatusLabel(
  preferred: PreferredInput | undefined,
  midiDevices: MidiDeviceInfo[],
  mic: LiveMicTelemetry
): { label: string; kind: 'midi' | 'mic' | 'qwerty' | 'touch' } {
  const midi = midiDevices.find((d) => d.connected);
  if (midi) return { label: `MIDI: ${midi.name}`, kind: 'midi' };
  if (mic.active) {
    return { label: mic.detectedNoteName ? `Mic: hearing ${mic.detectedNoteName}` : 'Mic: listening', kind: 'mic' };
  }
  if (preferred === 'qwerty') return { label: 'Computer keys', kind: 'qwerty' };
  if (preferred === 'mic') return { label: 'Mic: off', kind: 'mic' };
  if (preferred === 'midi') return { label: 'MIDI: none found', kind: 'midi' };
  return { label: 'Tap keys', kind: 'touch' };
}

const ICONS = { midi: Piano, mic: Mic, qwerty: Keyboard, touch: Hand };

/** Shows how the app hears you; tapping opens "How you play". */
export const InputStatusChip: React.FC<InputStatusChipProps> = ({ preferredInput, midiDevices, micTelemetry, onOpen }) => {
  const { label, kind } = inputStatusLabel(preferredInput, midiDevices, micTelemetry);
  const Icon = ICONS[kind];
  const live = kind === 'mic' && micTelemetry.active;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`How you play: ${label}`}
      className="h-11 max-w-[11rem] sm:max-w-[16rem] px-3 flex items-center gap-2 rounded-control border border-ink-primary/15 text-xs-13 sm:text-base text-ink-secondary hover:text-ink-primary hover:border-ink-primary/35"
    >
      <Icon className={`w-4 h-4 shrink-0 ${live ? 'text-state-ok' : ''}`} aria-hidden="true" />
      <span className="truncate tabular-nums">{label}</span>
    </button>
  );
};

export default InputStatusChip;
