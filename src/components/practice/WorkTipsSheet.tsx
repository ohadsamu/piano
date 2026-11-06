import React from 'react';
import { Play } from 'lucide-react';
import type { CoachDiagnosisReport, VideoLesson } from '../../types';
import { Sheet } from '../shell/Sheet';
import { COPY, practiseBarLabel } from '../copy';
import { BTN_PRIMARY, BTN_SECONDARY } from './PromptCard';

export interface WorkTipsSheetProps {
  open: boolean;
  report: CoachDiagnosisReport | null;
  videos: VideoLesson[];
  onClose(): void;
  /** Practise bar N (spec §4.3 rule 9). */
  onPractise(measureIndex: number): void;
  onWatch(videoId: string): void;
}

/** "What to work on". Never opens by itself. */
export const WorkTipsSheet: React.FC<WorkTipsSheetProps> = ({ open, report, videos, onClose, onPractise, onWatch }) => {
  const issues = report?.detectedIssues.slice(0, 3) ?? [];
  const bar = report?.remediationPlan?.measureRange[0] ?? report?.troubleMeasures[0];
  const recommended = (report?.recommendedVideos ?? [])
    .map((id) => videos.find((v) => v.id === id))
    .filter((v): v is VideoLesson => Boolean(v))
    .slice(0, 3);
  const maxTrouble = Math.max(1, ...(report?.measureSummaries.map((m) => m.troubleScore) ?? [1]));

  return (
    <Sheet open={open} title={COPY.whatToWorkOn} onClose={onClose}>
      {!report ? (
        <p className="text-base text-ink-secondary">{COPY.noTips}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {report.measureSummaries.length > 0 && (
            <div>
              <h3 className="text-xs-13 text-ink-muted pb-2">How each bar went</h3>
              <ol className="flex gap-1" aria-label="Bar health">
                {report.measureSummaries.map((m) => {
                  const t = m.troubleScore / maxTrouble;
                  const tone = m.missedCount > 0 || t > 0.6 ? 'bg-state-wrong' : t > 0.25 ? 'bg-state-hint' : 'bg-state-ok';
                  return (
                    <li
                      key={m.measureIndex}
                      className={`flex-1 h-3 rounded-sm ${tone}`}
                      title={`Bar ${m.measureIndex + 1}: ${m.firstTryCount} of ${m.totalNotes} right first time`}
                      aria-label={`Bar ${m.measureIndex + 1}: ${m.firstTryCount} of ${m.totalNotes} right first time`}
                    />
                  );
                })}
              </ol>
            </div>
          )}
          {issues.length === 0 ? (
            <p className="text-base text-ink-secondary">{report.encouragementHeadline}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {issues.map((i) => (
                <li key={i.category} className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-ink-primary">{i.title}</h3>
                  <p className="text-base text-ink-secondary leading-snug">{i.actionableFixTip}</p>
                </li>
              ))}
            </ul>
          )}
          {bar !== undefined && (
            <button
              type="button"
              className={`${BTN_PRIMARY} w-full`}
              onClick={() => {
                onClose();
                onPractise(bar);
              }}
            >
              {practiseBarLabel(bar)}
            </button>
          )}
          {recommended.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs-13 text-ink-muted">Videos that help</h3>
              {recommended.map((v) => (
                <button key={v.id} type="button" className={`${BTN_SECONDARY} justify-start gap-2 w-full`} onClick={() => onWatch(v.id)}>
                  <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{v.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
};

export default WorkTipsSheet;
