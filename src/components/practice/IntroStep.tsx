import React from 'react';
import { Play } from 'lucide-react';
import type { LessonStep, VideoLesson } from '../../types';
import { COPY } from '../copy';
import { BTN_PRIMARY, BTN_SECONDARY } from './PromptCard';

export interface IntroStepProps {
  step: LessonStep;
  video?: VideoLesson | null;
  nextLabel: string;
  onWatch(): void;
  onNext(): void;
}

export const IntroStep: React.FC<IntroStepProps> = ({ step, video, nextLabel, onWatch, onNext }) => (
  <section className="flex flex-col gap-4 max-w-prose">
    <p className="text-md-20 text-ink-primary leading-snug line-clamp-4">{step.instruction}</p>
    {video && (
      <button type="button" className={`${BTN_SECONDARY} self-start gap-2`} onClick={onWatch}>
        <Play className="w-4 h-4" aria-hidden="true" />
        {COPY.watchIntro} ({video.durationLabel})
      </button>
    )}
    <button type="button" className={`${BTN_PRIMARY} h-[52px] text-md-20 w-full sm:w-auto sm:self-start`} onClick={onNext}>
      {nextLabel}
    </button>
  </section>
);

export default IntroStep;
