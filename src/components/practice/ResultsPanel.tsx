import React from 'react';
import type { CoachDiagnosisReport } from '../../types';
import { COPY, practiseBarLabel } from '../copy';
import { BTN_PRIMARY, BTN_SECONDARY } from './PromptCard';

export type ResultsKind = 'step' | 'song' | 'bar' | 'demo';

export interface ResultsPanelProps {
  kind: ResultsKind;
  isDiscovery: boolean;
  /** False when a timed step reached the end with nothing played. */
  played: boolean;
  report: CoachDiagnosisReport | null;
  keysFound?: number;
  /** Shown only when the step was really marked done. */
  nextLabel?: string | null;
  barNumber?: number | null;
  onNext(): void;
  onReplay(): void;
  onPractiseBar(m: number): void;
  onOpenTips(): void;
  onSkipStep(): void;
  onHome(): void;
  onPlayYourself(): void;
  onBackToFull(): void;
  /** Rendered inside a Sheet that already shows the headline as its title. */
  hideHeadline?: boolean;
}

/** The panel's headline; also used as the Sheet title in landscape. */
export function resultsHeadline(kind: ResultsKind, played: boolean, barNumber?: number | null): string {
  if (!played) return COPY.nothingPlayed;
  if (kind === 'demo') return 'That was the whole piece';
  if (kind === 'song') return COPY.songDone;
  if (kind === 'bar') return `Bar ${(barNumber ?? 0) + 1} done`;
  return COPY.stepDone;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-brass tracking-wider" aria-label={`${n} of 3 stars`}>
      {'★'.repeat(n)}
      <span className="text-ink-muted">{'☆'.repeat(3 - n)}</span>
    </span>
  );
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  kind,
  isDiscovery,
  played,
  report,
  keysFound,
  nextLabel,
  barNumber,
  onNext,
  onReplay,
  onPractiseBar,
  onOpenTips,
  onSkipStep,
  onHome,
  onPlayYourself,
  onBackToFull,
  hideHeadline = false,
}) => {
  const big = 'h-[52px] w-full text-md-20';

  if (!played) {
    return (
      <section aria-live="polite" className="flex flex-col gap-3">
        {!hideHeadline && <h2 className="font-serif text-xl-31 font-semibold text-ink-primary">{COPY.nothingPlayed}</h2>}
        <p className="text-base text-ink-secondary">The music reached the end before any right notes were heard.</p>
        <button type="button" className={`${BTN_PRIMARY} ${big}`} onClick={onReplay}>
          {COPY.playAgain}
        </button>
        {kind === 'step' && (
          <button type="button" className={BTN_SECONDARY} onClick={onSkipStep}>
            {COPY.skipStep}
          </button>
        )}
      </section>
    );
  }

  if (kind === 'demo') {
    return (
      <section aria-live="polite" className="flex flex-col gap-3">
        {!hideHeadline && (
          <h2 className="font-serif text-xl-31 font-semibold text-ink-primary motion-safe:animate-[fadeIn_200ms_ease-out]">
            That was the whole piece
          </h2>
        )}
        <button type="button" className={`${BTN_PRIMARY} ${big}`} onClick={onPlayYourself}>
          {COPY.playItYourself}
        </button>
        <button type="button" className={BTN_SECONDARY} onClick={onReplay}>
          {COPY.playAgain}
        </button>
      </section>
    );
  }

  const totals = report?.measureSummaries.reduce(
    (acc, m) => ({ total: acc.total + m.totalNotes, first: acc.first + m.firstTryCount }),
    { total: 0, first: 0 }
  );
  const trouble = kind !== 'bar' ? report?.troubleMeasures[0] : undefined;
  // A bar can be flagged for timing alone; don't say it "needed help" when every note was right.
  const troubleSummary = trouble !== undefined ? report?.measureSummaries.find((m) => m.measureIndex === trouble) : undefined;
  const troubleIsTiming =
    !!troubleSummary && troubleSummary.totalNotes > 0 && troubleSummary.firstTryCount === troubleSummary.totalNotes;
  const headline = resultsHeadline(kind, played, barNumber);

  return (
    <section aria-live="polite" className="flex flex-col gap-3">
      {!hideHeadline && (
        <h2 className="font-serif text-xl-31 font-semibold text-state-ok motion-safe:animate-[fadeIn_200ms_ease-out]">
          {headline}
        </h2>
      )}
      {isDiscovery ? (
        <p className="text-base text-ink-secondary">
          You found all {keysFound ?? 0} keys.
        </p>
      ) : (
        report &&
        totals && (
          <p className="text-base text-ink-secondary tabular-nums">
            {totals.first} of {totals.total} right first time · <Stars n={report.starsEarned} />
          </p>
        )
      )}
      {trouble !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base text-ink-secondary">
            {troubleIsTiming ? `Bar ${trouble + 1} was a little off the beat.` : `Bar ${trouble + 1} needed help.`}
          </p>
          <button type="button" className={BTN_SECONDARY} onClick={() => onPractiseBar(trouble)}>
            {practiseBarLabel(trouble)}
          </button>
        </div>
      )}
      {kind === 'step' && nextLabel && (
        <button type="button" className={`${BTN_PRIMARY} ${big}`} onClick={onNext}>
          {nextLabel}
        </button>
      )}
      {kind === 'song' && (
        <button type="button" className={`${BTN_PRIMARY} ${big}`} onClick={onHome}>
          {COPY.backToHome}
        </button>
      )}
      {kind === 'bar' && (
        <button type="button" className={`${BTN_PRIMARY} ${big}`} onClick={onBackToFull}>
          {COPY.backToFullPiece}
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={BTN_SECONDARY} onClick={onReplay}>
          {COPY.playAgain}
        </button>
        {!isDiscovery && (
          <button type="button" className={BTN_SECONDARY} onClick={onOpenTips}>
            {COPY.whatToWorkOn}
          </button>
        )}
      </div>
    </section>
  );
};

export default ResultsPanel;
