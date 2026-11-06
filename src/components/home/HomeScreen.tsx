import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Lesson } from '../../types';
import type { SongLibraryEntry } from '../../data/songLibraryData';
import type { LessonProgressRecord } from '../../utils/storage';
import { firstIncompleteStepIndex, lessonProgress } from '../../utils/progress';
import { COPY } from '../copy';
import { ContinueCard } from './ContinueCard';
import { LessonList } from './LessonList';

export interface HomeScreenProps {
  lessons: Lesson[];
  songs: SongLibraryEntry[];
  progress: Record<string, LessonProgressRecord>;
  activeLessonId: string;
  onOpenLesson(lessonId: string, stepIndex: number): void;
  onOpenSong(songId: string): void;
  onOpenDrills(): void;
}

const GENRES: SongLibraryEntry['genre'][] = ['Classical', 'Folk & Traditional', 'Pop & Film'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lessons,
  songs,
  progress,
  activeLessonId,
  onOpenLesson,
  onOpenSong,
  onOpenDrills,
}) => {
  // Continue the active lesson, or the next one that isn't finished.
  const activeIdx = Math.max(0, lessons.findIndex((l) => l.id === activeLessonId));
  const ordered = [...lessons.slice(activeIdx), ...lessons.slice(0, activeIdx)];
  const current = ordered.find((l) => lessonProgress(l, progress[l.id]).state !== 'done') ?? lessons[activeIdx];
  const currentStep = firstIncompleteStepIndex(current, progress[current.id]);
  const open = (id: string) => {
    const l = lessons.find((x) => x.id === id)!;
    onOpenLesson(id, firstIncompleteStepIndex(l, progress[id]));
  };

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-5 flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-base text-ink-secondary">
          {Object.values(progress).some((r) => (r?.completedStepNumbers?.length ?? 0) > 0) ? COPY.pickUp : COPY.startHere}
        </h2>
        <ContinueCard
          lesson={current}
          stepIndex={currentStep}
          doneCount={lessonProgress(current, progress[current.id]).doneCount}
          onContinue={() => onOpenLesson(current.id, currentStep)}
        />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="lessons-h">
        <h2 id="lessons-h" className="font-serif text-lg-25 font-semibold">{COPY.lessons}</h2>
        <LessonList lessons={lessons} progress={progress} activeLessonId={current.id} onOpen={open} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="songs-h">
        <h2 id="songs-h" className="font-serif text-lg-25 font-semibold">{COPY.songs}</h2>
        {GENRES.map((g) => {
          const list = songs.filter((s) => s.genre === g);
          if (list.length === 0) return null;
          return (
            <div key={g}>
              <h3 className="px-1 pb-1 text-xs-13 text-ink-muted">{g}</h3>
              <ul className="divide-y divide-ink-primary/10 border-y border-ink-primary/10">
                {list.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onOpenSong(s.id)}
                      className="w-full min-h-14 py-2 px-1 flex items-center gap-3 text-left hover:bg-ebony-spruce/60"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-base text-ink-primary">{s.title}</span>
                        <span className="block text-xs-13 text-ink-secondary">{s.artist}</span>
                      </span>
                      <ChevronRight className="w-5 h-5 shrink-0 text-ink-muted" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section>
        <button
          type="button"
          onClick={onOpenDrills}
          className="w-full min-h-14 px-4 flex items-center gap-3 rounded-panel bg-ebony-spruce border border-ink-primary/10 text-left hover:border-ink-primary/25"
        >
          <span className="flex-1">
            <span className="block text-base font-semibold text-ink-primary">{COPY.quickDrills}</span>
            <span className="block text-xs-13 text-ink-secondary">{COPY.quickDrillsHint}</span>
          </span>
          <ChevronRight className="w-5 h-5 text-ink-muted" aria-hidden="true" />
        </button>
      </section>
    </main>
  );
};

export default HomeScreen;
