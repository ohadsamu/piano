import React, { useState } from 'react';
import {
  CheckCircle2,
  PlaySquare,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type { MistakeCategory, NoteInputEvent, VideoLesson } from '../../types';
import { InteractiveVideoPlayer } from '../video/InteractiveVideoPlayer';

interface VideoAcademyViewProps {
  videos: VideoLesson[];
  initialVideoId?: string;
  watchedVideoIds: string[];
  recentMistakes: MistakeCategory[];
  onMarkVideoWatched: (videoId: string) => void;
  onPlayNote: (midi: number, velocity?: number, durationSec?: number) => void;
  onPlayChord: (midis: number[], velocity?: number, durationSec?: number) => void;
  lastNoteInput: NoteInputEvent | null;
  currentlyHeldMidis: number[];
}

export const VideoAcademyView: React.FC<VideoAcademyViewProps> = ({
  videos,
  initialVideoId,
  watchedVideoIds,
  recentMistakes,
  onMarkVideoWatched,
  onPlayNote,
  onPlayChord,
  lastNoteInput,
  currentlyHeldMidis,
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    initialVideoId ?? videos[0]?.id ?? 'vid-01-posture-arch'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const activeVideo =
    videos.find((v) => v.id === selectedVideoId) ?? videos[0];

  const categories = [
    'All',
    'Posture & Landmarks',
    'Sight Reading',
    'Rhythm & Tempo',
    'Chords & Accompaniment',
    'Hand Coordination',
  ];

  const filteredVideos =
    selectedCategory === 'All'
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  if (!activeVideo) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161922] border border-[#F5F2EB]/10 rounded-2xl p-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#10B981] mb-1">
            <PlaySquare className="w-4 h-4" />
            <span>Interactive Conservatory Video Academy</span>
          </div>
          <h1 className="font-editorial text-2xl font-semibold text-[#F5F2EB]">
            Overhead Hand Technique &amp; Personalized Video Coaching
          </h1>
          <p className="text-xs sm:text-sm text-[#B8B2A6] mt-0.5">
            Watch synchronized overhead hand animations or curated masterclasses, then test each skill on the interactive checkpoint keyboard.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#E5A93C] text-[#0D0F14]'
                  : 'bg-[#0D0F14] text-[#B8B2A6] hover:text-[#F5F2EB] border border-[#F5F2EB]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View: Active Interactive Video Player (Left 2/3) + Video Catalog (Right 1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InteractiveVideoPlayer
            video={activeVideo}
            onPlayNote={onPlayNote}
            onPlayChord={onPlayChord}
            lastNoteInput={lastNoteInput}
            currentlyHeldMidis={currentlyHeldMidis}
            onCompleteCheckpoint={() => onMarkVideoWatched(activeVideo.id)}
          />
        </div>

        {/* Right Catalog */}
        <div className="bg-[#161922] border border-[#F5F2EB]/10 rounded-2xl p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-[#F5F2EB]/10 pb-3">
            <h2 className="font-editorial text-lg font-semibold text-[#F5F2EB]">
              Conservatory Video Library ({filteredVideos.length})
            </h2>
            <span className="text-xs font-tabular text-[#10B981]">
              {watchedVideoIds.length}/{videos.length} Completed
            </span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredVideos.map((vid) => {
              const isSelected = vid.id === activeVideo.id;
              const isWatched = watchedVideoIds.includes(vid.id);
              const matchesRecentMistake = vid.addressesMistakes.some((m) =>
                recentMistakes.includes(m)
              );

              return (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => setSelectedVideoId(vid.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-[#1E2230] border-[#E5A93C] shadow-md'
                      : 'bg-[#0D0F14] border-[#F5F2EB]/10 hover:border-[#F5F2EB]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#161922] text-[#38BDF8] border border-[#38BDF8]/20">
                      {vid.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {matchesRecentMistake && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                          <Wrench className="w-2.5 h-2.5" /> Fixes Recent Slip
                        </span>
                      )}
                      <span className="font-tabular text-xs text-[#E5A93C]">
                        {vid.durationLabel}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-[#F5F2EB]">
                    {vid.title}
                  </div>
                  <p className="text-xs text-[#B8B2A6] line-clamp-2">{vid.summary}</p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#7D8494]">
                    <span>Instructor: {vid.instructor}</span>
                    {isWatched ? (
                      <span className="text-[#10B981] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="text-[#E5A93C] flex items-center gap-1 font-semibold">
                        <Sparkles className="w-3 h-3" /> Interactive Checkpoint
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
