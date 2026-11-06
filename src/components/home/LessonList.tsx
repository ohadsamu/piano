import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { CurriculumTrackId, Lesson } from '../../types';
import type { LessonProgressRecord } from '../../utils/storage';
import { lessonProgress } from '../../utils/progress';

export interface LessonListProps {
  lessons: Lesson[];
  progress: Record<string, LessonProgressRecord>;
  activeLessonId?: string;
  onOpen(lessonId: string): void;
}

const TRACK_LABEL: Record<CurriculumTrackId, string> = {
  soloist: 'Melody',
  chords: 'Chords',
  synthesis: 'Both hands',
};

export const LessonList: React.FC<LessonListProps> = ({ lessons, progress, activeLessonId, onOpen }) => {
  const tracks = Array.from(new Set(lessons.map((l) => l.trackId)));
  return (
    <div className="flex flex-col gap-4">
      {tracks.map((track) => (
        <div key={track}>
          <h3 className="px-1 pb-1 text-xs-13 text-ink-muted">{TRACK_LABEL[track]}</h3>
          <ul className="divide-y divide-ink-primary/10 border-y border-ink-primary/10">
            {lessons
              .filter((l) => l.trackId === track)
              .map((l) => {
                const record = progress[l.id];
                const p = lessonProgress(l, record);
                const stars = record?.starsEarned ?? 0;
                const active = l.id === activeLessonId;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(l.id)}
                      className="w-full min-h-14 py-2 flex items-center gap-3 px-1 text-left hover:bg-ebony-spruce/60"
                    >
                      <span
                        aria-hidden="true"
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs-13 tabular-nums ${
                          p.state === 'done'
                            ? 'bg-state-ok text-ebony-void'
                            : p.state === 'started' || active
                            ? 'border-2 border-brass text-brass'
                            : 'border border-ink-muted text-ink-muted'
                        }`}
                      >
                        {p.state === 'done' ? <Check className="w-4 h-4" strokeWidth={3} /> : l.unitNumber}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-base text-ink-primary leading-snug">{l.title}</span>
                        <span className="block text-xs-13 text-ink-secondary tabular-nums">
                          {p.state === 'done' ? (
                            <span aria-label={`Done, ${stars} of 3 stars`}>
                              Done · <span className="text-brass">{'★'.repeat(stars)}</span>
                              <span className="text-ink-muted">{'☆'.repeat(3 - stars)}</span>
                            </span>
                          ) : (
                            `${p.doneCount} of ${p.total} steps`
                          )}
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 shrink-0 text-ink-muted" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default LessonList;
