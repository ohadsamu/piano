import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Film,
  PlayCircle,
  Sparkles,
  X,
} from 'lucide-react';
import type { MistakeCategory, VideoLesson } from '../../types';
import { InteractiveVideoPlayer } from './InteractiveVideoPlayer';

export interface VideoCoachDrawerProps {
  /** Controls visibility when used as a slide-over drawer/modal (defaults to true) */
  isOpen?: boolean;
  /** Full library of available VideoLesson items */
  videos: VideoLesson[];
  /** Currently selected video ID */
  activeVideoId?: string | null;
  /** Video IDs specifically recommended for the current lesson or recent mistakes */
  recommendedVideoIds?: string[];
  /** Recent mistake categories detected from the player's session */
  detectedMistakeCategories?: MistakeCategory[];
  /** Current lesson ID to highlight lesson-linked videos */
  currentLessonId?: string;
  /** Set or array of completed video IDs */
  completedVideoIds?: string[];
  /** Currently held MIDI notes from Mic/MIDI/QWERTY for the interactive checkpoint */
  currentlyHeldMidis?: number[];
  /** Render inline inside a page tab instead of a fixed modal overlay */
  inline?: boolean;
  onSelectVideo?: (videoId: string) => void;
  onCompleteVideo?: (videoId: string) => void;
  onPlayNote?: (midi: number, velocity?: number, durationMs?: number) => void;
  onClose?: () => void;
  className?: string;
}

const MISTAKE_LABELS: Record<MistakeCategory, string> = {
  ADJACENT_KEY_SLIP: 'Neighbor Key Slip',
  LANDMARK_DISPLACEMENT: 'Middle C Landmark',
  OCTAVE_SHIFT: 'Octave Placement',
  INTERVAL_MISJUDGE: 'Steps vs. Skips',
  CHROMATIC_ACCIDENTAL_MISS: 'Black Key Reach',
  RUSHING_BEAT: 'Steady Tempo Pulse',
  DRAGGING_HESITATION: 'Look-Ahead Flow',
  SHORT_NOTE_CLIPPING: 'Full Note Sustain',
  CHORD_TRANSITION_STALL: 'Triad Claw Switch',
  TWO_HAND_DESYNC: 'Two-Hand Sync',
};

