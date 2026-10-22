import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Layers,
  Music,
  Play,
  PlaySquare,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';
import type {
  CurriculumTrackId,
  Lesson,
  VideoLesson,
  WorkoutDefinition,
} from '../../types';
import type { LessonProgressRecord } from '../../utils/storage';
import { InteractiveKeyboard } from '../visualizers/InteractiveKeyboard';

interface CurriculumMapViewProps {
  lessons: Lesson[];
  activeLessonId: string;
  lessonProgress: Record<string, LessonProgressRecord>;
  recommendedVideos: VideoLesson[];
  watchedVideoIds: string[];
  workouts: WorkoutDefinition[];
  currentlyHeldMidis?: number[];
  onVirtualNoteOn?: (midi: number, velocity?: number) => void;
  onVirtualNoteOff?: (midi: number) => void;
  onSelectLesson: (lessonId: string, stepIndex?: number) => void;
  onOpenVideo: (videoId: string) => void;
  onOpenWorkout: (workoutId: string) => void;
}

const TRACK_META: Record<
  CurriculumTrackId,
  {
    title: string;
    subtitle: string;
    badgeColor: string;
    borderColor: string;
    accentColor: string;
  }
> = {
  soloist: {
    title: 'Soloist Path • Sight-Reading & Melodic Technique',
    subtitle:
      'Master the Grand Staff from Middle C landmarks to Beethoven, Bach, and expressive left/right hand melodies.',
    badgeColor: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30',
    borderColor: 'border-[#38BDF8]/35',
    accentColor: '#38BDF8',
  },
  chords: {
    title: 'Chords Path • Pop Accompaniment & Harmony',
    subtitle:
      'Build 3-note triads, rhythmic groove patterns, and the 4-chord progression that unlocks hundreds of pop songs.',
    badgeColor: 'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30',
    borderColor: 'border-[#EC4899]/35',
    accentColor: '#EC4899',
  },
  synthesis: {
    title: 'Two-Hand Synthesis • Repertoire Mastery',
    subtitle:
      'Combine Soloist melody reading with Left-Hand bass and chords in iconic classical and contemporary arrangements.',
    badgeColor: 'bg-[#E5A93C]/15 text-[#E5A93C] border-[#E5A93C]/30',
    borderColor: 'border-[#E5A93C]/40',
    accentColor: '#E5A93C',
  },
};

