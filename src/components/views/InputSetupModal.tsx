import React, { useState } from 'react';
import {
  CheckCircle2,
  Keyboard,
  Mic,
  MicOff,
  Radio,
  Sliders,
  Volume2,
  X,
} from 'lucide-react';
import type { LiveMicTelemetry, MicCalibrationConfig, MidiDeviceInfo } from '../../types';

interface InputSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  micActive: boolean;
  micTelemetry: LiveMicTelemetry;
  micConfig: MicCalibrationConfig;
  onToggleMic: () => void;
  onUpdateMicConfig: (cfg: Partial<MicCalibrationConfig>) => void;
  onCalibrateNoiseFloor: () => Promise<number>;
  midiDevices: MidiDeviceInfo[];
  onRefreshMidi: () => void;
  onTestNote: (midi: number) => void;
}

export const InputSetupModal: React.FC<InputSetupModalProps> = ({
  isOpen,
  onClose,
  micActive,
  micTelemetry,
  micConfig,
  onToggleMic,
  onUpdateMicConfig,
  onCalibrateNoiseFloor,
  midiDevices,
  onRefreshMidi,
  onTestNote,
}) => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibratedMsg, setCalibratedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCalibrate = async () => {
    setCalibrating(true);
    setCalibratedMsg(null);
    try {
      const floor = await onCalibrateNoiseFloor();
      setCalibratedMsg(
        `Calibrated ambient room threshold to ${(floor * 1000).toFixed(1)} mV RMS.`
      );
    } finally {
      setCalibrating(false);
    }
  };

  const levelPct = Math.min(100, Math.max(2, Math.round(micTelemetry.rmsLevel * 900)));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-setup-title"
    >
      <div className="bg-[#161922] border border-[#F5F2EB]/15 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0D0F14] border-b border-[#F5F2EB]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E2230] border border-[#E5A93C]/40 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#E5A93C]" />
            </div>
            <div>
              <h2
                id="input-setup-title"
                className="font-editorial text-lg font-semibold text-[#F5F2EB]"
              >
                Instrument &amp; Acoustic Input Calibration
              </h2>
              <p className="text-xs text-[#B8B2A6]">
                Play via real acoustic piano (Microphone), USB/Bluetooth MIDI keyboard, or computer QWERTY keys
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#B8B2A6] hover:text-[#F5F2EB] hover:bg-[#1E2230]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. Acoustic Piano Microphone Recognition */}
          <section className="bg-[#0D0F14] border border-[#F5F2EB]/10 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#10B981]" />
                  <h3 className="text-sm font-semibold text-[#F5F2EB]">
                    1. Acoustic Piano &amp; Keyboard Microphone Listening (YIN Pitch Engine)
                  </h3>
                </div>
                <p className="text-xs text-[#B8B2A6] mt-1">
                  Listens through your device microphone, filters out room noise, and identifies the exact piano key you strike in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleMic}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  micActive
                    ? 'bg-[#10B981] text-[#0D0F14]'
                    : 'bg-[#1E2230] text-[#F5F2EB] border border-[#F5F2EB]/20 hover:border-[#10B981]'
                }`}
              >
                {micActive ? (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Microphone Active</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Enable Microphone</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Pitch & Level Readout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#161922] p-3.5 rounded-lg border border-[#F5F2EB]/10">
              <div>
                <div className="text-[11px] text-[#7D8494]">Input Signal Level</div>
                <div className="mt-1.5 h-2.5 w-full bg-[#0D0F14] rounded-full overflow-hidden border border-[#F5F2EB]/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B981] via-[#E5A93C] to-[#F43F5E] transition-all duration-75"
                    style={{ width: `${micActive ? levelPct : 0}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] font-tabular text-[#B8B2A6]">
                  RMS: {(micTelemetry.rmsLevel * 1000).toFixed(1)} mV
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#7D8494]">Detected Piano Note</div>
                <div className="mt-1 font-tabular text-lg font-bold text-[#38BDF8]">
                  {micTelemetry.detectedNoteName ?? '—'}
                </div>
                <div className="text-[11px] font-tabular text-[#B8B2A6]">
                  {micTelemetry.frequencyHz
                    ? `${micTelemetry.frequencyHz.toFixed(1)} Hz (${
                        micTelemetry.centsOff >= 0 ? `+${micTelemetry.centsOff}` : micTelemetry.centsOff
                      }¢)`
                    : 'Play a note on your piano'}
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="text-[11px] text-[#7D8494]">Room Noise Gate</div>
                <button
                  type="button"
                  disabled={!micActive || calibrating}
                  onClick={handleCalibrate}
                  className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E2230] hover:bg-[#282D3E] disabled:opacity-40 text-[#E5A93C] border border-[#E5A93C]/30 transition-colors"
                >
                  {calibrating ? 'Sampling Room...' : 'Calibrate Quiet Room (1s)'}
                </button>
              </div>
            </div>

            {calibratedMsg && (
              <p className="text-xs text-[#10B981] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{calibratedMsg}</span>
              </p>
            )}

            {/* Sensitivity slider */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <label htmlFor="mic-gate-slider" className="text-xs text-[#B8B2A6]">
                Noise Gate Sensitivity (lower = more sensitive to soft notes):
              </label>
              <input
                id="mic-gate-slider"
                type="range"
                min={0.004}
                max={0.05}
                step={0.002}
                value={micConfig.rmsThreshold}
                onChange={(e) =>
                  onUpdateMicConfig({ rmsThreshold: parseFloat(e.target.value) })
                }
                className="w-44 accent-[#E5A93C]"
              />
            </div>
          </section>

          {/* 2. USB / Bluetooth Web MIDI Keyboard */}
          <section className="bg-[#0D0F14] border border-[#F5F2EB]/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="text-sm font-semibold text-[#F5F2EB]">
                  2. USB / Bluetooth MIDI Digital Piano Connection
                </h3>
              </div>
              <button
                type="button"
                onClick={onRefreshMidi}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#1E2230] hover:bg-[#282D3E] text-[#38BDF8] border border-[#38BDF8]/30"
              >
                Scan MIDI Ports
              </button>
            </div>
            {midiDevices.length === 0 ? (
              <p className="text-xs text-[#B8B2A6] bg-[#161922] p-3 rounded-lg border border-[#F5F2EB]/5">
                No USB/Bluetooth MIDI controllers detected yet. Connect any digital piano or MIDI keyboard via USB and click &ldquo;Scan MIDI Ports&rdquo; for zero-latency velocity-sensitive detection.
              </p>
            ) : (
              <ul className="space-y-2">
                {midiDevices.map((dev) => (
                  <li
                    key={dev.id}
                    className="flex items-center justify-between bg-[#161922] px-3.5 py-2.5 rounded-lg border border-[#10B981]/30 text-xs"
                  >
                    <span className="font-semibold text-[#F5F2EB]">
                      {dev.name} ({dev.manufacturer || 'MIDI Port'})
                    </span>
                    <span className="text-[#10B981] font-tabular font-semibold">
                      Connected
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 3. Computer QWERTY Keyboard & Touch Synthesizer */}
          <section className="bg-[#0D0F14] border border-[#F5F2EB]/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#E5A93C]" />
                <h3 className="text-sm font-semibold text-[#F5F2EB]">
                  3. Computer QWERTY Keyboard &amp; Multi-Touch Grand Piano
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onTestNote(60)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/40"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Middle C4 Sound</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#B8B2A6]">
              <div className="bg-[#161922] p-3 rounded-lg border border-[#F5F2EB]/10">
                <div className="font-semibold text-[#38BDF8] mb-1">
                  Right Hand / Treble Octave (C4 – G5)
                </div>
                <p className="font-tabular text-[11px]">
                  White keys: <strong className="text-[#F5F2EB]">Q W E R T Y U I O P [ ]</strong>
                </p>
                <p className="font-tabular text-[11px] mt-0.5">
                  Black keys: <strong className="text-[#E5A93C]">2 3 &nbsp; 5 6 7 &nbsp; 9 0</strong>
                </p>
              </div>
              <div className="bg-[#161922] p-3 rounded-lg border border-[#F5F2EB]/10">
                <div className="font-semibold text-[#818CF8] mb-1">
                  Left Hand / Bass Octave (C3 – B3)
                </div>
                <p className="font-tabular text-[11px]">
                  White keys: <strong className="text-[#F5F2EB]">Z X C V B N M</strong>
                </p>
                <p className="font-tabular text-[11px] mt-0.5">
                  Black keys: <strong className="text-[#E5A93C]">S D &nbsp; G H J</strong>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0D0F14] border-t border-[#F5F2EB]/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3C66F] text-[#0D0F14] font-semibold text-xs sm:text-sm"
          >
            Done &amp; Return to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
