import React from 'react';
import {
  Ear,
  Eye,
  Hand as HandIcon,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Volume2,
  Wrench,
} from 'lucide-react';
import type { Hand, PracticeMode, VisualizerMode } from '../../types';

interface TransportControlBarProps {
  mode: PracticeMode;
  onChangeMode: (mode: PracticeMode) => void;
  visualizerMode: VisualizerMode;
  onChangeVisualizerMode: (v: VisualizerMode) => void;
  isPlaying: boolean;
  isPaused: boolean;
  onStartOrResume: () => void;
  onPause: () => void;
  onRestart: () => void;
  currentMeasure: number;
  totalMeasures: number;
  beatsPerMeasure?: number;
  currentBeat: number;
  effectiveBpm: number;
  baseBpm: number;
  tempoMultiplier: number;
  onChangeTempoMultiplier: (mult: number) => void;
  handFilter: Hand;
  onChangeHandFilter: (hand: Hand) => void;
  loopRange: [number, number] | null;
  onToggleLoopTroubleMeasures: () => void;
  metronomeEnabled: boolean;
  onToggleMetronome: () => void;
  accompanimentEnabled: boolean;
  onToggleAccompaniment: () => void;
  showNoteNames: boolean;
  onToggleShowNoteNames: () => void;
  showOverheadHands: boolean;
  onToggleShowOverheadHands: () => void;
  onOpenFixMeCoach: () => void;
  onOpenVideoCoach: () => void;
  troubleMeasuresCount: number;
}

