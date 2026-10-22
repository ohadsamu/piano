import React from 'react';
import {
  BookOpen,
  Flame,
  Headphones,
  Keyboard,
  Mic,
  MicOff,
  Music2,
  PlaySquare,
  Sliders,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
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
  onQuickTestNote,
  streakDays,
  xp,
  totalStars,
  maxStars,
  unwatchedRecommendedVideosCount = 0,
}) => {
  const connectedMidi = midiDevices.filter((d) => d.connected);

  return (
    <header className="border-b border-[#F5F2EB]/10 bg-[#0D0F14]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 h-12 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('curriculum')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-[#161922] border border-[#E5A93C]/40 flex items-center justify-center shadow-inner group-hover:border-[#E5A93C] transition-colors shrink-0">
              <Music2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#E5A93C]" />
            </div>
            <div className="hidden xl:block">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg font-semibold tracking-tight text-[#F5F2EB]">
                  Nocturne &amp; Ivory
                </span>
                <span className="hidden 2xl:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#E5A93C]/15 text-[#E5A93C] border border-[#E5A93C]/30">
                  Conservatory Studio
                </span>
              </div>
              <p className="text-xs text-[#B8B2A6] hidden 2xl:block">
                Interactive Piano Coach • Step-by-Step Sight Reading, Chords &amp; Live Feedback
              </p>
            </div>
          </button>
        </div>

        {/* Primary View Switcher */}
        <nav
          aria-label="Primary studio navigation"
          className="flex items-center bg-[#161922] p-0.5 sm:p-1 rounded-xl border border-[#F5F2EB]/10 shrink-0"
        >
          <button
            type="button"
            onClick={() => onSelectTab('curriculum')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'curriculum'
                ? 'bg-[#1E2230] text-[#F5F2EB] shadow-sm border border-[#E5A93C]/40'
                : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
            }`}
          >
            <BookOpen className="hidden sm:block w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="hidden lg:inline">Curriculum Path</span>
            <span className="lg:hidden">Path</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('stage')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'stage'
                ? 'bg-[#1E2230] text-[#F5F2EB] shadow-sm border border-[#E5A93C]/40'
                : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
            }`}
          >
            <Sparkles className="hidden sm:block w-4 h-4 text-[#E5A93C] shrink-0" />
            <span className="hidden lg:inline">Practice Stage</span>
            <span className="lg:hidden">Stage</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('videos')}
            className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-[#1E2230] text-[#F5F2EB] shadow-sm border border-[#E5A93C]/40'
                : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
            }`}
          >
            <PlaySquare className="hidden sm:block w-4 h-4 text-[#10B981] shrink-0" />
            <span className="hidden lg:inline">Video Academy</span>
            <span className="lg:hidden">Videos</span>
            {unwatchedRecommendedVideosCount > 0 && (
              <span className="hidden sm:inline-flex ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-tabular font-bold bg-[#E5A93C] text-[#0D0F14]">
                {unwatchedRecommendedVideosCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('workouts')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'workouts'
                ? 'bg-[#1E2230] text-[#F5F2EB] shadow-sm border border-[#E5A93C]/40'
                : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
            }`}
          >
            <Zap className="hidden sm:block w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="hidden lg:inline">5-Min Workouts</span>
            <span className="lg:hidden">Workouts</span>
          </button>
        </nav>

        {/* Instrument Input Readiness & Progress Bar */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live Microphone Toggle Pill */}
          <button
            type="button"
            onClick={onToggleMic}
            title={
              micActive
                ? 'Acoustic Piano Microphone Listening Active — Click to Mute'
                : 'Enable Microphone to detect notes from your real piano or keyboard'
            }
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition-all whitespace-nowrap ${
              micActive
                ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
                : 'bg-[#E5A93C]/10 border-[#E5A93C]/40 text-[#F5F2EB] hover:bg-[#E5A93C]/20'
            }`}
          >
            {micActive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <Mic className="w-3.5 h-3.5 shrink-0" />
                <span className="font-tabular">
                  {micTelemetry.detectedNoteName
                    ? `Mic: ${micTelemetry.detectedNoteName}`
                    : 'Mic: On'}
                </span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-[#E5A93C] shrink-0" />
                <span className="inline sm:hidden font-semibold text-[#E5A93C]">Mic</span>
                <span className="hidden sm:inline font-semibold text-[#E5A93C]">Enable Piano Mic</span>
              </>
            )}
          </button>

          {/* MIDI / QWERTY Setup Button */}
          <button
            type="button"
            onClick={onOpenInputSetup}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-[#161922] border border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#F5F2EB] hover:border-[#E5A93C]/40 transition-colors"
            title="Configure Microphone Calibration, USB/Bluetooth MIDI Keyboard, and Computer Keyboard Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden xl:inline">
              {connectedMidi.length > 0
                ? `MIDI: ${connectedMidi[0].name}`
                : 'QWERTY & Touch Ready'}
            </span>
            <Sliders className="hidden sm:block w-3 h-3 text-[#7D8494]" />
          </button>

          {/* Quick Audio Test Chime */}
          <button
            type="button"
            onClick={onQuickTestNote}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#161922] border border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#E5A93C] transition-colors"
            title="Play Middle C4 reference tone"
          >
            <Headphones className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Tone C4</span>
          </button>

          {/* Streak & Stars Counters */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-[#F5F2EB]/10">
            <div
              className="flex items-center gap-1 text-xs font-tabular font-semibold text-[#F59E0B]"
              title="Daily practice streak"
            >
              <Flame className="w-4 h-4 fill-[#F59E0B]/20 text-[#F59E0B]" />
              <span>{streakDays}d</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-tabular font-semibold text-[#E5A93C]"
              title="Curriculum Stars Earned"
            >
              <Star className="w-4 h-4 fill-[#E5A93C] text-[#E5A93C]" />
              <span>
                {totalStars}/{maxStars}
              </span>
            </div>
            <div className="hidden md:flex items-center px-2 py-0.5 rounded bg-[#1E2230] text-[11px] font-tabular font-semibold text-[#38BDF8]">
              {xp} XP
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