export const VideoCoachDrawer: React.FC<VideoCoachDrawerProps> = ({
  isOpen = true,
  videos,
  activeVideoId,
  recommendedVideoIds = [],
  detectedMistakeCategories = [],
  currentLessonId,
  completedVideoIds = [],
  currentlyHeldMidis = [],
  inline = false,
  onSelectVideo,
  onCompleteVideo,
  onPlayNote,
  onClose,
  className = '',
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    activeVideoId ?? recommendedVideoIds[0] ?? videos[0]?.id ?? ''
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    if (activeVideoId) {
      setSelectedVideoId(activeVideoId);
    }
  }, [activeVideoId]);

  const prescribedSet = useMemo(() => {
    const set = new Set<string>(recommendedVideoIds);
    for (const vid of videos) {
      if (currentLessonId && vid.linkedLessonIds.includes(currentLessonId)) {
        set.add(vid.id);
      }
      if (
        detectedMistakeCategories.some((m) =>
          vid.addressesMistakes.includes(m)
        )
      ) {
        set.add(vid.id);
      }
    }
    return set;
  }, [recommendedVideoIds, videos, currentLessonId, detectedMistakeCategories]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(videos.map((v) => v.category)));
    return ['ALL', 'PRESCRIBED', ...unique];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      if (categoryFilter === 'ALL') return true;
      if (categoryFilter === 'PRESCRIBED') return prescribedSet.has(vid.id);
      return vid.category === categoryFilter;
    });
  }, [videos, categoryFilter, prescribedSet]);

  const activeVideo = useMemo(() => {
    return (
      videos.find((v) => v.id === selectedVideoId) ??
      filteredVideos[0] ??
      videos[0] ??
      null
    );
  }, [videos, selectedVideoId, filteredVideos]);

  if (!isOpen) return null;

  const handleChooseVideo = (vidId: string) => {
    setSelectedVideoId(vidId);
    onSelectVideo?.(vidId);
  };

  const content = (
    <div
      className={`w-full flex flex-col bg-[#0D0F14] text-[#F5F2EB] ${
        inline
          ? 'rounded-xl border border-white/10 overflow-hidden'
          : 'max-w-6xl max-h-[92dvh] rounded-xl border border-[#E5A93C]/40 shadow-[0_24px_64px_rgba(0,0,0,0.88)] overflow-hidden'
      } ${className}`}
    >
      {/* Top Studio Header */}
      <div className="px-5 py-3.5 bg-[#161922] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E5A93C]/15 border border-[#E5A93C]/45 flex items-center justify-center text-[#E5A93C]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-tabular text-[11px] font-bold uppercase tracking-wider text-[#E5A93C]">
                Video Academy &amp; Technique Studio
              </span>
              {prescribedSet.size > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] font-tabular text-[10px] font-bold">
                  {prescribedSet.size} Prescribed for Your Hands
                </span>
              )}
            </div>
            <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#F5F2EB]">
              Interactive Overhead Demonstrations &amp; Conservatory Masterclasses
            </h2>
          </div>
        </div>

        {/* Category Filter Pills & Close Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat;
            const label =
              cat === 'ALL'
                ? 'All Videos'
                : cat === 'PRESCRIBED'
                ? `Prescribed (${prescribedSet.size})`
                : cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  isSelected
                    ? 'bg-[#E5A93C] text-[#090B0F] border-[#E5A93C]'
                    : 'bg-[#1E2230] text-[#B8B2A6] border-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}

          {onClose && !inline && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E2230] hover:bg-[#282D40] border border-white/15 text-[#B8B2A6] hover:text-white text-xs font-semibold"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Active InteractiveVideoPlayer + Video Library Sidebar/Grid */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
        {activeVideo && (
          <InteractiveVideoPlayer
            video={activeVideo}
            currentlyHeldMidis={currentlyHeldMidis}
            onPlayNote={onPlayNote}
            onCompleteCheckpoint={onCompleteVideo}
          />
        )}

        {/* Video Curriculum & Mistake-Linked Library Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base font-semibold text-[#F5F2EB] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E5A93C]" />
              <span>Conservatory Video Library ({filteredVideos.length})</span>
            </h3>
            <span className="text-xs text-[#B8B2A6]">
              Every lesson includes both an offline Studio Overhead Hand Demo and
              a YouTube tutorial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredVideos.map((vid) => {
              const isCurrent = activeVideo?.id === vid.id;
              const isPrescribed = prescribedSet.has(vid.id);
              const isCompleted = completedVideoIds.includes(vid.id);

              return (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => handleChooseVideo(vid.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isCurrent
                      ? 'bg-[#1E2230] border-[#E5A93C] shadow-[0_0_18px_rgba(229,169,60,0.2)]'
                      : isPrescribed
                      ? 'bg-[#161922] border-[#38BDF8]/45 hover:border-[#38BDF8]'
                      : 'bg-[#161922] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-tabular text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-[#E5A93C]">
                        {vid.durationLabel}
                      </span>

                      <div className="flex items-center gap-1">
                        {isPrescribed && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            Recommended
                          </span>
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        )}
                      </div>
                    </div>

                    <h4 className="font-editorial text-sm font-semibold text-[#F5F2EB] leading-snug">
                      {vid.title}
                    </h4>

                    <p className="text-[11px] text-[#B8B2A6] line-clamp-2 leading-relaxed">
                      {vid.summary}
                    </p>
                  </div>

                  {/* Addressed Mistake Tags */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap gap-1">
                      {vid.addressesMistakes.slice(0, 2).map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0D0F14] text-[#B8B2A6] text-[10px] font-tabular"
                        >
                          <AlertCircle className="w-2.5 h-2.5 text-[#F59E0B]" />
                          {MISTAKE_LABELS[m] ?? m}
                        </span>
                      ))}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        isCurrent ? 'text-[#E5A93C]' : 'text-[#38BDF8]'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Playing' : 'Watch'}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Video Academy and Technique Coach Drawer"
    >
      {content}
    </div>
  );
};

export default VideoCoachDrawer;