export const CurriculumMapView: React.FC<CurriculumMapViewProps> = ({
  lessons,
  activeLessonId,
  lessonProgress,
  recommendedVideos,
  watchedVideoIds,
  workouts,
  currentlyHeldMidis = [],
  onVirtualNoteOn,
  onVirtualNoteOff,
  onSelectLesson,
  onOpenVideo,
  onOpenWorkout,
}) => {
  const activeLesson =
    lessons.find((l) => l.id === activeLessonId) ?? lessons[0];
  const activeProgress = lessonProgress[activeLesson.id];
  const completedStepsCount = activeProgress?.completedStepNumbers?.length ?? 0;
  const nextStepIndex = Math.min(4, completedStepsCount);

  const renderTrackSection = (trackId: CurriculumTrackId) => {
    const trackLessons = lessons.filter((l) => l.trackId === trackId);
    const meta = TRACK_META[trackId];

    return (
      <section key={trackId} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#F5F2EB]/10 pb-3">
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${meta.badgeColor}`}
            >
              {meta.title}
            </span>
            <p className="text-xs sm:text-sm text-[#B8B2A6] mt-1.5">
              {meta.subtitle}
            </p>
          </div>
          <div className="text-xs font-tabular text-[#7D8494]">
            {trackLessons.length} Progressive Courses
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackLessons.map((lesson) => {
            const prog = lessonProgress[lesson.id];
            const stars = prog?.starsEarned ?? 0;
            const stepsDone = prog?.completedStepNumbers?.length ?? 0;
            const isCurrent = lesson.id === activeLesson.id;
            const troubleCount = prog?.lastDiagnosis?.troubleMeasures?.length ?? 0;

            return (
              <div
                key={lesson.id}
                className={`rounded-2xl p-5 bg-[#161922] border transition-all flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'border-[#E5A93C] shadow-lg shadow-[#E5A93C]/5'
                    : 'border-[#F5F2EB]/10 hover:border-[#F5F2EB]/25'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#0D0F14] font-tabular text-xs font-bold text-[#E5A93C] border border-[#F5F2EB]/10">
                        UNIT 0{lesson.unitNumber}
                      </span>
                      <span className="text-xs font-medium text-[#B8B2A6]">
                        {lesson.difficulty}
                      </span>
                    </div>

                    {/* 3-Star Mastery Rating */}
                    <div className="flex items-center gap-1" title={`${stars}/3 Stars Earned`}>
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= stars
                              ? 'fill-[#E5A93C] text-[#E5A93C]'
                              : 'text-[#282D3E]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lesson Title & Description */}
                  <div>
                    <h3 className="font-editorial text-xl font-semibold text-[#F5F2EB]">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-[#E5A93C] font-medium mt-0.5">
                      {lesson.subtitle}
                    </p>
                    <p className="text-xs text-[#B8B2A6] mt-2 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Skills & Target Notes Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lesson.skillsTaught.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-[#0D0F14] border border-[#F5F2EB]/10 text-[11px] text-[#B8B2A6]"
                      >
                        {skill}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-md bg-[#1E2230] text-[11px] font-tabular font-semibold text-[#38BDF8]">
                      Notes: {lesson.targetNotes.join(' · ')}
                    </span>
                  </div>
                </div>

                {/* 5-Step Micro-Stage Progress Bar & Actions */}
                <div className="pt-3 border-t border-[#F5F2EB]/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#B8B2A6] font-medium">
                      5-Step Guided Flow ({stepsDone}/5 steps completed)
                    </span>
                    {troubleCount > 0 && (
                      <span className="text-[#F59E0B] font-semibold flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        {troubleCount} bar{troubleCount > 1 ? 's' : ''} to polish
                      </span>
                    )}
                  </div>

                  {/* Clickable 5 Steps */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {lesson.steps.map((st, idx) => {
                      const isDone = prog?.completedStepNumbers?.includes(st.stepNumber);
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => onSelectLesson(lesson.id, idx)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold truncate border text-center transition-colors ${
                            isDone
                              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                              : 'bg-[#0D0F14] border-[#F5F2EB]/10 text-[#B8B2A6] hover:border-[#E5A93C]/50 hover:text-[#F5F2EB]'
                          }`}
                          title={`Step ${st.stepNumber}: ${st.title}`}
                        >
                          {st.stepNumber}. {st.title.split(':')[0]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenVideo(lesson.primaryVideoId)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D0F14] hover:bg-[#1E2230] text-xs font-semibold text-[#10B981] border border-[#10B981]/30 transition-colors"
                    >
                      <PlaySquare className="w-3.5 h-3.5" />
                      <span>Watch Video Guide</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson.id, Math.min(4, stepsDone))}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E5A93C] hover:bg-[#F3C66F] text-xs font-semibold text-[#0D0F14] shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{stepsDone > 0 ? 'Continue Lesson' : 'Start Lesson'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Hero: Current Conservatory Session + Personalized Coach & Video Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Lesson Resume Banner */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#161922] via-[#161922] to-[#1E2230] border border-[#E5A93C]/40 p-6 flex flex-col justify-between gap-5 shadow-xl">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E5A93C]/15 text-[#E5A93C] border border-[#E5A93C]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Current Conservatory Session • Unit 0{activeLesson.unitNumber}</span>
              </span>
              <span className="font-tabular text-xs text-[#B8B2A6]">
                Tempo: {activeLesson.score.bpm} BPM • Time: {activeLesson.score.timeSignature[0]}/
                {activeLesson.score.timeSignature[1]}
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#F5F2EB]">
              {activeLesson.title}
            </h1>
            <p className="text-sm text-[#B8B2A6] max-w-2xl leading-relaxed">
              {activeLesson.description}
            </p>
          </div>

          {/* Active Step Preview Card */}
          <div className="bg-[#0D0F14]/90 border border-[#F5F2EB]/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#38BDF8]">
                Up Next — Step {activeLesson.steps[nextStepIndex]?.stepNumber}:{' '}
                {activeLesson.steps[nextStepIndex]?.title}
              </div>
              <p className="text-xs text-[#B8B2A6]">
                {activeLesson.steps[nextStepIndex]?.instruction}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenVideo(activeLesson.primaryVideoId)}
                className="px-3.5 py-2.5 rounded-xl bg-[#161922] hover:bg-[#1E2230] text-xs font-semibold text-[#F5F2EB] border border-[#F5F2EB]/15 transition-colors"
              >
                Watch Step 1 Video
              </button>
              <button
                type="button"
                onClick={() => onSelectLesson(activeLesson.id, nextStepIndex)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#F3C66F] text-[#0D0F14] font-semibold text-xs sm:text-sm shadow-md transition-colors"
              >
                <span>Enter Practice Stage</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Video Tutorials & 5-Min Daily Workouts */}
        <div className="rounded-2xl bg-[#161922] border border-[#F5F2EB]/10 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#10B981]">
                <PlaySquare className="w-4 h-4" />
                <span>Recommended Video Tutorials</span>
              </div>
              <span className="text-[11px] text-[#7D8494]">Interactive + Overhead</span>
            </div>

            <div className="space-y-2.5">
              {recommendedVideos.slice(0, 3).map((vid) => {
                const watched = watchedVideoIds.includes(vid.id);
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => onOpenVideo(vid.id)}
                    className="w-full text-left p-3 rounded-xl bg-[#0D0F14] hover:bg-[#1E2230] border border-[#F5F2EB]/10 hover:border-[#10B981]/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-[#F5F2EB] group-hover:text-[#10B981] transition-colors">
                        {vid.title}
                      </div>
                      <span className="font-tabular text-[11px] text-[#E5A93C] shrink-0">
                        {vid.durationLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#7D8494]">
                      <span>{vid.instructor}</span>
                      {watched ? (
                        <span className="text-[#10B981] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Watched
                        </span>
                      ) : (
                        <span className="text-[#38BDF8]">Interactive Demo →</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick 5-Minute Workout Launchers */}
          <div className="pt-3 border-t border-[#F5F2EB]/10 space-y-2">
            <div className="text-xs font-semibold text-[#EC4899] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>5-Minute Skill Workouts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {workouts.map((wk) => (
                <button
                  key={wk.id}
                  type="button"
                  onClick={() => onOpenWorkout(wk.id)}
                  className="p-2.5 rounded-xl bg-[#0D0F14] hover:bg-[#1E2230] border border-[#F5F2EB]/10 text-left transition-colors"
                >
                  <div className="text-[11px] font-semibold text-[#F5F2EB] truncate">
                    {wk.title.replace('Note ', '').replace(' Turbo', '')}
                  </div>
                  <div className="text-[10px] text-[#7D8494] mt-0.5">Start 5m →</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Tracks: Soloist Path, Chords Path, and Two-Hand Synthesis */}
      <div className="space-y-10">
        {renderTrackSection('soloist')}
        {renderTrackSection('chords')}
        {renderTrackSection('synthesis')}
      </div>

      {/* Live Conservatory Instrument Test Keybed Strip */}
      <section className="rounded-2xl bg-[#161922] border border-[#F5F2EB]/10 overflow-hidden shadow-xl">
        <div className="px-4 py-2 bg-[#0D0F14] border-b border-[#F5F2EB]/10 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#E5A93C]">
            🎹 Live Instrument Readiness Keybed (C3 – B5) • Test your Microphone, MIDI Keyboard, or QWERTY Keys anytime
          </span>
          <span className="text-[#7D8494] font-tabular hidden sm:inline">
            Middle C4 = [Q] • White Keys = [Q..P] &amp; [Z..M]
          </span>
        </div>
        <InteractiveKeyboard
          compact={true}
          currentlyHeldMidis={currentlyHeldMidis}
          showNoteNames={true}
          showQwertyLabels={true}
          onNoteOn={(midi, vel) => onVirtualNoteOn?.(midi, vel)}
          onNoteOff={(midi) => onVirtualNoteOff?.(midi)}
        />
      </section>
    </div>
  );
};