export const TransportControlBar: React.FC<TransportControlBarProps> = ({
  mode,
  onChangeMode,
  visualizerMode,
  onChangeVisualizerMode,
  isPlaying,
  isPaused,
  onStartOrResume,
  onPause,
  onRestart,
  currentMeasure,
  totalMeasures,
  beatsPerMeasure = 4,
  currentBeat,
  effectiveBpm,
  tempoMultiplier,
  onChangeTempoMultiplier,
  handFilter,
  onChangeHandFilter,
  loopRange,
  onToggleLoopTroubleMeasures,
  metronomeEnabled,
  onToggleMetronome,
  accompanimentEnabled,
  onToggleAccompaniment,
  showNoteNames,
  onToggleShowNoteNames,
  showOverheadHands,
  onToggleShowOverheadHands,
  onOpenFixMeCoach,
  troubleMeasuresCount,
}) => {
  return (
    <div className="bg-[#161922] border-b border-[#F5F2EB]/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
      {/* Left: Transport Play/Pause/Restart + Live Measure/Beat Readout */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isPlaying || isPaused ? (
          <button
            type="button"
            onClick={onStartOrResume}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3C66F] text-[#0D0F14] font-semibold text-xs shadow-sm transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>{isPaused ? 'Resume' : 'Start Practice'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2230] hover:bg-[#282D3E] text-[#F5F2EB] border border-[#E5A93C]/50 font-semibold text-xs transition-colors whitespace-nowrap"
          >
            <Pause className="w-3.5 h-3.5 shrink-0" />
            <span>Pause</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="p-1.5 rounded-lg bg-[#1E2230] hover:bg-[#282D3E] text-[#B8B2A6] hover:text-[#F5F2EB] border border-[#F5F2EB]/10 transition-colors"
          title="Restart current stage from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Live Measure & Beat Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D0F14] border border-[#F5F2EB]/10 font-tabular text-xs whitespace-nowrap">
          <span className="text-[#7D8494]">BAR</span>
          <span className="text-[#F5F2EB] font-bold">
            {String(currentMeasure + 1).padStart(2, '0')}/{String(totalMeasures).padStart(2, '0')}
          </span>
          <span className="text-[#7D8494]">•</span>
          <span className="text-[#E5A93C] font-bold">
            BEAT {(Math.floor(currentBeat) % Math.max(1, beatsPerMeasure)) + 1}
          </span>
        </div>
      </div>

      {/* Center: Practice Mode Switcher (Wait Mode / Slow Flow / Perform / Auto-Listen) */}
      <div className="flex items-center gap-1 bg-[#0D0F14] p-0.5 rounded-xl border border-[#F5F2EB]/10 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onChangeMode('wait_mode')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            mode === 'wait_mode'
              ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
              : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
          }`}
          title="Wait Mode: The score pauses at each note and waits for you to play the right key"
        >
          <span className="hidden xl:inline">Wait Mode (Step-by-Step)</span>
          <span className="xl:hidden">Wait Mode</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('slow_practice')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            mode === 'slow_practice'
              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
              : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
          }`}
          title="Slow Flow: Steady accompaniment at reduced speed"
        >
          Slow Flow
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('performance')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            mode === 'performance'
              ? 'bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/40'
              : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
          }`}
          title="Full Stage Performance: Play at tempo for Star Mastery & Coach Review"
        >
          Stage Perform
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('auto_demo')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            mode === 'auto_demo'
              ? 'bg-[#818CF8]/20 text-[#818CF8] border border-[#818CF8]/40'
              : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
          }`}
          title="Listen & Watch Demo: App plays the piece while showing Overhead Hands and Keys"
        >
          <Ear className="w-3.5 h-3.5 shrink-0" />
          <span>Listen Demo</span>
        </button>
      </div>

      {/* Right: Tempo, Hand Filter, Visualizer View, & Fix-Me Coach Trigger */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 bg-[#0D0F14] px-2.5 py-1 rounded-lg border border-[#F5F2EB]/10">
          <span className="font-tabular text-xs font-bold text-[#E5A93C]">
            {Math.round(effectiveBpm)} BPM
          </span>
          <div className="flex items-center gap-1 ml-1">
            {[0.6, 0.75, 1.0].map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => onChangeTempoMultiplier(mult)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-tabular font-semibold transition-colors ${
                  Math.abs(tempoMultiplier - mult) < 0.04
                    ? 'bg-[#E5A93C] text-[#0D0F14]'
                    : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
                }`}
              >
                {Math.round(mult * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* Hand Selector */}
        <div className="flex items-center bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10 text-xs">
          {(['right', 'left', 'both'] as Hand[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChangeHandFilter(h)}
              className={`px-2 py-1 rounded-md font-semibold capitalize transition-colors ${
                handFilter === h
                  ? h === 'right'
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                    : h === 'left'
                    ? 'bg-[#818CF8]/20 text-[#818CF8]'
                    : 'bg-[#1E2230] text-[#F5F2EB]'
                  : 'text-[#7D8494] hover:text-[#F5F2EB]'
              }`}
            >
              {h === 'right' ? 'RH' : h === 'left' ? 'LH' : 'Both'}
            </button>
          ))}
        </div>

        {/* Visualizer Mode Switcher (Sheet + Cascade / Sheet / Falling Notes) */}
        <div className="hidden lg:flex items-center bg-[#0D0F14] p-0.5 rounded-lg border border-[#F5F2EB]/10 text-xs">
          {(
            [
              { id: 'both', label: 'Staff + Cascade' },
              { id: 'sheet', label: 'Sheet Music' },
              { id: 'falling', label: 'Falling Notes' },
            ] as Array<{ id: VisualizerMode; label: string }>
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onChangeVisualizerMode(v.id)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                visualizerMode === v.id
                  ? 'bg-[#1E2230] text-[#F5F2EB] border border-[#E5A93C]/30'
                  : 'text-[#7D8494] hover:text-[#F5F2EB]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Loop Bar / Metronome / Note Labels / Overhead Hands */}
        <button
          type="button"
          onClick={onToggleLoopTroubleMeasures}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            loopRange
              ? 'bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#F59E0B]'
              : 'bg-[#1E2230] border-[#F5F2EB]/10 text-[#B8B2A6] hover:text-[#F5F2EB]'
          }`}
          title="Loop Selected Measures (A–B Repeat)"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>
            {loopRange ? `Loop Bar ${loopRange[0] + 1}–${loopRange[1] + 1}` : 'Loop Bars'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleMetronome}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            metronomeEnabled
              ? 'bg-[#E5A93C]/20 border-[#E5A93C]/40 text-[#E5A93C]'
              : 'bg-[#1E2230] border-[#F5F2EB]/10 text-[#7D8494] hover:text-[#F5F2EB]'
          }`}
          title="Toggle Woodblock Metronome Click"
        >
          Metro
        </button>

        <button
          type="button"
          onClick={onToggleAccompaniment}
          className={`p-1.5 rounded-lg border transition-colors ${
            accompanimentEnabled
              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#1E2230] border-[#F5F2EB]/10 text-[#7D8494]'
          }`}
          title="Toggle Backing Track Accompaniment"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleShowNoteNames}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            showNoteNames
              ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]'
              : 'bg-[#1E2230] border-[#F5F2EB]/10 text-[#7D8494]'
          }`}
          title="Show/Hide Note Names (C4, D4, E4) on Staff & Keys"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Names</span>
        </button>

        <button
          type="button"
          onClick={onToggleShowOverheadHands}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            showOverheadHands
              ? 'bg-[#818CF8]/15 border-[#818CF8]/40 text-[#818CF8]'
              : 'bg-[#1E2230] border-[#F5F2EB]/10 text-[#7D8494]'
          }`}
          title="Show/Hide Overhead Hand & Finger Ghost Guide"
        >
          <HandIcon className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Hands</span>
        </button>

        {/* Compact "Fix Play" Coach Button */}
        <button
          type="button"
          onClick={onOpenFixMeCoach}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#F59E0B]/20 to-[#F43F5E]/20 hover:from-[#F59E0B]/30 hover:to-[#F43F5E]/30 text-[#F5F2EB] border border-[#F59E0B]/50 transition-all whitespace-nowrap"
          title="Open 'Identify My Play & Fix Me' Diagnostic Coach & Targeted Bar Remediation"
        >
          <Wrench className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span>Fix Play</span>
          {troubleMeasuresCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-tabular font-bold bg-[#F43F5E] text-white">
              {troubleMeasuresCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
