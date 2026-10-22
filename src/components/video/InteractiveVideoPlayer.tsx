import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Youtube,
  Zap,
} from 'lucide-react';
import type {
  NoteInputEvent,
  ScoreNoteEvent,
  VideoChapter,
  VideoLesson,
} from '../../types';
import { getFingerLabel, getHandLabel, midiToFrequency, midiToNoteName } from '../../utils/midiUtils';
import { InteractiveKeyboard, type TargetKeyAnnotation } from '../visualizers/InteractiveKeyboard';
import { OverheadHandGuide, type ActiveHandFingerTarget } from '../visualizers/OverheadHandGuide';

export interface InteractiveVideoPlayerProps {
  video: VideoLesson;
  /** Currently held/detected MIDI notes from Mic, MIDI, or QWERTY */
  currentlyHeldMidis?: number[];
  /** Alias for currentlyHeldMidis */
  activeMidis?: number[];
  /** Optional callback to trigger the app's primary AudioEngine grand piano synth */
  onPlayNote?: (midi: number, velocity?: number, durationMs?: number) => void;
  /** Optional callback to trigger a chord on the app's primary AudioEngine */
  onPlayChord?: (midis: number[], velocity?: number, durationSec?: number) => void;
  /** Latest note input event from InputManager */
  lastNoteInput?: NoteInputEvent | null;
  /** Optional callback when user presses a key on the embedded keyboard */
  onNoteOn?: (midi: number, velocity?: number) => void;
  /** Optional callback when user releases a key on the embedded keyboard */
  onNoteOff?: (midi: number) => void;
  /** Called when the user completes the interactive checkpoint or finishes the video */
  onCompleteCheckpoint?: (videoId: string) => void;
  /** Alias for onCompleteCheckpoint */
  onComplete?: (videoId: string) => void;
  className?: string;
}

type PlayerMode = 'studio_overhead' | 'youtube_embed';
type PlaybackSpeed = 0.5 | 0.75 | 1.0;

