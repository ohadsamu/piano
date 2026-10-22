import React from 'react';
import { Mic, Music2, Sliders } from 'lucide-react';
import type { LiveMicTelemetry, MidiDeviceInfo } from '../../types';

export type StudioTab = 'curriculum' | 'stage' | 'videos' | 'workouts';

interface TopNavigationProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  micActive: boolean;
  micTelemetry: LiveMicTelemetry;
  midiDevices: MidiDeviceInfo[];
  onToggleMic: () => void;
  onOpenInputSetup: () => void;
  onQuickTestNote: () => void;
  streakDays: number;
  xp: number;
  totalStars: number;
  maxStars: number;
  unwatchedRecommendedVideosCount?: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onSelectTab,
  micActive,
  micTelemetry,
  midiDevices,
  onToggleMic,
  onOpenInputSetup,
  onQuickTestNote: _onQuickTestNote,
  streakDays: _streakDays,
  xp: _xp,
  totalStars: _totalStars,
  maxStars: _maxStars,
  unwatchedRecommendedVideosCount = 0,
}) => {
  const connectedMidi = midiDevices.filter((d) => d.connected);

  return (
    <header className="border-b border-[#F5F2EB]/10 bg-[#0D0F14]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-1 sm:gap-2">
        {/* Brand Identity */}
        <button
          type="button"
          onClick={() => onSelectTab('stage')}
          className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#161922] border border-[#E5A93C]/40 flex items-center justify-center group-hover:border-[#E5A93C] transition-colors">
            <Music2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5A93C]" />
          </div>
          <span className="hidden md:inline font-editorial text-base sm:text-lg font-semibold tracking-tight text-[#F5F2EB]">
            Nocturne &amp; Ivory
          </span>
        </button>

        {/* Center: 4 Clean Navigation Tabs */}
        <nav
          aria-label="Primary studio navigation"
          className="flex items-center bg-[#161922] p-0.5 sm:p-1 rounded-xl border border-[#F5F2EB]/10 shrink-0"
        >
          {(
            [
              { id: 'stage', label: 'Practice' },
              { id: 'curriculum', label: 'Lessons' },
              { id: 'videos', label: 'Videos', badge: unwatchedRecommendedVideosCount },
              { id: 'workouts', label: 'Workouts' },
            ] as Array<{ id: StudioTab; label: string; badge?: number }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1 rounded-lg text-[11px] sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#1E2230] text-[#F5F2EB] shadow-sm border border-[#E5A93C]/40'
                  : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded-full text-[10px] font-tabular font-bold bg-[#E5A93C] text-[#0D0F14]">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Right: 1 Primary E-Piano Mic Pill + 1 Settings Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleMic}
            title={
              micActive
                ? 'Listening to your E-Piano via Microphone — Click to Mute'
                : 'Start listening to your real E-Piano via Microphone'
            }
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all whitespace-nowrap ${
              micActive || connectedMidi.length > 0
                ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
                : 'bg-[#E5A93C]/15 border-[#E5A93C]/45 text-[#E5A93C] hover:bg-[#E5A93C]/25'
            }`}
          >
            {micActive || connectedMidi.length > 0 ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <span className="font-tabular">
                  {micTelemetry.detectedNoteName
                    ? `Listening · ${micTelemetry.detectedNoteName}`
                    : connectedMidi.length > 0
                    ? `MIDI · ${connectedMidi[0].name}`
                    : 'Listening'}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Listen to E-Piano</span>
                <span className="sm:hidden">Mic</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenInputSetup}
            className="p-1.5 sm:p-2 rounded-lg bg-[#161922] border border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#F5F2EB] hover:border-[#E5A93C]/40 transition-colors"
            title="Microphone Sensitivity & MIDI Setup"
            aria-label="Microphone Sensitivity & MIDI Setup"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