export const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({
  video,
  currentlyHeldMidis,
  activeMidis,
  onPlayNote,
  onPlayChord,
  lastNoteInput,
  onNoteOn,
  onNoteOff,
  onCompleteCheckpoint,
  onComplete,
  className = '',
}) => {
  const [playerMode, setPlayerMode] = useState<PlayerMode>('studio_overhead');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [checkpointStepIdx, setCheckpointStepIdx] = useState<number>(0);
  const [localPressedMidis, setLocalPressedMidis] = useState<number[]>([]);

  const fallbackAudioCtxRef = useRef<AudioContext | null>(null);
  const lastTriggeredNoteIdRef = useRef<string | null>(null);

  // Reset state when switching videos
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
    setCheckpointStepIdx(0);
    lastTriggeredNoteIdRef.current = null;
  }, [video.id]);

  // Built-in fallback Web Audio synthesizer if parent doesn't supply onPlayNote
  const triggerSynthNote = useCallback(
    (midi: number, velocity = 0.75, durationMs = 520) => {
      if (isMuted) return;
      if (onPlayNote) {
        const durSec = durationMs > 15 ? durationMs / 1000 : durationMs;
        onPlayNote(midi, velocity, durSec);
        return;
      }
      if (onPlayChord) {
        const durSec = durationMs > 15 ? durationMs / 1000 : durationMs;
        onPlayChord([midi], velocity, durSec);
        return;
      }
      if (onNoteOn) {
        onNoteOn(midi, velocity);
        setTimeout(() => onNoteOff?.(midi), durationMs);
        return;
      }

      try {
        const AudioCtx = window.AudioContext;
        if (!AudioCtx) return;
        if (!fallbackAudioCtxRef.current) {
          fallbackAudioCtxRef.current = new AudioCtx();
        }
        const ctx = fallbackAudioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const freq = midiToFrequency(midi);
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now);

        const durSec = Math.max(0.2, durationMs / 1000);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.28, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + durSec);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + durSec + 0.02);
        osc2.stop(now + durSec + 0.02);
      } catch {
        // Ignore audio context restriction errors in headless environments
      }
    },
    [isMuted, onPlayNote, onPlayChord, onNoteOn, onNoteOff]
  );

  // Combine external live held notes + local virtual clicks
  const combinedHeldMidis = useMemo(() => {
    const ext = currentlyHeldMidis ?? activeMidis ?? [];
    const list = [...ext, ...localPressedMidis];
    if (lastNoteInput && lastNoteInput.type === 'note_on') {
      list.push(lastNoteInput.midi);
    }
    return Array.from(new Set(list));
  }, [currentlyHeldMidis, activeMidis, localPressedMidis, lastNoteInput]);

  // Verify Interactive Checkpoint progress sequentially against live input
  const checkpoint = video.interactiveCheckpoint;
  const isCheckpointComplete =
    checkpoint.targetMidis.length > 0 &&
    checkpointStepIdx >= checkpoint.targetMidis.length;

  useEffect(() => {
    if (combinedHeldMidis.length === 0) return;
    setCheckpointStepIdx((prevIdx) => {
      if (prevIdx >= checkpoint.targetMidis.length) return prevIdx;
      let nextIdx = prevIdx;
      while (
        nextIdx < checkpoint.targetMidis.length &&
        combinedHeldMidis.includes(checkpoint.targetMidis[nextIdx])
      ) {
        nextIdx++;
      }
      if (nextIdx > prevIdx && nextIdx >= checkpoint.targetMidis.length) {
        onCompleteCheckpoint?.(video.id);
        onComplete?.(video.id);
      }
      return nextIdx;
    });
  }, [combinedHeldMidis, checkpoint.targetMidis, video.id, onCompleteCheckpoint, onComplete]);
  // Determine current active chapter based on currentTimeSec
  const activeChapterIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < video.chapters.length; i++) {
      if (currentTimeSec >= video.chapters[i].timeSec) {
        idx = i;
      }
    }
    return idx;
  }, [video.chapters, currentTimeSec]);

  const activeChapter: VideoChapter | undefined =
    video.chapters[activeChapterIndex] ?? video.chapters[0];

  // Map currentTimeSec to demo score beat (looping smoothly through interactiveDemoScore)
  const demoScore = video.interactiveDemoScore;
  const demoBeat = useMemo(() => {
    const bps = (demoScore.bpm || 72) / 60;
    const totalBeats = Math.max(4, demoScore.totalBeats || 8);
    return (currentTimeSec * bps) % totalBeats;
  }, [currentTimeSec, demoScore.bpm, demoScore.totalBeats]);

  // Find demo score note active at demoBeat
  const activeDemoNotes: ScoreNoteEvent[] = useMemo(() => {
    const matches = demoScore.notes.filter(
      (n) =>
        demoBeat >= n.beatStart - 0.08 &&
        demoBeat <= n.beatStart + n.durationBeats * 0.9
    );
    if (matches.length > 0) return matches;

    // Fallback to active chapter's demoNotesMidi
    if (activeChapter && activeChapter.demoNotesMidi.length > 0) {
      return activeChapter.demoNotesMidi.map((midi, i) => ({
        id: `chap-demo-${midi}-${i}`,
        midi,
        noteName: midiToNoteName(midi),
        measureIndex: 0,
        beatStart: 0,
        durationBeats: 1,
        durationType: 'quarter',
        hand: activeChapter.hand ?? (midi < 60 ? 'left' : 'right'),
        clef: midi < 60 ? 'bass' : 'treble',
        finger: activeChapter.finger ?? (((i % 5) + 1) as 1 | 2 | 3 | 4 | 5),
      }));
    }
    return [];
  }, [demoScore.notes, demoBeat, activeChapter]);

  // Trigger audio synthesis when a new demo note starts during Studio Overhead playback
  useEffect(() => {
    if (!isPlaying || playerMode !== 'studio_overhead') return;
    if (activeDemoNotes.length === 0) return;

    const firstNote = activeDemoNotes[0];
    if (
      firstNote.id.startsWith('chap-demo-') ||
      lastTriggeredNoteIdRef.current === firstNote.id
    ) {
      return;
    }

    lastTriggeredNoteIdRef.current = firstNote.id;
    const beatMs = (60 / (demoScore.bpm || 72)) * 1000;
    for (const note of activeDemoNotes) {
      triggerSynthNote(
        note.midi,
        0.72,
        Math.round((note.durationBeats * beatMs) / playbackSpeed)
      );
    }
  }, [
    isPlaying,
    playerMode,
    activeDemoNotes,
    demoScore.bpm,
    playbackSpeed,
    triggerSynthNote,
  ]);

  // Studio Overhead Animation Clock
  useEffect(() => {
    if (!isPlaying || playerMode !== 'studio_overhead') return;

    let lastTs = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dtSec = ((now - lastTs) / 1000) * playbackSpeed;
      lastTs = now;

      setCurrentTimeSec((prev) => {
        const next = prev + dtSec;
        if (next >= video.durationSec) {
          setIsPlaying(false);
          return video.durationSec;
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playerMode, playbackSpeed, video.durationSec]);

  const formatTime = (sec: number): string => {
    const s = Math.max(0, Math.floor(sec));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSelectChapter = (chapter: VideoChapter) => {
    setCurrentTimeSec(chapter.timeSec);
    lastTriggeredNoteIdRef.current = null;
    if (chapter.demoNotesMidi.length > 0) {
      chapter.demoNotesMidi.forEach((midi, idx) => {
        setTimeout(() => triggerSynthNote(midi, 0.78, 550), idx * 140);
      });
    }
  };

  // Build target annotations for OverheadHandGuide & InteractiveKeyboard
  const overheadTargets: ActiveHandFingerTarget[] = useMemo(() => {
    if (isPlaying && activeDemoNotes.length > 0) {
      return activeDemoNotes.map((n) => ({
        midi: n.midi,
        hand: n.hand,
        finger: n.finger,
        noteName: n.noteName,
      }));
    }
    // When paused, highlight the Interactive Checkpoint targets so the learner can try them immediately
    return checkpoint.targetMidis.map((midi, i) => ({
      midi,
      hand: checkpoint.hand,
      finger: checkpoint.fingers[i] ?? checkpoint.fingers[0] ?? 1,
      noteName: checkpoint.targetNoteNames[i] ?? midiToNoteName(midi),
    }));
  }, [isPlaying, activeDemoNotes, checkpoint]);

  const keyboardTargetNotes: TargetKeyAnnotation[] = useMemo(
    () =>
      overheadTargets.map((t) => ({
        midi: t.midi,
        hand: t.hand,
        finger: t.finger,
        noteName: t.noteName,
      })),
    [overheadTargets]
  );

  const youtubeEmbedUrl = useMemo(() => {
    const startParam = video.youtubeStartSec
      ? `?start=${video.youtubeStartSec}&rel=0&modestbranding=1`
      : '?rel=0&modestbranding=1';
    return `https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}${startParam}`;
  }, [video.youtubeVideoId, video.youtubeStartSec]);

  return (
    <div
      className={`w-full rounded-xl bg-[#0D0F14] border border-white/10 overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Player Header & Dual-Mode Switcher */}
      <div className="px-4 py-3 bg-[#161922] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#E5A93C]/20 text-[#E5A93C] font-tabular text-[11px] font-bold uppercase">
              {video.category}
            </span>
            <span className="text-xs text-[#B8B2A6]">
              Instructor: <strong className="text-[#F5F2EB]">{video.instructor}</strong> ·{' '}
              {video.durationLabel}
            </span>
          </div>
          <h3 className="font-editorial text-lg sm:text-xl font-semibold text-[#F5F2EB] mt-0.5">
            {video.title}
          </h3>
        </div>

        {/* Mode A vs Mode B Switcher */}
        <div className="inline-flex items-center p-1 rounded-lg bg-[#090B0F] border border-white/10">
          <button
            type="button"
            onClick={() => setPlayerMode('studio_overhead')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              playerMode === 'studio_overhead'
                ? 'bg-[#E5A93C] text-[#090B0F] shadow'
                : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Overhead Demo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setPlayerMode('youtube_embed');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              playerMode === 'youtube_embed'
                ? 'bg-[#F43F5E] text-white shadow'
                : 'text-[#B8B2A6] hover:text-[#F5F2EB]'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube Lesson</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Left Video/Overhead Stage (7 cols) + Right Chapters & Interactive Check (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left 7 Cols: Dual-Mode Visual Stage */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-[#090B0F]">
          {playerMode === 'studio_overhead' ? (
            <div className="flex flex-col justify-between flex-1">
              {/* Overhead Camera Narration Stage */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-[#141824] to-[#090B0F] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] font-tabular font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                    OVERHEAD CONSERVATORY CAMERA
                  </span>
                  <span className="font-tabular text-[#B8B2A6]">
                    Chapter {activeChapterIndex + 1} of {video.chapters.length}
                  </span>
                </div>

                {/* Synchronized Instructor Caption Box */}
                {activeChapter && (
                  <div className="p-3.5 rounded-lg bg-[#161922]/95 border border-[#E5A93C]/35 space-y-1.5 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                        {activeChapter.title}
                      </span>
                      <span className="text-[11px] font-tabular text-[#38BDF8]">
                        Key Takeaway: {activeChapter.keyTakeaway}
                      </span>
                    </div>
                    <p className="text-sm text-[#F5F2EB] leading-relaxed">
                      “{activeChapter.narration}”
                    </p>
                  </div>
                )}
              </div>

              {/* Synchronized Overhead Hand Ghost + Interactive Piano Keybed */}
              <div className="pt-2 bg-[#090B0F]">
                <OverheadHandGuide
                  activeNotes={overheadTargets}
                  visible={true}
                />
                <InteractiveKeyboard
                  currentlyHeldMidis={
                    isPlaying
                      ? activeDemoNotes.map((n) => n.midi)
                      : combinedHeldMidis
                  }
                  targetNotes={keyboardTargetNotes}
                  showNoteNames={true}
                  showFingerNumbers={true}
                  showQwertyLabels={false}
                  compact={true}
                  onNoteOn={(midi, vel) => {
                    setLocalPressedMidis((prev) =>
                      prev.includes(midi) ? prev : [...prev, midi]
                    );
                    triggerSynthNote(midi, vel ?? 0.8, 480);
                  }}
                  onNoteOff={(midi) => {
                    setLocalPressedMidis((prev) =>
                      prev.filter((m) => m !== midi)
                    );
                  }}
                />
              </div>

              {/* Studio Transport Controls Bar */}
              <div className="px-4 py-2.5 bg-[#161922] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTimeSec >= video.durationSec) {
                        setCurrentTimeSec(0);
                      }
                      setIsPlaying((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5A93C] hover:bg-[#F0B849] text-[#090B0F] text-xs font-bold transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Demo</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Overhead Demo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentTimeSec(0);
                      lastTriggeredNoteIdRef.current = null;
                    }}
                    className="p-1.5 rounded-lg bg-[#1E2230] hover:bg-[#282D40] text-[#B8B2A6] hover:text-white border border-white/10"
                    title="Restart Video Demo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Timeline Scrubber */}
                <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-xs">
                  <input
                    type="range"
                    min={0}
                    max={video.durationSec}
                    step={1}
                    value={Math.floor(currentTimeSec)}
                    onChange={(e) => {
                      setCurrentTimeSec(Number(e.target.value));
                      lastTriggeredNoteIdRef.current = null;
                    }}
                    aria-label="Video timeline scrubber"
                    className="w-full accent-[#E5A93C] cursor-pointer h-1.5 bg-[#090B0F] rounded-lg"
                  />
                  <span className="font-tabular text-[11px] text-[#B8B2A6] whitespace-nowrap">
                    {formatTime(currentTimeSec)} / {video.durationLabel}
                  </span>
                </div>

                {/* Playback Speed (0.5x, 0.75x, 1.0x) & Audio Mute */}
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#E5A93C]" />
                  {([0.5, 0.75, 1.0] as PlaybackSpeed[]).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded font-tabular text-[11px] font-bold border transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-[#E5A93C]/20 border-[#E5A93C] text-[#E5A93C]'
                          : 'bg-[#1E2230] border-white/10 text-[#B8B2A6] hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="ml-1 p-1.5 rounded bg-[#1E2230] border border-white/10 text-[#B8B2A6] hover:text-white"
                    title={isMuted ? 'Unmute Demo Synth' : 'Mute Demo Synth'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#F43F5E]" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mode B: Curated YouTube Conservatory Embed */
            <div className="flex flex-col justify-between flex-1">
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={youtubeEmbedUrl}
                  title={video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-3.5 bg-[#161922] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#B8B2A6]">
                  <span>
                    Prefer interactive animated hands or offline playback?
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#38BDF8] hover:underline font-medium"
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayerMode('studio_overhead')}
                  className="px-3 py-1.5 rounded bg-[#E5A93C]/20 hover:bg-[#E5A93C]/30 border border-[#E5A93C] text-[#E5A93C] font-semibold transition-colors"
                >
                  Switch to Studio Overhead Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Chapter Timeline & Interactive "Your Turn" Checkpoint */}
        <div className="lg:col-span-5 p-4 bg-[#161922] flex flex-col justify-between gap-4">
          {/* Chapter List */}
          <div className="space-y-2.5">
            <h4 className="font-editorial text-sm font-semibold text-[#F5F2EB] uppercase tracking-wider text-[11px] text-[#B8B2A6]">
              Video Chapters &amp; Demonstrations
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {video.chapters.map((chap, idx) => {
                const isCurrent = idx === activeChapterIndex;
                return (
                  <button
                    key={`${chap.title}-${idx}`}
                    type="button"
                    onClick={() => handleSelectChapter(chap)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-[#1E2230] border-[#E5A93C]/65 shadow'
                        : 'bg-[#0D0F14]/60 border-white/10 hover:bg-[#1E2230]/60'
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded font-tabular text-[11px] font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-[#E5A93C] text-[#090B0F]'
                          : 'bg-white/10 text-[#B8B2A6]'
                      }`}
                    >
                      {formatTime(chap.timeSec)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#F5F2EB] flex items-center justify-between gap-1">
                        <span className="truncate">{chap.title}</span>
                        {chap.demoNotesMidi.length > 0 && (
                          <span className="font-tabular text-[10px] text-[#38BDF8] shrink-0">
                            {chap.demoNotesMidi.map(midiToNoteName).join('–')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#B8B2A6] mt-0.5 line-clamp-2">
                        {chap.keyTakeaway}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Checkpoint Card ("Your Turn — Try It on the Keyboard") */}
          <div
            className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
              isCheckpointComplete
                ? 'bg-[#10B981]/10 border-[#10B981]/60'
                : 'bg-[#0D0F14] border-[#38BDF8]/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8]">
                <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>YOUR TURN — TRY IT ON THE KEYBOARD</span>
              </span>

              {isCheckpointComplete ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981] text-[#090B0F] font-tabular text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Mastered!
                </span>
              ) : (
                <span className="font-tabular text-[11px] text-[#B8B2A6]">
                  {checkpointStepIdx} / {checkpoint.targetMidis.length} notes played
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-[#F5F2EB]">
              {checkpoint.prompt}
            </div>
            <p className="text-[11px] text-[#B8B2A6] leading-relaxed">
              {checkpoint.instructions} ({getHandLabel(checkpoint.hand)})
            </p>

            {/* Target Note Pills with Live Checkmarks */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {checkpoint.targetMidis.map((midi, i) => {
                const noteName =
                  checkpoint.targetNoteNames[i] ?? midiToNoteName(midi);
                const finger =
                  checkpoint.fingers[i] ?? checkpoint.fingers[0] ?? 1;
                const isDone = i < checkpointStepIdx;

                return (
                  <button
                    key={`chk-${midi}-${i}`}
                    type="button"
                    onClick={() => {
                      triggerSynthNote(midi, 0.82, 500);
                      setCheckpointStepIdx((prev) => {
                        const next = Math.max(prev, i + 1);
                        if (next >= checkpoint.targetMidis.length) {
                          onCompleteCheckpoint?.(video.id);
                          onComplete?.(video.id);
                        }
                        return next;
                      });
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-tabular text-xs font-bold border transition-all ${
                      isDone
                        ? 'bg-[#10B981]/20 border-[#10B981] text-[#34D399]'
                        : 'bg-[#1E2230] border-[#38BDF8]/40 text-[#F5F2EB] hover:border-[#38BDF8]'
                    }`}
                    title={`Press ${noteName} on your piano or click to test`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                    <span>{noteName}</span>
                    <span className="text-[10px] opacity-80">
                      ({getFingerLabel(finger)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveVideoPlayer;
